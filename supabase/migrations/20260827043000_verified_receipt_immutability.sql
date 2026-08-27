-- Verified submission receipts are evidence records. Once verified, their contents must not be rewritten.
-- Unverified rows may still be updated into a verified state by trusted server code.
CREATE OR REPLACE FUNCTION public.prevent_verified_receipt_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.verified THEN
    RAISE EXCEPTION 'Verified submission receipts are immutable';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_verified_receipt_mutation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_submission_receipts_immutable ON public.submission_receipts;
CREATE TRIGGER trg_submission_receipts_immutable
BEFORE UPDATE ON public.submission_receipts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_verified_receipt_mutation();
