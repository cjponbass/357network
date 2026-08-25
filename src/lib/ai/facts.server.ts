/** Builds the protected facts block handed to the model. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

export interface JobFacts {
  id: string;
  title: string;
  company: string;
  location: string | null;
  work_arrangement: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  ats_name: string | null;
  source_url: string | null;
  description: string | null;
}

export interface CandidateFactBundle {
  factsBlock: string;
  savedAnswersBlock: string;
  job: JobFacts;
  jobBlock: string;
}

function line(label: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return `${label}: ${value.join(", ")}`;
  }
  const text = String(value).trim();
  return text === "" ? null : `${label}: ${text}`;
}

export async function loadFacts(
  supabase: Client,
  userId: string,
  jobId: string,
): Promise<CandidateFactBundle> {
  const [jobRes, profileRes, prefsRes, answersRes] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", jobId).eq("created_by", userId).maybeSingle(),
    supabase.from("candidate_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("saved_answers").select("question, answer, tags").eq("user_id", userId),
  ]);

  if (jobRes.error) throw new Error(jobRes.error.message);
  if (!jobRes.data) throw new Error("Job not found.");

  const job = jobRes.data as JobFacts;
  const p = profileRes.data;
  const prefs = prefsRes.data;
  const answers = answersRes.data ?? [];

  const factLines = [
    line("Full name", p?.full_name),
    line("Headline", p?.headline),
    line("Location", p?.location),
    line("Years of professional experience", p?.years_experience),
    line("Skills", p?.skills),
    line("Stated work authorization", p?.work_authorization),
    line("LinkedIn", p?.linkedin_url),
    line("GitHub", p?.github_url),
    line("Website", p?.website_url),
    line("Desired titles", prefs?.desired_titles),
    line("Desired locations", prefs?.desired_locations),
    line("Preferred work arrangements", prefs?.work_arrangements),
    line("Stated minimum salary", prefs?.min_salary),
  ].filter(Boolean) as string[];

  const factsBlock = factLines.length
    ? factLines.join("\n")
    : "(No candidate facts have been supplied. Treat every requirement as unproven.)";

  const savedAnswersBlock = answers.length
    ? answers
        .map(
          (a) =>
            `Q: ${a.question}\nA: ${a.answer}${a.tags?.length ? `\n[tags: ${a.tags.join(", ")}]` : ""}`,
        )
        .join("\n\n")
    : "(No saved answers.)";

  const jobLines = [
    line("Title", job.title),
    line("Company", job.company),
    line("Location", job.location),
    line("Work arrangement", job.work_arrangement),
    line("Employment type", job.employment_type),
    line(
      "Salary range",
      job.salary_min || job.salary_max
        ? `${job.salary_min ?? "?"} - ${job.salary_max ?? "?"} ${job.currency ?? ""}`.trim()
        : null,
    ),
    line("ATS", job.ats_name),
    line("Source URL", job.source_url),
  ].filter(Boolean) as string[];

  const jobBlock = `${jobLines.join("\n")}\n\nDESCRIPTION:\n${job.description?.trim() || "(No description supplied.)"}`;

  return { factsBlock, savedAnswersBlock, job, jobBlock };
}

export function composeUserPrompt(bundle: CandidateFactBundle, task: string): string {
  return [
    "CANDIDATE FACTS:", bundle.factsBlock, "", "SAVED ANSWERS:", bundle.savedAnswersBlock,
    "", "JOB POSTING:", bundle.jobBlock, "", "TASK:", task,
  ].join("\n");
}
