import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface DeploymentStatus {
  supabaseServer: boolean;
  supabaseServerReachable: boolean;
  candidateDocumentsBucketReady: boolean;
  supabaseClient: boolean;
  aiConfigured: boolean;
  browserProviderConfigured: boolean;
  browserProviderExecutable: boolean;
  browserProvider: string | null;
  submitEnabled: boolean;
  missingBrowserConfig: string[];
  readinessNotes: string[];
  readyForManualUse: boolean;
  readyForAiPreparation: boolean;
  readyForAutomationDryRun: boolean;
  readyForVerifiedSubmission: boolean;
}

export const getDeploymentStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<DeploymentStatus> => {
    const { aiStatus } = await import("@/lib/ai/provider.server");
    const { detectProviderConfig } = await import("@/lib/automation/provider/resolve.server");

    const ai = aiStatus();
    const browser = detectProviderConfig();
    const supabaseServer = Boolean(
      process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"],
    );
    const supabaseClient = Boolean(
      process.env["VITE_SUPABASE_URL"] && process.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
    );

    let supabaseServerReachable = false;
    let candidateDocumentsBucketReady = false;
    const readinessNotes: string[] = [];

    if (supabaseServer) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error: databaseError } = await supabaseAdmin
          .from("candidate_profiles")
          .select("user_id", { head: true, count: "exact" })
          .limit(1);
        supabaseServerReachable = !databaseError;
        if (databaseError) readinessNotes.push("Supabase server credentials are present, but the database check failed.");

        const { data: bucket, error: bucketError } = await supabaseAdmin.storage.getBucket("candidate-documents");
        candidateDocumentsBucketReady = !bucketError && Boolean(bucket?.id);
        if (!candidateDocumentsBucketReady) readinessNotes.push("Private candidate-documents storage bucket is not reachable.");
      } catch {
        readinessNotes.push("Supabase server connectivity check could not complete.");
      }
    } else {
      readinessNotes.push("Supabase server environment variables are incomplete.");
    }

    if (!supabaseClient) readinessNotes.push("Supabase browser environment variables are incomplete.");
    if (!ai.configured) readinessNotes.push("AI preparation is disabled until the OpenAI provider is configured.");
    if (!browser.executable) readinessNotes.push("Browser automation cannot run until the browser provider is executable.");
    if (!browser.submitEnabled) readinessNotes.push("Final automated submit is intentionally disabled pending controlled validation.");

    const dataPlaneReady = supabaseServer && supabaseServerReachable && supabaseClient;

    return {
      supabaseServer,
      supabaseServerReachable,
      candidateDocumentsBucketReady,
      supabaseClient,
      aiConfigured: ai.configured,
      browserProviderConfigured: browser.configured,
      browserProviderExecutable: browser.executable,
      browserProvider: browser.provider,
      submitEnabled: browser.submitEnabled,
      missingBrowserConfig: browser.missingConfig,
      readinessNotes,
      readyForManualUse: dataPlaneReady,
      readyForAiPreparation: dataPlaneReady && ai.configured,
      readyForAutomationDryRun: dataPlaneReady && candidateDocumentsBucketReady && browser.executable,
      readyForVerifiedSubmission:
        dataPlaneReady && candidateDocumentsBucketReady && browser.executable && browser.submitEnabled,
    };
  });
