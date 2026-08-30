-- Normalize any existing inverted salary ranges before enforcing integrity.
UPDATE public.jobs
SET
  salary_min = LEAST(salary_min, salary_max),
  salary_max = GREATEST(salary_min, salary_max)
WHERE salary_min IS NOT NULL
  AND salary_max IS NOT NULL
  AND salary_min > salary_max;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_salary_range_order_check
  CHECK (
    salary_min IS NULL
    OR salary_max IS NULL
    OR salary_min <= salary_max
  );
