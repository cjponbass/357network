-- Keep application lifecycle state internally consistent.
-- Any application that has progressed beyond draft must have a submission timestamp.

UPDATE public.applications
SET submitted_at = COALESCE(submitted_at, updated_at, created_at, now())
WHERE status <> 'draft'::public.application_status
  AND submitted_at IS NULL;

CREATE OR REPLACE FUNCTION public.ensure_application_submission_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> 'draft'::public.application_status
     AND NEW.submitted_at IS NULL THEN
    NEW.submitted_at := now();
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_application_submission_timestamp() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_applications_submission_timestamp ON public.applications;
CREATE TRIGGER trg_applications_submission_timestamp
BEFORE INSERT OR UPDATE OF status, submitted_at ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.ensure_application_submission_timestamp();

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_non_draft_submitted_at_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_non_draft_submitted_at_check
  CHECK (
    status = 'draft'::public.application_status
    OR submitted_at IS NOT NULL
  );
