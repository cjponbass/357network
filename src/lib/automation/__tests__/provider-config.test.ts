import { afterEach, describe, expect, it } from "vitest";

import { detectProviderConfig, resolveBrowserProvider } from "../provider/resolve.server";

const API_KEY = "BROWSERBASE_API_KEY";
const PROJECT_ID = "BROWSERBASE_PROJECT_ID";
const SUBMIT_FLAG = "AUTOMATION_ENABLE_SUBMIT";

const restore: Record<string, string | undefined> = {
  [API_KEY]: process.env[API_KEY],
  [PROJECT_ID]: process.env[PROJECT_ID],
  [SUBMIT_FLAG]: process.env[SUBMIT_FLAG],
};

afterEach(() => {
  for (const [key, value] of Object.entries(restore)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("browser provider configuration", () => {
  it("reports the integration installed but not executable without credentials", () => {
    delete process.env[API_KEY];
    delete process.env[PROJECT_ID];
    const config = detectProviderConfig();
    expect(config.installedDrivers).toContain("browserbase");
    expect(config.configured).toBe(false);
    expect(config.executable).toBe(false);
    expect(config.healthVerified).toBe(false);
  });

  it("does not become executable with an API key but missing project id", async () => {
    process.env[API_KEY] = "test-only-key";
    delete process.env[PROJECT_ID];
    const config = detectProviderConfig();
    expect(config.configured).toBe(true);
    expect(config.driverAvailable).toBe(true);
    expect(config.missingConfig).toContain(PROJECT_ID);
    expect(config.executable).toBe(false);
    await expect(resolveBrowserProvider({ userId: "test-user" })).resolves.toBeNull();
  });

  it("never claims connectivity has been verified from environment config alone", () => {
    process.env[API_KEY] = "test-only-key";
    process.env[PROJECT_ID] = "test-project";
    const config = detectProviderConfig();
    expect(config.executable).toBe(true);
    expect(config.healthVerified).toBe(false);
  });

  it("keeps irreversible submit disabled unless explicitly enabled", () => {
    process.env[API_KEY] = "test-only-key";
    process.env[PROJECT_ID] = "test-project";
    delete process.env[SUBMIT_FLAG];
    expect(detectProviderConfig().submitEnabled).toBe(false);
    process.env[SUBMIT_FLAG] = "true";
    expect(detectProviderConfig().submitEnabled).toBe(true);
  });
});
