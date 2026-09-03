import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { deriveReadinessGates } from "@/lib/system/readiness";

export interface DeploymentStatus {
  supabaseServer: boolean;
  supabaseServerReachable: boolean;
  criticalSchemaReady: boolean;
  missingCriticalTables: string[];
  candidateDocumentsBucketReady: boolean;
  supabaseClient: boolean;
  aiConfigured: boolean;
  billingConfigured: boolean;
  billingSchemaReady: boolean;
  employerSchemaReady: boolean;
  browserProviderConfigured: boolean;
  browserProviderExecutable: boolean;
  browserProviderHealthVerified: boolean;
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
  .handler(async ({ context }): Promise<DeploymentStatus> => {
    const { aiStatus } = await import("@/lib/ai/provider.server");
    const { detectProviderConfig, verifyBrowserProviderHealth } = await import("@/lib/automation/provider/resolve.server");

    const ai = aiStatus();
    const browser = detectProviderConfig();
    const browserProviderHealthVerified = browser.executable
      ? await verifyBrowserProviderHealth({ userId: context.userId })
      : false;
    const supabaseServer = Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]);
    const supabaseClient = Boolean(process.env["VITE_SUPABASE_URL"] && process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]);
    const billingConfigured = Boolean(
      process.env["STRIPE_SECRET_KEY"] &&
      process.env["STRIPE_WEBHOOK_SECRET"] &&
      process.env["STRIPE_PRICE_BASIC"] &&
      process.env["STRIPE_PRICE_PRO"] &&
      process.env["STRIPE_PRICE_AUTO"],
    );

    let supabaseServerReachable = false;
    let criticalSchemaReady = false;
    let billingSchemaReady = false;
    let employerSchemaReady = false;
    let missingCriticalTables: string[] = [];
    let candidateDocumentsBucketReady = false;
    const readinessNotes: string[] = [];

    if (supabaseServer) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error: databaseError } = await supabaseAdmin.from("candidate_profiles").select("user_id", { head: true, count: "exact" }).limit(1);
        supabaseServerReachable = !databaseError;
        if (databaseError) readinessNotes.push("Supabase server credentials are present, but the database check failed.");

        if (supabaseServerReachable) {
          const tableChecks = await Promise.all([
            checkTable("candidate_profiles", supabaseAdmin.from("candidate_profiles").select("user_id,full_name,headline,is_mason,employer_discoverable", { head: true }).limit(1)),
            checkTable("user_preferences", supabaseAdmin.from("user_preferences").select("user_id,desired_titles,email_notifications", { head: true }).limit(1)),
            checkTable("jobs", supabaseAdmin.from("jobs").select("id,created_by,title,company,source_url,ats_name", { head: true }).limit(1)),
            checkTable("applications", supabaseAdmin.from("applications").select("id,user_id,job_id,status,submitted_at", { head: true }).limit(1)),
            checkTable("documents", supabaseAdmin.from("documents").select("id,user_id,storage_path,kind", { head: true }).limit(1)),
            checkTable("saved_answers", supabaseAdmin.from("saved_answers").select("id,user_id,question,answer", { head: true }).limit(1)),
            checkTable("job_analyses", supabaseAdmin.from("job_analyses").select("id,user_id,job_id", { head: true }).limit(1)),
            checkTable("application_materials", supabaseAdmin.from("application_materials").select("id,user_id,application_id,job_id", { head: true }).limit(1)),
            checkTable("submission_attempts", supabaseAdmin.from("submission_attempts").select("id,user_id,application_id,idempotency_key,state,receipt_id", { head: true }).limit(1)),
            checkTable("application_status_events", supabaseAdmin.from("application_status_events").select("id,application_id,from_status,to_status", { head: true }).limit(1)),
            checkTable("submission_receipts", supabaseAdmin.from("submission_receipts").select("id,application_id,application_url,verified,submitted_at", { head: true }).limit(1)),
            checkTable("subscriptions", supabaseAdmin.from("subscriptions").select("user_id,plan,status", { head: true }).limit(1)),
            checkTable("stripe_webhook_events", supabaseAdmin.from("stripe_webhook_events").select("event_id,event_type", { head: true }).limit(1)),
            checkTable("employer_profiles", supabaseAdmin.from("employer_profiles").select("user_id,company_name", { head: true }).limit(1)),
            checkTable("employer_interest_requests", supabaseAdmin.from("employer_interest_requests").select("id,employer_user_id,candidate_user_id,status", { head: true }).limit(1)),
          ]);
          missingCriticalTables = tableChecks.filter((result) => !result.ok).map((result) => result.name);
          criticalSchemaReady = missingCriticalTables.length === 0;
          billingSchemaReady = tableChecks.filter((result) => ["subscriptions", "stripe_webhook_events"].includes(result.name)).every((result) => result.ok);
          employerSchemaReady = tableChecks.filter((result) => ["candidate_profiles", "employer_profiles", "employer_interest_requests"].includes(result.name)).every((result) => result.ok);
          if (!criticalSchemaReady) readinessNotes.push(`Critical database schema is incomplete: ${missingCriticalTables.join(", ")}.`);
        }

        const { data: bucket, error: bucketError } = await supabaseAdmin.storage.getBucket("candidate-documents");
        candidateDocumentsBucketReady = !bucketError && Boolean(bucket?.id) && bucket?.public === false;
        if (!candidateDocumentsBucketReady) readinessNotes.push("Private candidate-documents storage bucket is missing, unreachable, or public.");
      } catch {
        readinessNotes.push("Supabase server connectivity check could not complete.");
      }
    } else {
      readinessNotes.push("Supabase server environment variables are incomplete.");
    }

    if (!supabaseClient) readinessNotes.push("Supabase browser environment variables are incomplete.");
    if (!billingConfigured) readinessNotes.push("Stripe billing is incomplete until the secret key, webhook secret, and Basic/Pro/Auto price IDs are configured.");
    if (!billingSchemaReady) readinessNotes.push("Billing database tables are not verified ready.");
    if (!employerSchemaReady) readinessNotes.push("Employer/Mason discovery database schema is not verified ready.");
    if (!ai.configured) readinessNotes.push("AI preparation is disabled until the OpenAI provider is configured.");
    if (!browser.executable) readinessNotes.push("Browser automation cannot run until the browser provider is executable.");
    if (browser.executable && !browserProviderHealthVerified) readinessNotes.push("Browser automation provider connectivity could not be verified by the controlled health check.");
    if (!browser.submitEnabled) readinessNotes.push("Final automated submit is intentionally disabled pending controlled validation.");

    const readiness = deriveReadinessGates({
      supabaseServer,
      supabaseServerReachable,
      criticalSchemaReady,
      candidateDocumentsBucketReady,
      supabaseClient,
      aiConfigured: ai.configured,
      browserProviderExecutable: browser.executable,
      browserProviderHealthVerified,
      submitEnabled: browser.submitEnabled,
    });

    return {
      supabaseServer,
      supabaseServerReachable,
      criticalSchemaReady,
      missingCriticalTables,
      candidateDocumentsBucketReady,
      supabaseClient,
      aiConfigured: ai.configured,
      billingConfigured,
      billingSchemaReady,
      employerSchemaReady,
      browserProviderConfigured: browser.configured,
      browserProviderExecutable: browser.executable,
      browserProviderHealthVerified,
      browserProvider: browser.provider,
      submitEnabled: browser.submitEnabled,
      missingBrowserConfig: browser.missingConfig,
      readinessNotes,
      ...readiness,
    };
  });

async function checkTable(
  name: string,
  request: PromiseLike<{ error: { message: string } | null }>,
): Promise<{ name: string; ok: boolean }> {
  const { error } = await request;
  return { name, ok: !error };
}
