-- Keep each application's status history internally consistent.
-- The existing tracker-integrity trigger verifies that an event's destination matches
-- the application's live status. This trigger extension also prevents a client from
-- forging the event's claimed previous status once history already exists.

CREATE OR REPLACE FUNCTION public.enforce_status_event_tracker_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status public.application_status;
  previous_status public.application_status;
  has_previous_event boolean := false;
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

  SELECT e.to_status, true
    INTO previous_status, has_previous_event
    FROM public.application_status_events e
   WHERE e.application_id = NEW.application_id
   ORDER BY e.occurred_at DESC, e.created_at DESC, e.id DESC
   LIMIT 1;

  IF has_previous_event AND NEW.from_status IS DISTINCT FROM previous_status THEN
    RAISE EXCEPTION 'Status event previous state % does not match prior history state %', NEW.from_status, previous_status;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_status_event_tracker_integrity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_status_event_tracker_integrity() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_status_event_tracker_integrity() TO service_role;
