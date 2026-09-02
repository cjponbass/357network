import { describe, expect, it } from "vitest";

import { isTrustedAtsNavigation } from "../provider/browserbase.server";

describe("trusted ATS navigation boundary", () => {
  it("allows redirects that stay within the same supported ATS provider", () => {
    expect(
      isTrustedAtsNavigation(
        "https://grnh.se/example",
        "https://boards.greenhouse.io/example/jobs/123",
      ),
    ).toBe(true);
    expect(
      isTrustedAtsNavigation(
        "https://tenant.wd5.myworkdayjobs.com/en-US/jobs/job/123",
        "https://tenant.myworkdayjobs.com/en-US/jobs/job/123",
      ),
    ).toBe(true);
  });

  it("rejects redirects to an unrelated or deceptive host before candidate data entry", () => {
    expect(
      isTrustedAtsNavigation(
        "https://jobs.lever.co/example/123",
        "https://jobs.lever.co.evil.example/collect",
      ),
    ).toBe(false);
    expect(
      isTrustedAtsNavigation(
        "https://jobs.ashbyhq.com/example/123",
        "https://example.com/application",
      ),
    ).toBe(false);
  });

  it("rejects cross-provider redirects even when both hosts are supported", () => {
    expect(
      isTrustedAtsNavigation(
        "https://jobs.lever.co/example/123",
        "https://boards.greenhouse.io/example/jobs/123",
      ),
    ).toBe(false);
  });

  it("rejects unsupported starting URLs", () => {
    expect(
      isTrustedAtsNavigation(
        "https://example.com/jobs/123",
        "https://jobs.lever.co/example/123",
      ),
    ).toBe(false);
  });
});
