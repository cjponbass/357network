/**
 * ATS detection from a posting/application URL.
 * Detection is classification only and never implies submission succeeded.
 *
 * Keep detection host-based. Never classify an unrelated site as an ATS merely
 * because its path or query string contains an ATS-looking token.
 */

import type { AtsProvider } from "./types";

interface HostRule {
  provider: AtsProvider;
  test: (host: string) => boolean;
  reason: string;
}

const RULES: HostRule[] = [
  {
    provider: "greenhouse",
    test: (h) => /(^|\.)greenhouse\.io$/.test(h) || /(^|\.)grnh\.se$/.test(h),
    reason: "Host is a Greenhouse job board domain.",
  },
  {
    provider: "lever",
    test: (h) => /(^|\.)lever\.co$/.test(h),
    reason: "Host is a Lever job board domain.",
  },
  {
    provider: "ashby",
    test: (h) => /(^|\.)ashbyhq\.com$/.test(h),
    reason: "Host is an Ashby job board domain.",
  },
  {
    provider: "workday",
    test: (h) => /(^|\.)myworkdayjobs\.com$/.test(h),
    reason: "Host is a Workday tenant careers domain.",
  },
];

export interface AtsDetection {
  provider: AtsProvider;
  reason: string;
  host: string | null;
}

export function detectAts(rawUrl: string | null | undefined): AtsDetection {
  if (!rawUrl || rawUrl.trim() === "") {
    return { provider: "unknown", reason: "No application or posting URL is saved.", host: null };
  }

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { provider: "unknown", reason: "The saved URL could not be parsed.", host: null };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { provider: "unknown", reason: "The saved URL is not an HTTP(S) job URL.", host: null };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");

  for (const rule of RULES) {
    if (rule.test(host)) {
      return { provider: rule.provider, reason: rule.reason, host };
    }
  }

  return {
    provider: "unknown",
    reason: `No known ATS host pattern matched ${host}.`,
    host,
  };
}
