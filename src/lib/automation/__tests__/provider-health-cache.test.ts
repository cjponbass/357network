import { afterEach, describe, expect, it, vi } from "vitest";

const verifyBrowserbaseHealth = vi.fn(async () => true);

vi.mock("../provider/health.server", () => ({
  verifyBrowserbaseHealth,
}));

import { verifyBrowserProviderHealth } from "../provider/resolve.server";

const KEYS = ["BROWSERBASE_API_KEY", "BROWSERBASE_PROJECT_ID"] as const;
const restore = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

function configureBrowserbase() {
  process.env["BROWSERBASE_API_KEY"] = "test-only-key";
  process.env["BROWSERBASE_PROJECT_ID"] = "test-project";
}

afterEach(() => {
  verifyBrowserbaseHealth.mockClear();
  for (const key of KEYS) {
    const value = restore[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("browser provider health caching", () => {
  it("reuses a recent successful health check for the same user", async () => {
    configureBrowserbase();
    const owner = { userId: `cache-user-${Date.now()}` };

    await expect(verifyBrowserProviderHealth(owner)).resolves.toBe(true);
    await expect(verifyBrowserProviderHealth(owner)).resolves.toBe(true);

    expect(verifyBrowserbaseHealth).toHaveBeenCalledTimes(1);
  });

  it("does not share health verification across users", async () => {
    configureBrowserbase();
    const suffix = Date.now();

    await expect(
      Promise.all([
        verifyBrowserProviderHealth({ userId: `cache-user-a-${suffix}` }),
        verifyBrowserProviderHealth({ userId: `cache-user-b-${suffix}` }),
      ]),
    ).resolves.toEqual([true, true]);

    expect(verifyBrowserbaseHealth).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent health checks for the same user", async () => {
    configureBrowserbase();
    const owner = { userId: `pending-user-${Date.now()}` };

    await expect(
      Promise.all([
        verifyBrowserProviderHealth(owner),
        verifyBrowserProviderHealth(owner),
        verifyBrowserProviderHealth(owner),
      ]),
    ).resolves.toEqual([true, true, true]);

    expect(verifyBrowserbaseHealth).toHaveBeenCalledTimes(1);
  });
});
