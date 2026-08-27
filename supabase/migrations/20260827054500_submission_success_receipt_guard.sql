-- A submission attempt may only be marked succeeded when it is backed by a
-- verified receipt for the same tracked application. This prevents trusted
-- server code (or a future regression) from persisting a receipt-less or
-- mismatched success state.

CREATE OR REPLACE FUNCTION public.enforce_submission_success_receipt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.state = 'succeeded' THEN
    IF NEW.receipt_id IS NULL THEN
      RAISE EXCEPTION 'A succeeded submission attempt requires a verified receipt';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.submission_receipts r
      WHERE r.id = NEW.receipt_id
        AND r.application_id = NEW.application_id
        AND r.verified = true
    ) THEN
      RAISE EXCEPTION 'Submission receipt must be verified and belong to the same application';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_submission_success_receipt_guard ON public.submission_attempts;
CREATE TRIGGER trg_submission_success_receipt_guard
BEFORE INSERT OR UPDATE OF state, receipt_id, application_id
ON public.submission_attempts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_submission_success_receipt();
