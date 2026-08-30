-- Keep submission-attempt lifecycle timestamps internally consistent.
-- Receipt verification already protects the meaning of `succeeded`; these
-- constraints make the timing/audit trail equally trustworthy.

-- Normalize historical rows before adding constraints.
UPDATE public.submission_attempts
SET started_at = created_at
WHERE state IN ('running', 'needs_user_input', 'succeeded')
  AND started_at IS NULL;

UPDATE public.submission_attempts
SET completed_at = COALESCE(started_at, created_at)
WHERE state IN ('succeeded', 'failed', 'cancelled')
  AND completed_at IS NULL;

UPDATE public.submission_attempts
SET completed_at = started_at
WHERE started_at IS NOT NULL
  AND completed_at IS NOT NULL
  AND completed_at < started_at;

ALTER TABLE public.submission_attempts
  DROP CONSTRAINT IF EXISTS submission_attempts_started_when_active_check;
ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_started_when_active_check
  CHECK (
    state NOT IN ('running', 'needs_user_input', 'succeeded')
    OR started_at IS NOT NULL
  );

ALTER TABLE public.submission_attempts
  DROP CONSTRAINT IF EXISTS submission_attempts_completed_when_terminal_check;
ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_completed_when_terminal_check
  CHECK (
    state NOT IN ('succeeded', 'failed', 'cancelled')
    OR completed_at IS NOT NULL
  );

ALTER TABLE public.submission_attempts
  DROP CONSTRAINT IF EXISTS submission_attempts_timestamp_order_check;
ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_timestamp_order_check
  CHECK (
    started_at IS NULL
    OR completed_at IS NULL
    OR completed_at >= started_at
  );
