-- Keep submission automation targets usable and restricted to web URLs.
-- Direct API/service writes should not be able to persist blank or non-HTTP(S) targets.

UPDATE public.submission_attempts
SET target_url = NULL
WHERE target_url IS NOT NULL
  AND (
    btrim(target_url) = ''
    OR btrim(target_url) !~* '^https?://[^[:space:]]+$'
  );

UPDATE public.submission_attempts
SET target_url = btrim(target_url)
WHERE target_url IS NOT NULL
  AND target_url <> btrim(target_url);

ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_target_url_web_check
  CHECK (
    target_url IS NULL
    OR (
      target_url = btrim(target_url)
      AND target_url ~* '^https?://[^[:space:]]+$'
    )
  );
