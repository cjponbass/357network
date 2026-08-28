import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import type { AtsDetection } from "./ats-detect";
import { getSubmissionDisabledResult } from "./submission-safety";
import {
  IMPLEMENTED_PROVIDERS,
  type AutomationErrorCategory,
  type ReadinessReport,
  type SubmissionAttempt,
} from "./types";

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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateApplicationId(input: { applicationId: string }) {
  const applicationId = input.applicationId.trim();
  if (!UUID_PATTERN.test(applicationId)) {
    throw new Error("A valid application ID is required.");
  }
  return { applicationId };
}

export function validateSubmissionInput(input: { applicationId: string; requestKey?: string | null }) {
  const { applicationId } = validateApplicationId(input);
  const requestKey = input.requestKey?.trim() || null;
  if (requestKey && requestKey.length > 200) {
    throw new Error("Submission request key is too long.");
  }
  return { applicationId, requestKey };
}

export const getAutomationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<AutomationStatusResult> => {
    const { detectProviderConfig } = await import("./provider/resolve.server");
    const status = detectProviderConfig();
    return { ...status, implementedProviders: [...IMPLEMENTED_PROVIDERS] };
  });

export const detectAtsForUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string | null }) => input)
  .handler(async ({ data }): Promise<AtsDetection> => {
    const { detectAts } = await import("./ats-detect");
    return detectAts(data.url);
  });

export const checkSubmissionReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateApplicationId)
  .handler(async ({ data, context }): Promise<ReadinessReport> => {
    const { runReadinessCheck } = await import("./orchestrator.server");
    return runReadinessCheck(context.supabase, context.userId, data.applicationId);
  });

export const listSubmissionAttempts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateApplicationId)
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
  .inputValidator(validateSubmissionInput)
  .handler(async ({ data, context }) => {
    const { detectProviderConfig } = await import("./provider/resolve.server");
    const config = detectProviderConfig();
    const disabledResult = getSubmissionDisabledResult(config);

    if (disabledResult) return disabledResult;

    const { runSubmission } = await import("./orchestrator.server");
    return runSubmission(
      context.supabase,
      context.userId,
      data.applicationId,
      data.requestKey,
    );
  });
