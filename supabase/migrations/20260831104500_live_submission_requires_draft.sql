-- Prevent live automation from entering queued/running states after the application tracker leaves Draft.
-- Dry-run readiness snapshots remain allowed for non-draft applications because they do not contact an employer.

CREATE OR REPLACE FUNCTION public.enforce_live_submission_requires_draft()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  application_status text;
BEGIN
  IF NEW.dry_run = false AND NEW.state IN ('queued', 'running') THEN
    SELECT a.status
      INTO application_status
      FROM public.applications AS a
     WHERE a.id = NEW.application_id
       AND a.user_id = NEW.user_id;

    IF application_status IS DISTINCT FROM 'draft' THEN
      RAISE EXCEPTION 'Live submission attempts may only be queued or run while the application is in draft status.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS submission_attempts_live_requires_draft ON public.submission_attempts;
CREATE TRIGGER submission_attempts_live_requires_draft
BEFORE INSERT OR UPDATE OF application_id, user_id, dry_run, state
ON public.submission_attempts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_live_submission_requires_draft();

REVOKE ALL ON FUNCTION public.enforce_live_submission_requires_draft() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_live_submission_requires_draft() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_live_submission_requires_draft() FROM authenticated;
