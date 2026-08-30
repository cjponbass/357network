-- Readiness checks are completed dry-run diagnostics, not active employer submissions.
-- Preserve completed_at for those snapshots while continuing to forbid real
-- nonterminal submission attempts from appearing completed.

UPDATE public.submission_attempts
SET completed_at = COALESCE(completed_at, started_at, updated_at, created_at)
WHERE dry_run = true
  AND state IN ('queued', 'needs_user_input')
  AND completed_at IS NULL;

ALTER TABLE public.submission_attempts
  DROP CONSTRAINT IF EXISTS submission_attempts_nonterminal_not_completed_check;

ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_nonterminal_not_completed_check
  CHECK (
    state NOT IN ('draft', 'queued', 'running', 'needs_user_input')
    OR completed_at IS NULL
    OR (
      dry_run = true
      AND state IN ('queued', 'needs_user_input')
    )
  );
