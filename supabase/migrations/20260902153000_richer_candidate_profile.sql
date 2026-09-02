-- Expand the private candidate profile with structured location and richer career facts.
-- Existing profile rows remain valid; every new column is nullable.

ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS career_summary text,
  ADD COLUMN IF NOT EXISTS experience_highlights text,
  ADD COLUMN IF NOT EXISTS education text,
  ADD COLUMN IF NOT EXISTS certifications text,
  ADD COLUMN IF NOT EXISTS languages text;

COMMENT ON COLUMN public.candidate_profiles.address_line1 IS 'Candidate-owned street address used only when an application explicitly requests it.';
COMMENT ON COLUMN public.candidate_profiles.address_line2 IS 'Optional second address line.';
COMMENT ON COLUMN public.candidate_profiles.city IS 'Structured city for application form mapping.';
COMMENT ON COLUMN public.candidate_profiles.region IS 'State, province, department, or region.';
COMMENT ON COLUMN public.candidate_profiles.postal_code IS 'Postal or ZIP code.';
COMMENT ON COLUMN public.candidate_profiles.country IS 'Country name supplied by the candidate.';
COMMENT ON COLUMN public.candidate_profiles.career_summary IS 'Candidate-authored professional summary used as a grounding fact for AI preparation.';
COMMENT ON COLUMN public.candidate_profiles.experience_highlights IS 'Candidate-authored career achievements/experience facts. Never inferred by the system.';
COMMENT ON COLUMN public.candidate_profiles.education IS 'Candidate-authored education facts.';
COMMENT ON COLUMN public.candidate_profiles.certifications IS 'Candidate-authored certification/license facts.';
COMMENT ON COLUMN public.candidate_profiles.languages IS 'Candidate-authored language facts.';
