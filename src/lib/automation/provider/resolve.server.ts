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

const PROVIDER_CACHE = new Map<string, Promise<BrowserAutomationProvider>>();

function hasConfiguredValue(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

function providerCacheKey(provider: string, owner: ProviderOwner): string {
  return `${provider}:${owner.userId}`;
}

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
    if (hasConfiguredValue(envVar)) {
      const driverAvailable = Boolean(DRIVERS[name]);
      const missingConfig = (DRIVER_REQUIRED_CONFIG[name] ?? []).filter(
        (key) => !hasConfiguredValue(key),
      );
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

/**
 * Verifies that the selected configured provider can establish a real browser
 * session. This check never navigates to an employer site and never submits.
 */
export async function verifyBrowserProviderHealth(owner: ProviderOwner): Promise<boolean> {
  const config = detectProviderConfig();
  if (!config.executable || !config.provider) return false;
  if (config.provider === "browserbase") {
    const { verifyBrowserbaseHealth } = await import("./health.server");
    return verifyBrowserbaseHealth(owner);
  }
  return false;
}

export async function resolveBrowserProvider(
  owner: ProviderOwner,
): Promise<BrowserAutomationProvider | null> {
  const config = detectProviderConfig();
  if (!config.executable || !config.provider) return null;
  const factory = DRIVERS[config.provider];
  if (!factory) return null;

  const cacheKey = providerCacheKey(config.provider, owner);
  const cached = PROVIDER_CACHE.get(cacheKey);
  if (cached) {
    try {
      return await cached;
    } catch {
      PROVIDER_CACHE.delete(cacheKey);
      return null;
    }
  }

  const pending = factory(owner);
  PROVIDER_CACHE.set(cacheKey, pending);
  try {
    return await pending;
  } catch {
    PROVIDER_CACHE.delete(cacheKey);
    return null;
  }
}
