-- Keep the checked-in database schema aligned with the submission orchestrator.
-- The application code reads/writes submission_attempts.idempotency_key to
-- prevent repeated requests from creating duplicate live submission attempts.

ALTER TABLE public.submission_attempts
  ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Preserve one canonical row if an existing environment already accumulated
-- duplicate keys before this constraint was installed. Older duplicates remain
-- in the audit log but no longer participate in idempotency matching.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY application_id, idempotency_key
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.submission_attempts
  WHERE idempotency_key IS NOT NULL
)
UPDATE public.submission_attempts AS attempts
SET idempotency_key = NULL
FROM ranked
WHERE attempts.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_submission_attempts_application_idempotency
  ON public.submission_attempts (application_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_submission_attempts_idempotency
  ON public.submission_attempts (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
