-- Keep application status history consistent with the application's actual tracker state.
-- Authenticated users may append history for their own applications, so the database
-- must reject events that claim a destination state different from the live application.

CREATE OR REPLACE FUNCTION public.enforce_status_event_tracker_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status public.application_status;
BEGIN
  SELECT a.status
    INTO current_status
    FROM public.applications a
   WHERE a.id = NEW.application_id;

  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Application % does not exist', NEW.application_id;
  END IF;

  IF NEW.to_status <> current_status THEN
    RAISE EXCEPTION 'Status event destination % does not match application status %', NEW.to_status, current_status;
  END IF;

  IF NEW.from_status IS NOT NULL AND NEW.from_status = NEW.to_status THEN
    RAISE EXCEPTION 'Status event must represent an actual transition';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_status_event_tracker_integrity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_status_event_tracker_integrity() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_status_event_tracker_integrity() TO service_role;

DROP TRIGGER IF EXISTS trg_status_event_tracker_integrity ON public.application_status_events;
CREATE TRIGGER trg_status_event_tracker_integrity
BEFORE INSERT ON public.application_status_events
FOR EACH ROW
EXECUTE FUNCTION public.enforce_status_event_tracker_integrity();
