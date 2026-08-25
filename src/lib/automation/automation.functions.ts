import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import type { AtsDetection } from "./ats-detect";
import type { AutomationErrorCategory, ReadinessReport, SubmissionAttempt } from "./types";

export interface AutomationStatusResult {
  configured: boolean;
  provider: string | null;
  driverAvailable: boolean;
  executable: boolean;
  submitEnabled: boolean;
  installedDrivers: string[];
  missingConfig: string[];
  healthVerified: false;
  implementedProviders: string[];
}

export const getAutomationStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<AutomationStatusResult> => {
    const { detectProviderConfig } = await import("./provider/resolve.server");
    const status = detectProviderConfig();
    return { ...status, implementedProviders: ["greenhouse"] };
  },
);

export const detectAtsForUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string | null }) => input)
  .handler(async ({ data }): Promise<AtsDetection> => {
    const { detectAts } = await import("./ats-detect");
    return detectAts(data.url);
  });

export const checkSubmissionReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { applicationId: string }) => input)
  .handler(async ({ data, context }): Promise<ReadinessReport> => {
    const { runReadinessCheck } = await import("./orchestrator.server");
    return runReadinessCheck(context.supabase, context.userId, data.applicationId);
  });

export const listSubmissionAttempts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { applicationId: string }) => input)
  .handler(async ({ data, context }): Promise<SubmissionAttempt[]> => {
    const { data: rows, error } = await context.supabase
      .from("submission_attempts")
      .select("*")
      .eq("application_id", data.applicationId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((row) => ({
      ...row,
      error_category: (row.error_category as AutomationErrorCategory | null) ?? null,
    }));
  });

export const startSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { applicationId: string; requestKey?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { runSubmission } = await import("./orchestrator.server");
    return runSubmission(
      context.supabase,
      context.userId,
      data.applicationId,
      data.requestKey ?? null,
    );
  });
