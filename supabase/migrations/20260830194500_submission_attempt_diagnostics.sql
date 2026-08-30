-- Normalize optional submission-attempt diagnostic text so persisted audit data is usable.
UPDATE public.submission_attempts
SET automation_provider = NULLIF(btrim(automation_provider), ''),
    error_category = NULLIF(btrim(error_category), ''),
    error_message = NULLIF(btrim(error_message), '')
WHERE (automation_provider IS NOT NULL AND automation_provider <> btrim(automation_provider))
   OR (automation_provider IS NOT NULL AND btrim(automation_provider) = '')
   OR (error_category IS NOT NULL AND error_category <> btrim(error_category))
   OR (error_category IS NOT NULL AND btrim(error_category) = '')
   OR (error_message IS NOT NULL AND error_message <> btrim(error_message))
   OR (error_message IS NOT NULL AND btrim(error_message) = '');

ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_automation_provider_nonblank
  CHECK (automation_provider IS NULL OR automation_provider = btrim(automation_provider) AND automation_provider <> ''),
  ADD CONSTRAINT submission_attempts_error_category_nonblank
  CHECK (error_category IS NULL OR error_category = btrim(error_category) AND error_category <> ''),
  ADD CONSTRAINT submission_attempts_error_message_nonblank
  CHECK (error_message IS NULL OR error_message = btrim(error_message) AND error_message <> '');
