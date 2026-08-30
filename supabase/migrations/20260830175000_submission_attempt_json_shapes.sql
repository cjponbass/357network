-- Keep submission-attempt JSON payloads structurally safe for downstream automation.

UPDATE public.submission_attempts
SET unresolved_questions = '[]'::jsonb
WHERE jsonb_typeof(unresolved_questions) IS DISTINCT FROM 'array';

UPDATE public.submission_attempts
SET available_facts = '{}'::jsonb
WHERE jsonb_typeof(available_facts) IS DISTINCT FROM 'object';

UPDATE public.submission_attempts
SET evidence = '{}'::jsonb
WHERE jsonb_typeof(evidence) IS DISTINCT FROM 'object';

ALTER TABLE public.submission_attempts
  ADD CONSTRAINT submission_attempts_unresolved_questions_array_check
  CHECK (jsonb_typeof(unresolved_questions) = 'array'),
  ADD CONSTRAINT submission_attempts_available_facts_object_check
  CHECK (jsonb_typeof(available_facts) = 'object'),
  ADD CONSTRAINT submission_attempts_evidence_object_check
  CHECK (jsonb_typeof(evidence) = 'object');
