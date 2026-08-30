-- Enforce the same required-content rules at the database boundary that the UI applies.
-- This prevents direct API clients from persisting whitespace-only values.

DELETE FROM public.saved_answers
WHERE btrim(question) = '' OR btrim(answer) = '';

DELETE FROM public.jobs
WHERE btrim(title) = '' OR btrim(company) = '';

ALTER TABLE public.saved_answers
  ADD CONSTRAINT saved_answers_question_not_blank CHECK (btrim(question) <> ''),
  ADD CONSTRAINT saved_answers_answer_not_blank CHECK (btrim(answer) <> '');

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_title_not_blank CHECK (btrim(title) <> ''),
  ADD CONSTRAINT jobs_company_not_blank CHECK (btrim(company) <> '');
