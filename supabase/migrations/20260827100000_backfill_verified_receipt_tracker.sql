-- Backfill tracker state for verified receipts that may predate the
-- verified-receipt synchronization trigger.
--
-- Only draft applications are advanced. Later statuses are never regressed,
-- and each moved application receives the same audit event used by the live
-- receipt trigger.
WITH candidates AS (
  SELECT
    a.id AS application_id,
    COALESCE(a.submitted_at, r.submitted_at, r.created_at, now()) AS submitted_at
  FROM public.applications a
  JOIN public.submission_receipts r
    ON r.application_id = a.id
  WHERE a.status = 'draft'
    AND r.verified IS TRUE
), moved AS (
  UPDATE public.applications a
  SET status = 'submitted',
      submitted_at = c.submitted_at
  FROM candidates c
  WHERE a.id = c.application_id
    AND a.status = 'draft'
  RETURNING a.id AS application_id, a.submitted_at
)
INSERT INTO public.application_status_events (
  application_id,
  from_status,
  to_status,
  note,
  occurred_at
)
SELECT
  moved.application_id,
  'draft',
  'submitted',
  'Verified ATS submission receipt recorded (backfill).',
  moved.submitted_at
FROM moved;
