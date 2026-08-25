import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface DeploymentStatus {
  supabaseServer: boolean;
  supabaseClient: boolean;
  aiConfigured: boolean;
  browserProviderConfigured: boolean;
  browserProviderExecutable: boolean;
  browserProvider: string | null;
  submitEnabled: boolean;
  missingBrowserConfig: string[];
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

    return {
      supabaseServer,
      supabaseClient,
      aiConfigured: ai.configured,
      browserProviderConfigured: browser.configured,
      browserProviderExecutable: browser.executable,
      browserProvider: browser.provider,
      submitEnabled: browser.submitEnabled,
      missingBrowserConfig: browser.missingConfig,
      readyForManualUse: supabaseServer && supabaseClient,
      readyForAiPreparation: supabaseServer && supabaseClient && ai.configured,
      readyForAutomationDryRun: supabaseServer && supabaseClient && browser.executable,
      readyForVerifiedSubmission:
        supabaseServer && supabaseClient && browser.executable && browser.submitEnabled,
    };
  });
