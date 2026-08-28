import { describe, expect, it } from "vitest";

import { validateApplicationId, validateAtsUrlInput, validateSubmissionInput } from "../input-validation";

describe("automation input validation", () => {
  it("accepts and trims valid Supabase UUID application IDs", () => {
    expect(validateApplicationId({ applicationId: " 123e4567-e89b-42d3-a456-426614174000 " })).toEqual({
      applicationId: "123e4567-e89b-42d3-a456-426614174000",
    });
  });

  it.each(["", "not-a-uuid", "123e4567-e89b-02d3-a456-426614174000"])(
    "rejects invalid application ID %j",
    (applicationId) => {
      expect(() => validateApplicationId({ applicationId })).toThrow("A valid application ID is required.");
    },
  );

  it("accepts and trims an HTTP(S) ATS URL", () => {
    expect(validateAtsUrlInput({ url: "  https://boards.greenhouse.io/example/jobs/123  " })).toEqual({
      url: "https://boards.greenhouse.io/example/jobs/123",
    });
  });

  it("normalizes an empty ATS URL to null", () => {
    expect(validateAtsUrlInput({ url: "   " })).toEqual({ url: null });
    expect(validateAtsUrlInput({ url: null })).toEqual({ url: null });
  });

  it.each(["not-a-url", "javascript:alert(1)", "ftp://example.com/job"])(
    "rejects unsafe or malformed ATS URL %j",
    (url) => {
      expect(() => validateAtsUrlInput({ url })).toThrow("A valid HTTP(S) application URL is required.");
    },
  );

  it("rejects oversized ATS URLs", () => {
    expect(() => validateAtsUrlInput({ url: `https://example.com/${"x".repeat(2048)}` })).toThrow(
      "Application URL is too long.",
    );
  });

  it("normalizes an optional submission request key", () => {
    expect(
      validateSubmissionInput({
        applicationId: "123e4567-e89b-42d3-a456-426614174000",
        requestKey: "  retry-1  ",
      }),
    ).toEqual({
      applicationId: "123e4567-e89b-42d3-a456-426614174000",
      requestKey: "retry-1",
    });
  });

  it("converts a blank request key to null", () => {
    expect(
      validateSubmissionInput({
        applicationId: "123e4567-e89b-42d3-a456-426614174000",
        requestKey: "   ",
      }).requestKey,
    ).toBeNull();
  });

  it("rejects oversized idempotency keys", () => {
    expect(() =>
      validateSubmissionInput({
        applicationId: "123e4567-e89b-42d3-a456-426614174000",
        requestKey: "x".repeat(201),
      }),
    ).toThrow("Submission request key is too long.");
  });
});
