-- A verified submission receipt is evidence of an employer-facing submission.
-- Only a succeeded attempt may retain a receipt reference; failed, cancelled,
-- readiness, queued, running, and draft attempts must not imply submission proof.

UPDATE public.submission_attempts
SET receipt_id = NULL
WHERE state <> 'succeeded'
  AND receipt_id IS NOT NULL;

ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_receipt_requires_success
  CHECK (receipt_id IS NULL OR state = 'succeeded');
