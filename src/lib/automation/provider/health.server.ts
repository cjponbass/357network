import type { ProviderOwner } from "./browserbase.server";
import { browserbaseDeps } from "./browserbase.server";

/**
 * Performs a controlled Browserbase connectivity check without navigating to
 * an employer site or submitting anything. A successful result proves that
 * the configured credentials/project can create a session and that Playwright
 * can connect to it. The session is always closed and released best-effort.
 */
export async function verifyBrowserbaseHealth(owner: ProviderOwner): Promise<boolean> {
  let sessionId: string | null = null;
  let browser: { close(): Promise<void> } | null = null;

  try {
    const deps = await browserbaseDeps(owner);
    const session = await deps.createSession();
    sessionId = session.id;
    const connected = await deps.connect(session.connectUrl);
    browser = connected.browser;
    return true;
  } catch {
    return false;
  } finally {
    if (browser) await browser.close().catch(() => undefined);
    if (sessionId) {
      try {
        const deps = await browserbaseDeps(owner);
        await deps.releaseSession(sessionId);
      } catch {
        /* best effort cleanup */
      }
    }
  }
}
