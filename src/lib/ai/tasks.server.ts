/** Server-only AI task implementations. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { composeUserPrompt, loadFacts } from "./facts.server";
import {
  ANALYZE_JOB_FIT_SYSTEM,
  COVER_LETTER_SYSTEM,
  PROMPT_VERSION,
  SUGGEST_ANSWER_SYSTEM,
  TAILORED_RESUME_SYSTEM,
  isSensitiveQuestion,
} from "./prompts";
import { chat, parseJsonObject } from "./provider.server";
import type { FitAnalysisResult, GeneratedTextResult, SuggestedAnswerResult } from "./ai.functions";

type Client = SupabaseClient<Database>;

function clampScore(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function stringList(value: unknown, limit = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, limit);
}

export async function runAnalyzeJobFit(
  supabase: Client,
  userId: string,
  jobId: string,
): Promise<FitAnalysisResult> {
  const bundle = await loadFacts(supabase, userId, jobId);
  const { text, model } = await chat({
    system: ANALYZE_JOB_FIT_SYSTEM,
    user: composeUserPrompt(bundle, "Assess the candidate's fit for this job."),
    json: true,
    maxTokens: 1400,
  });
  const raw = parseJsonObject<Record<string, unknown>>(text);
  const result: FitAnalysisResult = {
    fit_score: clampScore(raw["fit_score"]),
    summary: typeof raw["summary"] === "string" ? raw["summary"].trim() : "",
    strengths: stringList(raw["strengths"]),
    gaps: stringList(raw["gaps"]),
    keyword_matches: stringList(raw["keyword_matches"], 20),
    missing_keywords: stringList(raw["missing_keywords"], 20),
    positioning: typeof raw["positioning"] === "string" ? raw["positioning"].trim() : "",
    model,
    prompt_version: PROMPT_VERSION,
  };
  const { error } = await supabase.from("job_analyses").upsert(
    {
      user_id: userId,
      job_id: jobId,
      fit_score: result.fit_score,
      summary: result.summary,
      strengths: result.strengths,
      gaps: result.gaps,
      keyword_matches: result.keyword_matches,
      missing_keywords: result.missing_keywords,
      positioning: result.positioning,
      model,
      prompt_version: PROMPT_VERSION,
    },
    { onConflict: "user_id,job_id" },
  );
  if (error) throw new Error(error.message);
  return result;
}

async function persistMaterial(
  supabase: Client,
  userId: string,
  jobId: string,
  patch: Record<string, unknown>,
) {
  const { error } = await supabase.from("application_materials").upsert(
    {
      user_id: userId,
      job_id: jobId,
      prompt_version: PROMPT_VERSION,
      last_generated_at: new Date().toISOString(),
      ...patch,
    },
    { onConflict: "user_id,job_id" },
  );
  if (error) throw new Error(error.message);
}

export async function runGenerateTailoredResume(
  supabase: Client,
  userId: string,
  jobId: string,
): Promise<GeneratedTextResult> {
  const bundle = await loadFacts(supabase, userId, jobId);
  const { text, model } = await chat({
    system: TAILORED_RESUME_SYSTEM,
    user: composeUserPrompt(bundle, "Produce tailored resume text for this posting using only the supplied facts."),
    maxTokens: 1800,
  });
  await persistMaterial(supabase, userId, jobId, {
    tailored_resume_text: text,
    resume_model: model,
  });
  return { text, model, prompt_version: PROMPT_VERSION };
}

export async function runGenerateCoverLetter(
  supabase: Client,
  userId: string,
  jobId: string,
): Promise<GeneratedTextResult> {
  const bundle = await loadFacts(supabase, userId, jobId);
  const { text, model } = await chat({
    system: COVER_LETTER_SYSTEM,
    user: composeUserPrompt(bundle, "Write a cover letter for this posting using only the supplied facts."),
    maxTokens: 1200,
  });
  await persistMaterial(supabase, userId, jobId, {
    cover_letter_text: text,
    cover_letter_model: model,
  });
  return { text, model, prompt_version: PROMPT_VERSION };
}

export async function runSuggestApplicationAnswer(
  supabase: Client,
  userId: string,
  jobId: string,
  question: string,
): Promise<SuggestedAnswerResult> {
  const trimmed = question.trim();
  if (!trimmed) throw new Error("Enter a question first.");
  const bundle = await loadFacts(supabase, userId, jobId);
  const sensitive = isSensitiveQuestion(trimmed);
  const { text, model } = await chat({
    system: SUGGEST_ANSWER_SYSTEM,
    user: composeUserPrompt(
      bundle,
      [
        `QUESTION: ${trimmed}`,
        sensitive
          ? "This question is flagged SENSITIVE. Answer only if the exact fact is present above; otherwise return NEEDS_USER_INPUT."
          : "Draft an answer grounded strictly in the supplied facts.",
      ].join("\n"),
    ),
    json: true,
    maxTokens: 900,
  });
  const raw = parseJsonObject<Record<string, unknown>>(text);
  const status = raw["status"] === "OK" ? "OK" : "NEEDS_USER_INPUT";
  const answer = typeof raw["answer"] === "string" ? raw["answer"].trim() : "";
  return {
    status: status === "OK" && answer ? "OK" : "NEEDS_USER_INPUT",
    answer: status === "OK" ? answer : "",
    missing_facts: stringList(raw["missing_facts"], 10),
    note: typeof raw["note"] === "string" ? raw["note"].trim() : "",
    model,
    prompt_version: PROMPT_VERSION,
  };
}
