export type ReadinessInputs = {
  supabaseServer: boolean;
  supabaseServerReachable: boolean;
  criticalSchemaReady: boolean;
  candidateDocumentsBucketReady: boolean;
  supabaseClient: boolean;
  aiConfigured: boolean;
  browserProviderExecutable: boolean;
  browserProviderHealthVerified: boolean;
  submitEnabled: boolean;
};

export type ReadinessGates = {
  readyForManualUse: boolean;
  readyForAiPreparation: boolean;
  readyForAutomationDryRun: boolean;
  readyForVerifiedSubmission: boolean;
};

export function deriveReadinessGates(input: ReadinessInputs): ReadinessGates {
  const dataPlaneReady =
    input.supabaseServer &&
    input.supabaseServerReachable &&
    input.criticalSchemaReady &&
    input.supabaseClient;

  const automationDataReady = dataPlaneReady && input.candidateDocumentsBucketReady;

  return {
    readyForManualUse: dataPlaneReady,
    readyForAiPreparation: dataPlaneReady && input.aiConfigured,
    readyForAutomationDryRun: automationDataReady && input.browserProviderExecutable,
    readyForVerifiedSubmission:
      automationDataReady &&
      input.browserProviderExecutable &&
      input.browserProviderHealthVerified &&
      input.submitEnabled,
  };
}
