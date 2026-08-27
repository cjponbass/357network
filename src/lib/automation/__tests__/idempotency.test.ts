import { describe, expect, it } from "vitest";

import { buildIdempotencyKey, canonicalizeSubmissionTarget } from "../execution";

describe("submission idempotency target normalization", () => {
  it("ignores URL fragments when deriving the automatic attempt key", () => {
    const base = "https://boards.greenhouse.io/acme/jobs/123?gh_jid=123";
    expect(
      buildIdempotencyKey({ applicationId: "app-1", targetUrl: `${base}#application` }),
    ).toBe(buildIdempotencyKey({ applicationId: "app-1", targetUrl: `${base}#form` }));
  });

  it("preserves query parameters because they may identify the job", () => {
    const first = buildIdempotencyKey({
      applicationId: "app-1",
      targetUrl: "https://boards.greenhouse.io/acme/jobs/123?gh_jid=123",
    });
    const second = buildIdempotencyKey({
      applicationId: "app-1",
      targetUrl: "https://boards.greenhouse.io/acme/jobs/123?gh_jid=456",
    });
    expect(first).not.toBe(second);
  });

  it("keeps explicit request keys authoritative", () => {
    expect(
      buildIdempotencyKey({
        applicationId: "app-1",
        targetUrl: "https://example.com/job#one",
        requestKey: " retry-42 ",
      }),
    ).toBe("retry-42");
  });

  it("handles null and malformed targets deterministically", () => {
    expect(canonicalizeSubmissionTarget(null)).toBe("no-url");
    expect(canonicalizeSubmissionTarget("  not a url  ")).toBe("not a url");
  });
});
