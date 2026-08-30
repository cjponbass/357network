-- Prevent in-progress submission attempts from looking completed.
-- Terminal states already require completed_at; this closes the inverse gap.

UPDATE public.submission_attempts
SET completed_at = NULL
WHERE state IN ('draft', 'queued', 'running', 'needs_user_input')
  AND completed_at IS NOT NULL;

ALTER TABLE public.submission_attempts
  DROP CONSTRAINT IF EXISTS submission_attempts_nonterminal_not_completed_check;

ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_nonterminal_not_completed_check
  CHECK (
    state NOT IN ('draft', 'queued', 'running', 'needs_user_input')
    OR completed_at IS NULL
  );
