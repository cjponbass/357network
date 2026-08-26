export interface SubmissionSafetyConfig {
  configured: boolean;
  provider: string | null;
  submitEnabled: boolean;
}

export interface SubmissionDisabledResult {
  attemptId: null;
  state: "needs_user_input";
  errorCategory: "provider_unavailable";
  receiptId: null;
  message: string;
  automationConfigured: boolean;
  automationProvider: string | null;
}

export function getSubmissionDisabledResult(
  config: SubmissionSafetyConfig,
): SubmissionDisabledResult | null {
  if (config.submitEnabled) return null;

  return {
    attemptId: null,
    state: "needs_user_input",
    errorCategory: "provider_unavailable",
    receiptId: null,
    message:
      "Final automated submission is disabled until controlled validation is complete. Nothing was sent to the employer or ATS.",
    automationConfigured: config.configured,
    automationProvider: config.provider,
  };
}
