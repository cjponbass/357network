-- Keep every submission attempt receipt attached to the same application.
-- This applies to all attempt states, not only succeeded attempts.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.submission_attempts sa
    JOIN public.submission_receipts sr ON sr.id = sa.receipt_id
    WHERE sa.receipt_id IS NOT NULL
      AND sr.application_id <> sa.application_id
  ) THEN
    RAISE EXCEPTION 'submission_attempts contains receipt references for a different application';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_attempt_receipt_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  receipt_application uuid;
BEGIN
  IF NEW.receipt_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT sr.application_id
  INTO receipt_application
  FROM public.submission_receipts sr
  WHERE sr.id = NEW.receipt_id;

  IF receipt_application IS NULL THEN
    RAISE EXCEPTION 'Submission receipt % does not exist', NEW.receipt_id;
  END IF;

  IF receipt_application <> NEW.application_id THEN
    RAISE EXCEPTION 'Submission receipt must belong to the same application as the submission attempt';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_attempt_receipt_application() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_attempt_receipt_application() TO service_role;

DROP TRIGGER IF EXISTS trg_attempt_receipt_application_integrity ON public.submission_attempts;
CREATE TRIGGER trg_attempt_receipt_application_integrity
BEFORE INSERT OR UPDATE OF application_id, receipt_id
ON public.submission_attempts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_attempt_receipt_application();
