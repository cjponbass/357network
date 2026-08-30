-- Preserve the original employer submission time as an application advances.
-- Later lifecycle states (interviewing, offer, rejected, withdrawn) must not
-- silently replace an existing submission timestamp with the current time.

CREATE OR REPLACE FUNCTION public.ensure_application_submission_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> 'draft'::public.application_status
     AND NEW.submitted_at IS NULL THEN
    IF TG_OP = 'UPDATE' AND OLD.submitted_at IS NOT NULL THEN
      NEW.submitted_at := OLD.submitted_at;
    ELSE
      NEW.submitted_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_application_submission_timestamp() FROM PUBLIC, anon, authenticated;
