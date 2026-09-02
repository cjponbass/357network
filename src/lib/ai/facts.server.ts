/** Builds the protected, user-owned facts block handed to the model. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
type Client = SupabaseClient<Database>;
type ExtendedProfile = Database["public"]["Tables"]["candidate_profiles"]["Row"] & {
  address_line1: string | null; address_line2: string | null; city: string | null; region: string | null; postal_code: string | null; country: string | null;
  career_summary: string | null; experience_highlights: string | null; education: string | null; certifications: string | null; languages: string | null;
};
export interface JobFacts { id:string; title:string; company:string; location:string|null; work_arrangement:string|null; employment_type:string|null; salary_min:number|null; salary_max:number|null; currency:string|null; ats_name:string|null; source_url:string|null; description:string|null; }
export interface CandidateFactBundle { factsBlock:string; savedAnswersBlock:string; job:JobFacts; jobBlock:string; }
function line(label:string,value:unknown):string|null { if(value===null||value===undefined)return null; if(Array.isArray(value)){if(!value.length)return null;return `${label}: ${value.join(" | ")}`;} const text=String(value).trim(); return text===""?null:`${label}: ${text}`; }
export async function loadFacts(supabase:Client,userId:string,jobId:string):Promise<CandidateFactBundle>{
  const [jobRes,profileRes,prefsRes,answersRes]=await Promise.all([
    supabase.from("jobs").select("*").eq("id",jobId).eq("created_by",userId).maybeSingle(),
    supabase.from("candidate_profiles").select("*").eq("user_id",userId).maybeSingle(),
    supabase.from("user_preferences").select("*").eq("user_id",userId).maybeSingle(),
    supabase.from("saved_answers").select("question, answer, tags").eq("user_id",userId),
  ]);
  if(jobRes.error)throw new Error(jobRes.error.message); if(!jobRes.data)throw new Error("Job not found.");
  if(profileRes.error)throw new Error(profileRes.error.message); if(prefsRes.error)throw new Error(prefsRes.error.message); if(answersRes.error)throw new Error(answersRes.error.message);
  const job=jobRes.data as JobFacts; const p=profileRes.data as ExtendedProfile|null; const prefs=prefsRes.data; const answers=answersRes.data??[];
  const factLines=[
    line("Full name",p?.full_name),line("Headline",p?.headline),line("Contact email",p?.email),line("Phone",p?.phone),line("Location summary",p?.location),
    line("Street address",p?.address_line1),line("Address line 2",p?.address_line2),line("City",p?.city),line("State/province/region",p?.region),line("Postal code",p?.postal_code),line("Country",p?.country),
    line("Years of professional experience",p?.years_experience),line("Skills",p?.skills),line("Career summary",p?.career_summary),line("Experience highlights",p?.experience_highlights),line("Education",p?.education),line("Certifications",p?.certifications),line("Languages",p?.languages),
    line("Stated work authorization",p?.work_authorization),line("LinkedIn",p?.linkedin_url),line("GitHub",p?.github_url),line("Website",p?.website_url),
    line("Desired titles",prefs?.desired_titles),line("Desired locations",prefs?.desired_locations),line("Preferred work arrangements",prefs?.work_arrangements),line("Stated minimum salary",prefs?.min_salary),line("Salary currency",prefs?.currency),
  ].filter(Boolean) as string[];
  const factsBlock=factLines.length?factLines.join("\n"):"(No candidate facts have been supplied. Treat every requirement as unproven.)";
  const savedAnswersBlock=answers.length?answers.map((a)=>`Q: ${a.question}\nA: ${a.answer}${a.tags?.length?`\n[tags: ${a.tags.join(", ")}]`:""}`).join("\n\n"):"(No saved answers.)";
  const jobLines=[line("Title",job.title),line("Company",job.company),line("Location",job.location),line("Work arrangement",job.work_arrangement),line("Employment type",job.employment_type),line("Salary range",job.salary_min||job.salary_max?`${job.salary_min??"?"} - ${job.salary_max??"?"} ${job.currency??""}`.trim():null),line("ATS",job.ats_name),line("Source URL",job.source_url)].filter(Boolean) as string[];
  const jobBlock=`${jobLines.join("\n")}\n\nDESCRIPTION:\n${job.description?.trim()||"(No description supplied.)"}`;
  return {factsBlock,savedAnswersBlock,job,jobBlock};
}
export function composeUserPrompt(bundle:CandidateFactBundle,task:string):string{return ["CANDIDATE FACTS — authoritative; do not invent or embellish beyond these facts:",bundle.factsBlock,"","SAVED ANSWERS — user supplied:",bundle.savedAnswersBlock,"","JOB POSTING:",bundle.jobBlock,"","TASK:",task,"","RULE: If a requested claim is unsupported by CANDIDATE FACTS or SAVED ANSWERS, omit it or explicitly mark it as unknown. Never fabricate experience, education, credentials, metrics, dates, employers, authorization, compensation, or personal facts."].join("\n");}
