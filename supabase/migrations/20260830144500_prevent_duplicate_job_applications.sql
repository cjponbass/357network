-- Keep the application tracker aligned with the product rule that a candidate
-- tracks at most one application for a given saved job. Existing duplicate
-- rows, if any, are left untouched; this guard prevents new duplicates and
-- duplicate-producing retargets without destructively rewriting history.

CREATE OR REPLACE FUNCTION public.prevent_duplicate_job_application()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Serialize competing writes for the same candidate/job pair so two direct
  -- API requests cannot both pass the existence check concurrently.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW.user_id::text || ':' || NEW.job_id::text, 0)
  );

  IF EXISTS (
    SELECT 1
    FROM public.applications AS existing
    WHERE existing.user_id = NEW.user_id
      AND existing.job_id = NEW.job_id
      AND (TG_OP = 'INSERT' OR existing.id <> NEW.id)
  ) THEN
    RAISE EXCEPTION 'An application is already tracked for this saved job.'
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_duplicate_job_application() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_duplicate_job_application ON public.applications;
CREATE TRIGGER prevent_duplicate_job_application
BEFORE INSERT OR UPDATE OF user_id, job_id ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.prevent_duplicate_job_application();
