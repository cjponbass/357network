/**
 * Adapter registry. Adding an ATS means adding a module here — orchestration
 * code stays untouched.
 */

import type { AtsProvider } from "../types";
import type { AtsAdapter } from "./contract";
import { greenhouseAdapter } from "./greenhouse";

const ADAPTERS: Partial<Record<AtsProvider, AtsAdapter>> = {
  greenhouse: greenhouseAdapter,
};

export function getAdapter(provider: AtsProvider): AtsAdapter | null {
  return ADAPTERS[provider] ?? null;
}
