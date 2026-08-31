-- A submission attempt that stops for required user action is no longer running.
-- It may therefore carry completed_at for that execution cycle even though the
-- workflow can later be re-queued after the candidate supplies the missing input.
-- Queued/running/draft live attempts must still never appear completed.

UPDATE public.submission_attempts
SET completed_at = COALESCE(completed_at, updated_at, started_at, created_at)
WHERE state = 'needs_user_input'
  AND completed_at IS NULL;

ALTER TABLE public.submission_attempts
  DROP CONSTRAINT IF EXISTS submission_attempts_nonterminal_not_completed_check;

ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_nonterminal_not_completed_check
  CHECK (
    state NOT IN ('draft', 'queued', 'running')
    OR completed_at IS NULL
    OR (
      dry_run = true
      AND state = 'queued'
    )
  );
