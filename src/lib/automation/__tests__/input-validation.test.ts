import { describe, expect, it } from "vitest";

import { validateApplicationId, validateSubmissionInput } from "../automation.functions";

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
