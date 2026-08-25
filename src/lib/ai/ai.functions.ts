/** Thin authenticated server functions for the AI layer. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AiStatusResult {
  configured: boolean;
  provider: string | null;
  model: string | null;
}

export interface FitAnalysisResult {
  fit_score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  keyword_matches: string[];
  missing_keywords: string[];
  positioning: string;
  model: string;
  prompt_version: string;
}

export interface GeneratedTextResult {
  text: string;
  model: string;
  prompt_version: string;
}

export interface SuggestedAnswerResult {
  status: "OK" | "NEEDS_USER_INPUT";
  answer: string;
  missing_facts: string[];
  note: string;
  model: string | null;
  prompt_version: string;
}

export const getAiStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<AiStatusResult> => {
    const { aiStatus } = await import("./provider.server");
    return aiStatus();
  },
);

export const analyzeJobFit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string }) => input)
  .handler(async ({ data, context }): Promise<FitAnalysisResult> => {
    const { runAnalyzeJobFit } = await import("./tasks.server");
    return runAnalyzeJobFit(context.supabase, context.userId, data.jobId);
  });

export const generateTailoredResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string }) => input)
  .handler(async ({ data, context }): Promise<GeneratedTextResult> => {
    const { runGenerateTailoredResume } = await import("./tasks.server");
    return runGenerateTailoredResume(context.supabase, context.userId, data.jobId);
  });

export const generateCoverLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string }) => input)
  .handler(async ({ data, context }): Promise<GeneratedTextResult> => {
    const { runGenerateCoverLetter } = await import("./tasks.server");
    return runGenerateCoverLetter(context.supabase, context.userId, data.jobId);
  });

export const suggestApplicationAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string; question: string }) => input)
  .handler(async ({ data, context }): Promise<SuggestedAnswerResult> => {
    const { runSuggestApplicationAnswer } = await import("./tasks.server");
    return runSuggestApplicationAnswer(context.supabase, context.userId, data.jobId, data.question);
  });
