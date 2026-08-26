import { describe, expect, it } from "vitest";

import { detectAts } from "../ats-detect";

describe("ATS URL detection", () => {
  it.each([
    ["https://boards.greenhouse.io/acme/jobs/123", "greenhouse"],
    ["https://job-boards.greenhouse.io/acme/jobs/123", "greenhouse"],
    ["https://grnh.se/abc123", "greenhouse"],
    ["https://jobs.lever.co/acme/123", "lever"],
    ["https://hire.lever.co/acme/123", "lever"],
    ["https://jobs.ashbyhq.com/acme/123", "ashby"],
    ["https://acme.wd1.myworkdayjobs.com/en-US/jobs/job/123", "workday"],
  ] as const)("detects %s as %s", (url, provider) => {
    expect(detectAts(url).provider).toBe(provider);
  });

  it("normalizes host casing and surrounding whitespace", () => {
    const detection = detectAts("  https://JOBS.LEVER.CO/acme/123  ");
    expect(detection.provider).toBe("lever");
    expect(detection.host).toBe("jobs.lever.co");
  });

  it.each([null, undefined, "", "   "])("treats a missing URL as unknown", (url) => {
    const detection = detectAts(url);
    expect(detection.provider).toBe("unknown");
    expect(detection.host).toBeNull();
  });

  it("does not classify malformed URLs", () => {
    const detection = detectAts("not a valid url");
    expect(detection.provider).toBe("unknown");
    expect(detection.host).toBeNull();
  });

  it("does not trust ATS-looking text outside the hostname", () => {
    expect(detectAts("https://example.com/jobs/lever.co/123").provider).toBe("unknown");
    expect(detectAts("https://example.com/?next=https://boards.greenhouse.io/acme").provider).toBe("unknown");
  });
});
