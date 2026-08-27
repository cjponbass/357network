-- Ensure AI analyses/materials can reference only jobs/applications owned by the same user.
-- This complements owner-scoped RLS by enforcing relationship integrity for trusted/server writes too.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.job_analyses ja
    JOIN public.jobs j ON j.id = ja.job_id
    WHERE j.created_by <> ja.user_id
  ) THEN
    RAISE EXCEPTION 'Existing job analysis/job ownership mismatch detected; migration stopped';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.application_materials am
    JOIN public.jobs j ON j.id = am.job_id
    WHERE j.created_by <> am.user_id
  ) THEN
    RAISE EXCEPTION 'Existing application material/job ownership mismatch detected; migration stopped';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.application_materials am
    JOIN public.applications a ON a.id = am.application_id
    WHERE am.application_id IS NOT NULL
      AND a.user_id <> am.user_id
  ) THEN
    RAISE EXCEPTION 'Existing application material/application ownership mismatch detected; migration stopped';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_job_analysis_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_owner uuid;
BEGIN
  SELECT j.created_by INTO job_owner
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

REVOKE ALL ON FUNCTION public.enforce_job_analysis_owner() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_job_analyses_owner ON public.job_analyses;
CREATE TRIGGER trg_job_analyses_owner
BEFORE INSERT OR UPDATE OF job_id, user_id ON public.job_analyses
FOR EACH ROW EXECUTE FUNCTION public.enforce_job_analysis_owner();

CREATE OR REPLACE FUNCTION public.enforce_application_material_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_owner uuid;
  application_owner uuid;
BEGIN
  SELECT j.created_by INTO job_owner
  FROM public.jobs j
  WHERE j.id = NEW.job_id;

  IF job_owner IS NULL THEN
    RAISE EXCEPTION 'Job % does not exist', NEW.job_id USING ERRCODE = '23503';
  END IF;

  IF job_owner <> NEW.user_id THEN
    RAISE EXCEPTION 'Job % does not belong to user %', NEW.job_id, NEW.user_id USING ERRCODE = '23514';
  END IF;

  IF NEW.application_id IS NOT NULL THEN
    SELECT a.user_id INTO application_owner
    FROM public.applications a
    WHERE a.id = NEW.application_id;

    IF application_owner IS NULL THEN
      RAISE EXCEPTION 'Application % does not exist', NEW.application_id USING ERRCODE = '23503';
    END IF;

    IF application_owner <> NEW.user_id THEN
      RAISE EXCEPTION 'Application % does not belong to user %', NEW.application_id, NEW.user_id USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.id = NEW.application_id
        AND a.job_id = NEW.job_id
    ) THEN
      RAISE EXCEPTION 'Application % does not belong to job %', NEW.application_id, NEW.job_id USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_application_material_owner() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_application_materials_owner ON public.application_materials;
CREATE TRIGGER trg_application_materials_owner
BEFORE INSERT OR UPDATE OF job_id, application_id, user_id ON public.application_materials
FOR EACH ROW EXECUTE FUNCTION public.enforce_application_material_owner();
