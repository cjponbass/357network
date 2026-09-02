import { afterEach, describe, expect, it, vi } from "vitest";

const verifyBrowserbaseRestHealth = vi.fn(async () => true);

vi.mock("../provider/browserbase-rest.server", () => ({
  verifyBrowserbaseRestHealth,
}));

import { verifyBrowserProviderHealth } from "../provider/resolve.server";

const KEYS = ["BROWSERBASE_API_KEY", "BROWSERBASE_PROJECT_ID", "OPENAI_API_KEY"] as const;
const restore = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

function configureBrowserbase() {
  process.env["BROWSERBASE_API_KEY"] = "test-only-key";
  process.env["BROWSERBASE_PROJECT_ID"] = "test-project";
  process.env["OPENAI_API_KEY"] = "test-model-key";
}

afterEach(() => {
  verifyBrowserbaseRestHealth.mockClear();
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

    expect(verifyBrowserbaseRestHealth).toHaveBeenCalledTimes(1);
  });

  it("does not share health verification across users", async () => {
    configureBrowserbase();
    const suffix = Date.now();
    const firstOwner = { userId: `cache-user-a-${suffix}` };
    const secondOwner = { userId: `cache-user-b-${suffix}` };

    await expect(verifyBrowserProviderHealth(firstOwner)).resolves.toBe(true);
    await expect(verifyBrowserProviderHealth(secondOwner)).resolves.toBe(true);

    expect(verifyBrowserbaseRestHealth).toHaveBeenCalledTimes(2);
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

    expect(verifyBrowserbaseRestHealth).toHaveBeenCalledTimes(1);
  });
});
