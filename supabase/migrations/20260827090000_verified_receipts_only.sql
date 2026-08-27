-- Treat submission_receipts as verified evidence only.
-- Failed/unverified automation evidence belongs in submission_attempts.evidence,
-- never in the receipt table.

-- Clear any legacy unverified receipt references first. The foreign key is
-- ON DELETE SET NULL, but making the intent explicit keeps the cleanup clear.
UPDATE public.submission_attempts a
SET receipt_id = NULL
FROM public.submission_receipts r
WHERE a.receipt_id = r.id
  AND r.verified IS NOT TRUE;

DELETE FROM public.submission_receipts
WHERE verified IS NOT TRUE;

ALTER TABLE public.submission_receipts
  DROP CONSTRAINT IF EXISTS submission_receipts_verified_only;

ALTER TABLE public.submission_receipts
  ADD CONSTRAINT submission_receipts_verified_only
  CHECK (verified IS TRUE);

COMMENT ON CONSTRAINT submission_receipts_verified_only ON public.submission_receipts IS
  'Submission receipts are evidence records and may exist only after concrete ATS submission verification.';
