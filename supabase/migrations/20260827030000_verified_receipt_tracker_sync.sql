-- Keep the application tracker and immutable verified receipt evidence in sync at the database boundary.
-- A receipt may advance only a draft application. Later manually tracked statuses are never regressed.
CREATE OR REPLACE FUNCTION public.sync_verified_receipt_to_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  moved_application_id uuid;
  effective_submitted_at timestamptz;
BEGIN
  IF NOT NEW.verified THEN
    RETURN NEW;
  END IF;

  effective_submitted_at := COALESCE(NEW.submitted_at, NEW.created_at, now());

  UPDATE public.applications
  SET status = 'submitted',
      submitted_at = COALESCE(submitted_at, effective_submitted_at)
  WHERE id = NEW.application_id
    AND status = 'draft'
  RETURNING id INTO moved_application_id;

  IF moved_application_id IS NOT NULL THEN
    INSERT INTO public.application_status_events (
      application_id,
      from_status,
      to_status,
      note,
      occurred_at
    ) VALUES (
      moved_application_id,
      'draft',
      'submitted',
      'Verified ATS submission receipt recorded.',
      effective_submitted_at
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_verified_receipt_to_application() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_verified_receipt_tracker_sync ON public.submission_receipts;
CREATE TRIGGER trg_verified_receipt_tracker_sync
AFTER INSERT OR UPDATE OF verified, submitted_at ON public.submission_receipts
FOR EACH ROW
WHEN (NEW.verified = true)
EXECUTE FUNCTION public.sync_verified_receipt_to_application();
