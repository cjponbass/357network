-- A succeeded submission attempt represents a verified employer-facing submission,
-- never a dry run, and must not retain stale failure or unresolved-input state.
-- The existing success-receipt guard already requires a verified receipt for the
-- same application; this migration makes the rest of the persisted state agree.

UPDATE public.submission_attempts
SET dry_run = false,
    error_category = NULL,
    error_message = NULL,
    unresolved_questions = '[]'::jsonb
WHERE state = 'succeeded'
  AND (
    dry_run = true
    OR error_category IS NOT NULL
    OR error_message IS NOT NULL
    OR unresolved_questions <> '[]'::jsonb
  );

ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_success_not_dry_run
  CHECK (state <> 'succeeded' OR dry_run = false),
  ADD CONSTRAINT submission_attempts_success_has_no_error
  CHECK (state <> 'succeeded' OR (error_category IS NULL AND error_message IS NULL)),
  ADD CONSTRAINT submission_attempts_success_has_no_unresolved_questions
  CHECK (state <> 'succeeded' OR unresolved_questions = '[]'::jsonb);
