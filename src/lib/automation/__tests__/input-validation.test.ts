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

  it.each([
    "http://localhost:3000/job",
    "http://localhost./job",
    "http://jobs.localhost/job",
    "http://jobs.localhost./job",
    "http://intranet/job",
    "http://ats.local/job",
    "http://ats.internal/job",
    "http://ats.lan/job",
    "http://router.home.arpa/job",
    "http://127.0.0.1/job",
    "http://10.0.0.5/job",
    "http://100.64.0.1/job",
    "http://100.127.255.254/job",
    "http://169.254.169.254/latest/meta-data",
    "http://172.16.1.10/job",
    "http://172.31.255.254/job",
    "http://192.0.0.1/job",
    "http://192.0.2.1/job",
    "http://192.168.1.20/job",
    "http://198.18.0.1/job",
    "http://198.19.255.254/job",
    "http://198.51.100.1/job",
    "http://203.0.113.1/job",
    "http://224.0.0.1/job",
    "http://255.255.255.255/job",
    "http://[::]/job",
    "http://[::1]/job",
    "http://[::ffff:127.0.0.1]/job",
    "http://[fc00::1]/job",
    "http://[fd12::1]/job",
    "http://[fe80::1]/job",
  ])("rejects local or private ATS target %j", (url) => {
    expect(() => validateAtsUrlInput({ url })).toThrow(
      "Application URL cannot target a local or private network address.",
    );
  });

  it("rejects ATS URLs with embedded credentials", () => {
    expect(() => validateAtsUrlInput({ url: "https://user:secret@example.com/job" })).toThrow(
      "Application URL cannot contain embedded credentials.",
    );
  });

  it.each(["https://100.128.0.1/job", "https://172.32.0.1/job", "https://198.20.0.1/job"])(
    "does not over-block public address %j near reserved IPv4 ranges",
    (url) => {
      expect(validateAtsUrlInput({ url })).toEqual({ url });
    },
  );

  it("accepts a normal public hostname", () => {
    const url = "https://jobs.example.org/apply";
    expect(validateAtsUrlInput({ url })).toEqual({ url });
  });

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
