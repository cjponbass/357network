import { describe, expect, it } from "vitest";

import { deriveReadinessGates, type ReadinessInputs } from "../readiness";

const fullyReady: ReadinessInputs = {
  supabaseServer: true,
  supabaseServerReachable: true,
  criticalSchemaReady: true,
  candidateDocumentsBucketReady: true,
  supabaseClient: true,
  aiConfigured: true,
  browserProviderExecutable: true,
  browserProviderHealthVerified: true,
  submitEnabled: true,
};

describe("deployment readiness gates", () => {
  it("requires the complete data plane for manual use", () => {
    expect(deriveReadinessGates(fullyReady).readyForManualUse).toBe(true);

    for (const key of [
      "supabaseServer",
      "supabaseServerReachable",
      "criticalSchemaReady",
      "supabaseClient",
    ] as const) {
      expect(deriveReadinessGates({ ...fullyReady, [key]: false }).readyForManualUse).toBe(false);
    }
  });

  it("does not report AI preparation ready without an AI provider", () => {
    const result = deriveReadinessGates({ ...fullyReady, aiConfigured: false });
    expect(result.readyForManualUse).toBe(true);
    expect(result.readyForAiPreparation).toBe(false);
  });

  it("requires private document storage and an executable browser for dry runs", () => {
    expect(
      deriveReadinessGates({ ...fullyReady, candidateDocumentsBucketReady: false })
        .readyForAutomationDryRun,
    ).toBe(false);
    expect(
      deriveReadinessGates({ ...fullyReady, browserProviderExecutable: false })
        .readyForAutomationDryRun,
    ).toBe(false);
  });

  it("allows dry-run readiness before browser health is verified", () => {
    const result = deriveReadinessGates({ ...fullyReady, browserProviderHealthVerified: false });
    expect(result.readyForAutomationDryRun).toBe(true);
    expect(result.readyForVerifiedSubmission).toBe(false);
  });

  it("never reports verified submission ready while the submit boundary is disabled", () => {
    const result = deriveReadinessGates({ ...fullyReady, submitEnabled: false });
    expect(result.readyForAutomationDryRun).toBe(true);
    expect(result.readyForVerifiedSubmission).toBe(false);
  });

  it("reports verified submission ready only when every submission dependency is ready", () => {
    expect(deriveReadinessGates(fullyReady).readyForVerifiedSubmission).toBe(true);

    for (const key of [
      "supabaseServer",
      "supabaseServerReachable",
      "criticalSchemaReady",
      "candidateDocumentsBucketReady",
      "supabaseClient",
      "browserProviderExecutable",
      "browserProviderHealthVerified",
      "submitEnabled",
    ] as const) {
      expect(
        deriveReadinessGates({ ...fullyReady, [key]: false }).readyForVerifiedSubmission,
      ).toBe(false);
    }
  });
});
