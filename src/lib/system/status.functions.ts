import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface DeploymentStatus {
  supabaseServer: boolean;
  supabaseServerReachable: boolean;
  criticalSchemaReady: boolean;
  missingCriticalTables: string[];
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
    let criticalSchemaReady = false;
    let missingCriticalTables: string[] = [];
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

        if (supabaseServerReachable) {
          const tableChecks = await Promise.all([
            checkTable("candidate_profiles", supabaseAdmin.from("candidate_profiles").select("user_id", { head: true }).limit(1)),
            checkTable("user_preferences", supabaseAdmin.from("user_preferences").select("user_id", { head: true }).limit(1)),
            checkTable("jobs", supabaseAdmin.from("jobs").select("id", { head: true }).limit(1)),
            checkTable("applications", supabaseAdmin.from("applications").select("id", { head: true }).limit(1)),
            checkTable("documents", supabaseAdmin.from("documents").select("id", { head: true }).limit(1)),
            checkTable("saved_answers", supabaseAdmin.from("saved_answers").select("id", { head: true }).limit(1)),
            checkTable("job_analyses", supabaseAdmin.from("job_analyses").select("id", { head: true }).limit(1)),
            checkTable("application_materials", supabaseAdmin.from("application_materials").select("id", { head: true }).limit(1)),
            checkTable("submission_attempts", supabaseAdmin.from("submission_attempts").select("id", { head: true }).limit(1)),
            checkTable("application_status_events", supabaseAdmin.from("application_status_events").select("id", { head: true }).limit(1)),
            checkTable("submission_receipts", supabaseAdmin.from("submission_receipts").select("id", { head: true }).limit(1)),
          ]);
          missingCriticalTables = tableChecks.filter((result) => !result.ok).map((result) => result.name);
          criticalSchemaReady = missingCriticalTables.length === 0;
          if (!criticalSchemaReady) {
            readinessNotes.push(`Critical database schema is incomplete: ${missingCriticalTables.join(", ")}.`);
          }
        }

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

    const dataPlaneReady = supabaseServer && supabaseServerReachable && criticalSchemaReady && supabaseClient;

    return {
      supabaseServer,
      supabaseServerReachable,
      criticalSchemaReady,
      missingCriticalTables,
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

async function checkTable(
  name: string,
  request: PromiseLike<{ error: { message: string } | null }>,
): Promise<{ name: string; ok: boolean }> {
  const { error } = await request;
  return { name, ok: !error };
}
