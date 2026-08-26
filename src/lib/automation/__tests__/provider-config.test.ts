import { afterEach, describe, expect, it } from "vitest";

import { detectProviderConfig, resolveBrowserProvider } from "../provider/resolve.server";

const KEYS = [
  "BROWSERBASE_API_KEY",
  "BROWSERBASE_PROJECT_ID",
  "STEEL_API_KEY",
  "PLAYWRIGHT_SERVICE_URL",
  "AUTOMATION_ENABLE_SUBMIT",
] as const;

const restore = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

function clearAutomationEnv() {
  for (const key of KEYS) delete process.env[key];
}

afterEach(() => {
  clearAutomationEnv();
  for (const key of KEYS) {
    const value = restore[key];
    if (value !== undefined) process.env[key] = value;
  }
});

describe("browser provider configuration", () => {
  it("reports the integration installed but not executable without credentials", () => {
    clearAutomationEnv();
    const config = detectProviderConfig();
    expect(config.installedDrivers).toContain("browserbase");
    expect(config.configured).toBe(false);
    expect(config.executable).toBe(false);
    expect(config.submitEnabled).toBe(false);
    expect(config.healthVerified).toBe(false);
  });

  it("does not become executable with an API key but missing project id", async () => {
    clearAutomationEnv();
    process.env["BROWSERBASE_API_KEY"] = "test-only-key";
    const config = detectProviderConfig();
    expect(config.configured).toBe(true);
    expect(config.driverAvailable).toBe(true);
    expect(config.missingConfig).toContain("BROWSERBASE_PROJECT_ID");
    expect(config.executable).toBe(false);
    await expect(resolveBrowserProvider({ userId: "test-user" })).resolves.toBeNull();
  });

  it("never claims connectivity has been verified from environment config alone", () => {
    clearAutomationEnv();
    process.env["BROWSERBASE_API_KEY"] = "test-only-key";
    process.env["BROWSERBASE_PROJECT_ID"] = "test-project";
    const config = detectProviderConfig();
    expect(config.executable).toBe(true);
    expect(config.healthVerified).toBe(false);
  });

  it("does not treat credentials for an uninstalled provider as executable", () => {
    clearAutomationEnv();
    process.env["STEEL_API_KEY"] = "test-only-key";
    const config = detectProviderConfig();
    expect(config.provider).toBe("steel");
    expect(config.configured).toBe(true);
    expect(config.driverAvailable).toBe(false);
    expect(config.executable).toBe(false);
  });

  it("keeps irreversible submit disabled unless the safety switch is exactly true", () => {
    clearAutomationEnv();
    process.env["BROWSERBASE_API_KEY"] = "test-only-key";
    process.env["BROWSERBASE_PROJECT_ID"] = "test-project";

    expect(detectProviderConfig().submitEnabled).toBe(false);

    process.env["AUTOMATION_ENABLE_SUBMIT"] = "TRUE";
    expect(detectProviderConfig().submitEnabled).toBe(false);

    process.env["AUTOMATION_ENABLE_SUBMIT"] = "1";
    expect(detectProviderConfig().submitEnabled).toBe(false);

    process.env["AUTOMATION_ENABLE_SUBMIT"] = "true";
    expect(detectProviderConfig().submitEnabled).toBe(true);
  });
});
