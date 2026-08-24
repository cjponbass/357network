/**
 * Server-only browser-provider resolution — the single source of truth for
 * automation availability.
 */

import type { ProviderOwner } from "./browserbase.server";
import type { BrowserAutomationProvider } from "./contract";

const CREDENTIALS: Array<[string, string]> = [
  ["BROWSERBASE_API_KEY", "browserbase"],
  ["STEEL_API_KEY", "steel"],
  ["PLAYWRIGHT_SERVICE_URL", "playwright-service"],
];

const DRIVERS: Record<
  string,
  ((owner: ProviderOwner) => Promise<BrowserAutomationProvider>) | undefined
> = {
  browserbase: async (owner) => {
    const { createBrowserbaseProvider, browserbaseDeps } = await import("./browserbase.server");
    return createBrowserbaseProvider(await browserbaseDeps(owner));
  },
};

const DRIVER_REQUIRED_CONFIG: Record<string, string[] | undefined> = {
  browserbase: ["BROWSERBASE_PROJECT_ID"],
};

export interface ProviderConfig {
  configured: boolean;
  provider: string | null;
  driverAvailable: boolean;
  executable: boolean;
  submitEnabled: boolean;
  installedDrivers: string[];
  missingConfig: string[];
  healthVerified: false;
}

export function detectProviderConfig(): ProviderConfig {
  const installedDrivers = Object.keys(DRIVERS);
  const submitEnabled = process.env["AUTOMATION_ENABLE_SUBMIT"] === "true";
  for (const [envVar, name] of CREDENTIALS) {
    if (process.env[envVar]) {
      const driverAvailable = Boolean(DRIVERS[name]);
      const missingConfig = (DRIVER_REQUIRED_CONFIG[name] ?? []).filter((key) => !process.env[key]);
      return {
        configured: true,
        provider: name,
        driverAvailable,
        executable: driverAvailable && missingConfig.length === 0,
        submitEnabled,
        installedDrivers,
        missingConfig,
        healthVerified: false,
      };
    }
  }
  return {
    configured: false,
    provider: null,
    driverAvailable: false,
    executable: false,
    submitEnabled,
    installedDrivers,
    missingConfig: [],
    healthVerified: false,
  };
}

export async function resolveBrowserProvider(
  owner: ProviderOwner,
): Promise<BrowserAutomationProvider | null> {
  const config = detectProviderConfig();
  if (!config.executable || !config.provider) return null;
  const factory = DRIVERS[config.provider];
  if (!factory) return null;
  try {
    return await factory(owner);
  } catch {
    return null;
  }
}
