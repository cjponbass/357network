/**
 * ATS detection from a posting/application URL.
 * Detection is classification only and never implies submission succeeded.
 */

import type { AtsProvider } from "./types";

interface HostRule {
  provider: AtsProvider;
  test: (host: string, path: string) => boolean;
  reason: string;
}

const RULES: HostRule[] = [
  {
    provider: "greenhouse",
    test: (h) => /(^|\.)greenhouse\.io$/.test(h) || /(^|\.)grnh\.se$/.test(h),
    reason: "Host is a Greenhouse job board domain.",
  },
  {
    provider: "greenhouse",
    test: (_h, p) => /\/embed\/job_app|boards\.greenhouse/.test(p),
    reason: "Path matches a Greenhouse embedded application form.",
  },
  {
    provider: "lever",
    test: (h) => /(^|\.)lever\.co$/.test(h) || /(^|\.)hire\.lever\.co$/.test(h),
    reason: "Host is a Lever job board domain.",
  },
  {
    provider: "ashby",
    test: (h) => /(^|\.)ashbyhq\.com$/.test(h),
    reason: "Host is an Ashby job board domain.",
  },
  {
    provider: "workday",
    test: (h) => /(^|\.)myworkdayjobs\.com$/.test(h) || /(^|\.)workday\.com$/.test(h),
    reason: "Host is a Workday careers domain.",
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
  const host = url.hostname.toLowerCase();
  const path = `${host}${url.pathname}`.toLowerCase();

  for (const rule of RULES) {
    if (rule.test(host, path)) {
      return { provider: rule.provider, reason: rule.reason, host };
    }
  }
  return {
    provider: "unknown",
    reason: `No known ATS host pattern matched ${host}.`,
    host,
  };
}
