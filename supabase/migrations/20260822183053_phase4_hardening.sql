-- Least-privilege grants and application/document ownership integrity
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind='r'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM authenticated', t);
  END LOOP;
END $$;

REVOKE ALL ON public.application_status_events FROM authenticated;
GRANT SELECT, INSERT ON public.application_status_events TO authenticated;
GRANT ALL ON public.application_status_events TO service_role;
REVOKE ALL ON public.submission_receipts FROM authenticated;
GRANT SELECT ON public.submission_receipts TO authenticated;
GRANT ALL ON public.submission_receipts TO service_role;
REVOKE ALL ON public.submission_attempts FROM authenticated;
GRANT SELECT ON public.submission_attempts TO authenticated;
GRANT ALL ON public.submission_attempts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;

UPDATE public.applications a SET resume_document_id = NULL
WHERE resume_document_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.documents d WHERE d.id=a.resume_document_id AND d.user_id=a.user_id
);
UPDATE public.applications a SET cover_letter_document_id = NULL
WHERE cover_letter_document_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.documents d WHERE d.id=a.cover_letter_document_id AND d.user_id=a.user_id
);

CREATE OR REPLACE FUNCTION public.enforce_application_document_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE owner uuid;
BEGIN
  IF NEW.resume_document_id IS NOT NULL THEN
    SELECT d.user_id INTO owner FROM public.documents d WHERE d.id=NEW.resume_document_id;
    IF owner IS NULL THEN RAISE EXCEPTION 'Document % does not exist', NEW.resume_document_id USING ERRCODE='23503'; END IF;
    IF owner <> NEW.user_id THEN RAISE EXCEPTION 'Resume document % does not belong to user %', NEW.resume_document_id, NEW.user_id USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.cover_letter_document_id IS NOT NULL THEN
    SELECT d.user_id INTO owner FROM public.documents d WHERE d.id=NEW.cover_letter_document_id;
    IF owner IS NULL THEN RAISE EXCEPTION 'Document % does not exist', NEW.cover_letter_document_id USING ERRCODE='23503'; END IF;
    IF owner <> NEW.user_id THEN RAISE EXCEPTION 'Cover letter document % does not belong to user %', NEW.cover_letter_document_id, NEW.user_id USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_application_document_owner() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_applications_document_owner ON public.applications;
CREATE TRIGGER trg_applications_document_owner
BEFORE INSERT OR UPDATE OF resume_document_id, cover_letter_document_id, user_id ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.enforce_application_document_owner();