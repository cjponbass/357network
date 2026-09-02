/** Server-only browser-provider resolution — single source of truth for automation availability. */

import type { ProviderOwner } from "./browserbase.server";
import type { BrowserAutomationProvider } from "./contract";

const CREDENTIALS: Array<[string, string]> = [
  ["BROWSERBASE_API_KEY", "browserbase"],
  ["STEEL_API_KEY", "steel"],
  ["PLAYWRIGHT_SERVICE_URL", "playwright-service"],
];

const DRIVERS: Record<string, ((owner: ProviderOwner) => Promise<BrowserAutomationProvider>) | undefined> = {
  browserbase: async (owner) => {
    const { createBrowserbaseRestProvider } = await import("./browserbase-rest.server");
    return createBrowserbaseRestProvider(owner);
  },
};

const DRIVER_REQUIRED_CONFIG: Record<string, string[] | undefined> = {
  browserbase: ["BROWSERBASE_PROJECT_ID", "OPENAI_API_KEY"],
};

const PROVIDER_CACHE = new Map<string, Promise<BrowserAutomationProvider>>();
const HEALTH_CACHE = new Map<string, { result: boolean; expiresAt: number }>();
const HEALTH_PENDING = new Map<string, Promise<boolean>>();
const HEALTH_SUCCESS_TTL_MS = 5 * 60 * 1000;
const HEALTH_FAILURE_TTL_MS = 30 * 1000;

function hasConfiguredValue(key: string): boolean { return Boolean(process.env[key]?.trim()); }
function providerCacheKey(provider: string, owner: ProviderOwner): string { return `${provider}:${owner.userId}`; }

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
      const missingConfig = (DRIVER_REQUIRED_CONFIG[name] ?? []).filter((key) => !hasConfiguredValue(key));
      return { configured: true, provider: name, driverAvailable, executable: driverAvailable && missingConfig.length === 0, submitEnabled, installedDrivers, missingConfig, healthVerified: false };
    }
  }
  return { configured: false, provider: null, driverAvailable: false, executable: false, submitEnabled, installedDrivers, missingConfig: [], healthVerified: false };
}

/** Controlled connectivity check. It never navigates to an employer site or submits. */
export async function verifyBrowserProviderHealth(owner: ProviderOwner): Promise<boolean> {
  const config = detectProviderConfig();
  if (!config.executable || !config.provider) return false;
  const cacheKey = providerCacheKey(config.provider, owner);
  const now = Date.now();
  const cached = HEALTH_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.result;
  if (cached) HEALTH_CACHE.delete(cacheKey);
  const pending = HEALTH_PENDING.get(cacheKey);
  if (pending) return pending;

  const probe = (async () => {
    let result = false;
    if (config.provider === "browserbase") {
      const { verifyBrowserbaseRestHealth } = await import("./browserbase-rest.server");
      result = await verifyBrowserbaseRestHealth();
    }
    HEALTH_CACHE.set(cacheKey, { result, expiresAt: Date.now() + (result ? HEALTH_SUCCESS_TTL_MS : HEALTH_FAILURE_TTL_MS) });
    return result;
  })();
  HEALTH_PENDING.set(cacheKey, probe);
  try { return await probe; } finally { HEALTH_PENDING.delete(cacheKey); }
}

export async function resolveBrowserProvider(owner: ProviderOwner): Promise<BrowserAutomationProvider | null> {
  const config = detectProviderConfig();
  if (!config.executable || !config.provider) return null;
  const factory = DRIVERS[config.provider];
  if (!factory) return null;
  const cacheKey = providerCacheKey(config.provider, owner);
  const cached = PROVIDER_CACHE.get(cacheKey);
  if (cached) {
    try { return await cached; } catch { PROVIDER_CACHE.delete(cacheKey); return null; }
  }
  const pending = factory(owner);
  PROVIDER_CACHE.set(cacheKey, pending);
  try { return await pending; } catch { PROVIDER_CACHE.delete(cacheKey); return null; }
}
