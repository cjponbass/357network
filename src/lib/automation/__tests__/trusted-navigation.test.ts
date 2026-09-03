import { describe, expect, it, vi } from "vitest";

import {
  createBrowserbaseProvider,
  isTrustedAtsNavigation,
  type BrowserbaseDeps,
  type PageLike,
} from "../provider/browserbase.server";

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

  it("revalidates the ATS boundary before inspection and submission after a mid-session redirect", async () => {
    let currentUrl = "https://jobs.lever.co/example/123";
    const evaluate = vi.fn();
    const click = vi.fn();
    const page: PageLike = {
      async goto(url) {
        currentUrl = url;
      },
      evaluate,
      async fill() {},
      async setInputFiles() {},
      click,
      async screenshot() {
        return new Uint8Array();
      },
      url() {
        return currentUrl;
      },
    };
    const deps: BrowserbaseDeps = {
      async createSession() {
        return { id: "session-1", connectUrl: "wss://browser.example/session-1" };
      },
      async connect() {
        return { browser: { async close() {} }, page };
      },
      async releaseSession() {},
      async downloadDocument() {
        throw new Error("not used");
      },
      async storeScreenshot() {
        return null;
      },
      submitEnabled: true,
    };
    const provider = createBrowserbaseProvider(deps);
    const session = await provider.openSession(currentUrl);

    currentUrl = "https://evil.example/collect";

    const inspected = await provider.inspect(session);
    expect(inspected.fields).toEqual([]);
    expect(inspected.blockers[0]?.kind).toBe("provider_error");
    expect(inspected.blockers[0]?.message).toContain("trusted ATS provider");
    expect(evaluate).not.toHaveBeenCalled();

    const submitted = await provider.submit(session);
    expect(submitted.submitted).toBe(false);
    expect(submitted.blockers[0]?.kind).toBe("provider_error");
    expect(click).not.toHaveBeenCalled();
  });
});
