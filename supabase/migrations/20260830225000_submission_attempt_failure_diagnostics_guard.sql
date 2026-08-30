-- Keep failed submission attempts actionable and auditable.
-- A terminal failure should never exist without a category and human-readable detail.

UPDATE public.submission_attempts
SET
  error_category = COALESCE(NULLIF(btrim(error_category), ''), 'unknown_failure'),
  error_message = COALESCE(NULLIF(btrim(error_message), ''), 'Submission attempt failed without diagnostic details.')
WHERE state = 'failed'
  AND (
    error_category IS NULL
    OR btrim(error_category) = ''
    OR error_message IS NULL
    OR btrim(error_message) = ''
  );

ALTER TABLE public.submission_attempts
  DROP CONSTRAINT IF EXISTS submission_attempts_failed_diagnostics_check;

ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_failed_diagnostics_check
  CHECK (
    state <> 'failed'
    OR (
      error_category IS NOT NULL
      AND btrim(error_category) <> ''
      AND error_message IS NOT NULL
      AND btrim(error_message) <> ''
    )
  );