-- Ensure every user-owned row points to a real Supabase Auth user.
-- Abort rather than silently deleting or reassigning orphaned production data.
DO $$
DECLARE
  orphan_count bigint;
BEGIN
  SELECT count(*) INTO orphan_count FROM public.candidate_profiles p LEFT JOIN auth.users u ON u.id = p.user_id WHERE u.id IS NULL;
  IF orphan_count > 0 THEN RAISE EXCEPTION 'candidate_profiles contains % orphaned user rows', orphan_count; END IF;

  SELECT count(*) INTO orphan_count FROM public.user_preferences p LEFT JOIN auth.users u ON u.id = p.user_id WHERE u.id IS NULL;
  IF orphan_count > 0 THEN RAISE EXCEPTION 'user_preferences contains % orphaned user rows', orphan_count; END IF;

  SELECT count(*) INTO orphan_count FROM public.jobs j LEFT JOIN auth.users u ON u.id = j.created_by WHERE u.id IS NULL;
  IF orphan_count > 0 THEN RAISE EXCEPTION 'jobs contains % orphaned owner rows', orphan_count; END IF;

  SELECT count(*) INTO orphan_count FROM public.documents d LEFT JOIN auth.users u ON u.id = d.user_id WHERE u.id IS NULL;
  IF orphan_count > 0 THEN RAISE EXCEPTION 'documents contains % orphaned user rows', orphan_count; END IF;

  SELECT count(*) INTO orphan_count FROM public.saved_answers a LEFT JOIN auth.users u ON u.id = a.user_id WHERE u.id IS NULL;
  IF orphan_count > 0 THEN RAISE EXCEPTION 'saved_answers contains % orphaned user rows', orphan_count; END IF;

  SELECT count(*) INTO orphan_count FROM public.applications a LEFT JOIN auth.users u ON u.id = a.user_id WHERE u.id IS NULL;
  IF orphan_count > 0 THEN RAISE EXCEPTION 'applications contains % orphaned user rows', orphan_count; END IF;

  SELECT count(*) INTO orphan_count FROM public.job_analyses a LEFT JOIN auth.users u ON u.id = a.user_id WHERE u.id IS NULL;
  IF orphan_count > 0 THEN RAISE EXCEPTION 'job_analyses contains % orphaned user rows', orphan_count; END IF;

  SELECT count(*) INTO orphan_count FROM public.application_materials m LEFT JOIN auth.users u ON u.id = m.user_id WHERE u.id IS NULL;
  IF orphan_count > 0 THEN RAISE EXCEPTION 'application_materials contains % orphaned user rows', orphan_count; END IF;
END;
$$;

ALTER TABLE public.candidate_profiles
  ADD CONSTRAINT candidate_profiles_user_auth_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_user_auth_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_created_by_auth_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_user_auth_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.saved_answers
  ADD CONSTRAINT saved_answers_user_auth_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.applications
  ADD CONSTRAINT applications_user_auth_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.job_analyses
  ADD CONSTRAINT job_analyses_user_auth_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.application_materials
  ADD CONSTRAINT application_materials_user_auth_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
