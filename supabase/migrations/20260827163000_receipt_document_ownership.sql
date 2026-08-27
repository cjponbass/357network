-- Keep verified receipt document references attached to the same user who owns the application.
-- Trusted/service-role writes bypass RLS, so enforce this relationship at the database boundary.

UPDATE public.submission_receipts r
SET resume_document_id = NULL
WHERE r.resume_document_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.documents d ON d.id = r.resume_document_id
    WHERE a.id = r.application_id
      AND d.user_id = a.user_id
  );

UPDATE public.submission_receipts r
SET cover_letter_document_id = NULL
WHERE r.cover_letter_document_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.documents d ON d.id = r.cover_letter_document_id
    WHERE a.id = r.application_id
      AND d.user_id = a.user_id
  );

CREATE OR REPLACE FUNCTION public.enforce_receipt_document_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  application_owner uuid;
  document_owner uuid;
BEGIN
  SELECT a.user_id
  INTO application_owner
  FROM public.applications a
  WHERE a.id = NEW.application_id;

  IF application_owner IS NULL THEN
    RAISE EXCEPTION 'Application % does not exist', NEW.application_id USING ERRCODE = '23503';
  END IF;

  IF NEW.resume_document_id IS NOT NULL THEN
    SELECT d.user_id
    INTO document_owner
    FROM public.documents d
    WHERE d.id = NEW.resume_document_id;

    IF document_owner IS NULL THEN
      RAISE EXCEPTION 'Resume document % does not exist', NEW.resume_document_id USING ERRCODE = '23503';
    END IF;

    IF document_owner <> application_owner THEN
      RAISE EXCEPTION 'Resume document % does not belong to application owner', NEW.resume_document_id USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.cover_letter_document_id IS NOT NULL THEN
    SELECT d.user_id
    INTO document_owner
    FROM public.documents d
    WHERE d.id = NEW.cover_letter_document_id;

    IF document_owner IS NULL THEN
      RAISE EXCEPTION 'Cover letter document % does not exist', NEW.cover_letter_document_id USING ERRCODE = '23503';
    END IF;

    IF document_owner <> application_owner THEN
      RAISE EXCEPTION 'Cover letter document % does not belong to application owner', NEW.cover_letter_document_id USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_receipt_document_owner() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_submission_receipts_document_owner ON public.submission_receipts;
CREATE TRIGGER trg_submission_receipts_document_owner
BEFORE INSERT OR UPDATE OF application_id, resume_document_id, cover_letter_document_id
ON public.submission_receipts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_receipt_document_owner();
