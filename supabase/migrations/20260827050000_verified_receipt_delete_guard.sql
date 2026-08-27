-- Verified submission receipts are audit evidence. Once verified, they must not be deleted.
-- Unverified rows may still be removed by trusted cleanup flows.
CREATE OR REPLACE FUNCTION public.prevent_verified_receipt_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.verified THEN
    RAISE EXCEPTION 'Verified submission receipts cannot be deleted';
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_verified_receipt_delete() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_submission_receipts_delete_guard ON public.submission_receipts;
CREATE TRIGGER trg_submission_receipts_delete_guard
BEFORE DELETE ON public.submission_receipts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_verified_receipt_delete();
