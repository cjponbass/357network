import { describe, expect, it } from "vitest";

import { getSubmissionDisabledResult } from "../submission-safety";

describe("final submission safety policy", () => {
  it("blocks final submission when the submit switch is disabled", () => {
    expect(
      getSubmissionDisabledResult({
        configured: true,
        provider: "browserbase",
        submitEnabled: false,
      }),
    ).toEqual({
      attemptId: null,
      state: "needs_user_input",
      errorCategory: "provider_unavailable",
      receiptId: null,
      message:
        "Final automated submission is disabled until controlled validation is complete. Nothing was sent to the employer or ATS.",
      automationConfigured: true,
      automationProvider: "browserbase",
    });
  });

  it("blocks even when no automation provider is configured", () => {
    const result = getSubmissionDisabledResult({
      configured: false,
      provider: null,
      submitEnabled: false,
    });

    expect(result?.automationConfigured).toBe(false);
    expect(result?.automationProvider).toBeNull();
    expect(result?.message).toContain("Nothing was sent");
  });

  it("allows the caller to continue only when final submit is explicitly enabled", () => {
    expect(
      getSubmissionDisabledResult({
        configured: true,
        provider: "browserbase",
        submitEnabled: true,
      }),
    ).toBeNull();
  });
});
