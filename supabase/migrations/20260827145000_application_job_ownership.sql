-- Ensure an application can reference only a saved job owned by the same user.
-- This complements owner-scoped RLS on both applications and jobs by enforcing
-- the relationship at the database boundary for trusted/server writes too.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE j.created_by <> a.user_id
  ) THEN
    RAISE EXCEPTION 'Existing application/job ownership mismatch detected; migration stopped';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_application_job_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_owner uuid;
BEGIN
  SELECT j.created_by
  INTO job_owner
  FROM public.jobs j
  WHERE j.id = NEW.job_id;

  IF job_owner IS NULL THEN
    RAISE EXCEPTION 'Job % does not exist', NEW.job_id USING ERRCODE = '23503';
  END IF;

  IF job_owner <> NEW.user_id THEN
    RAISE EXCEPTION 'Job % does not belong to user %', NEW.job_id, NEW.user_id USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_application_job_owner() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_applications_job_owner ON public.applications;
CREATE TRIGGER trg_applications_job_owner
BEFORE INSERT OR UPDATE OF job_id, user_id ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.enforce_application_job_owner();
