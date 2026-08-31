import { describe, expect, it } from "vitest";

import {
  canAutoSubmitApplicationStatus,
  getApplicationStateBlockedResult,
  getSubmissionDisabledResult,
} from "../submission-safety";

describe("final submission safety policy", () => {
  it("blocks final submission when the submit switch is disabled", () => {
    expect(
      getSubmissionDisabledResult({
        configured: true,
        provider: "browserbase",
        executable: true,
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
      executable: false,
      submitEnabled: false,
    });

    expect(result?.automationConfigured).toBe(false);
    expect(result?.automationProvider).toBeNull();
    expect(result?.message).toContain("Nothing was sent");
  });

  it("blocks when submit is enabled but the browser provider is not executable", () => {
    expect(
      getSubmissionDisabledResult({
        configured: true,
        provider: "browserbase",
        executable: false,
        submitEnabled: true,
      }),
    ).toEqual({
      attemptId: null,
      state: "needs_user_input",
      errorCategory: "provider_unavailable",
      receiptId: null,
      message:
        "Final automated submission cannot start because the browser automation provider is not executable. Nothing was sent to the employer or ATS.",
      automationConfigured: true,
      automationProvider: "browserbase",
    });
  });

  it("allows the caller to continue only when final submit is enabled and executable", () => {
    expect(
      getSubmissionDisabledResult({
        configured: true,
        provider: "browserbase",
        executable: true,
        submitEnabled: true,
      }),
    ).toBeNull();
  });

  it("allows automatic submission only for draft applications", () => {
    expect(canAutoSubmitApplicationStatus("draft")).toBe(true);
    for (const status of ["submitted", "in_review", "interview", "offer", "rejected", "withdrawn", null, undefined]) {
      expect(canAutoSubmitApplicationStatus(status)).toBe(false);
    }
  });

  it("returns a no-send result for non-draft application states", () => {
    const config = {
      configured: true,
      provider: "browserbase",
      executable: true,
      submitEnabled: true,
    };

    expect(getApplicationStateBlockedResult("draft", config)).toBeNull();
    expect(getApplicationStateBlockedResult("submitted", config)).toEqual({
      attemptId: null,
      state: "needs_user_input",
      errorCategory: "already_submitted",
      receiptId: null,
      message:
        "Automatic submission is only allowed while this application is in Draft status. Nothing was sent to the employer or ATS.",
      automationConfigured: true,
      automationProvider: "browserbase",
    });
  });
});