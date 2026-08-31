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

  it.each([
    "https://boards.greenhouse.io.evil.example/acme/jobs/123",
    "https://jobs.lever.co.evil.example/acme/123",
    "https://jobs.ashbyhq.com.evil.example/acme/123",
    "https://acme.wd1.myworkdayjobs.com.evil.example/job/123",
    "https://greenhouse.io.evil.example/boards.greenhouse.io/acme",
  ])("rejects deceptive ATS look-alike hosts: %s", (url) => {
    expect(detectAts(url).provider).toBe("unknown");
  });

  it.each([
    "ftp://jobs.lever.co/acme/123",
    "file://boards.greenhouse.io/acme/jobs/123",
    "javascript://jobs.ashbyhq.com/acme/123",
  ])("rejects non-HTTP(S) ATS-looking URLs: %s", (url) => {
    expect(detectAts(url).provider).toBe("unknown");
  });

  it.each([
    "https://www.greenhouse.io/",
    "https://support.greenhouse.io/",
    "https://www.lever.co/",
    "https://help.lever.co/",
    "https://www.ashbyhq.com/",
  ])("does not treat corporate or support hosts as application targets: %s", (url) => {
    expect(detectAts(url).provider).toBe("unknown");
  });

  it("does not treat the general Workday company domain as an application tenant", () => {
    expect(detectAts("https://www.workday.com/en-us/company/careers.html").provider).toBe("unknown");
  });
});
