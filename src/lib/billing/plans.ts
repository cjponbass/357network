export type CandidatePlan = "basic" | "pro" | "auto";

export type PlanEntitlements = {
  monthlyPriceUsd: number;
  trialDays: number;
  aiFitAndAnswers: boolean;
  tailoredDocuments: boolean;
  atsAutomation: boolean;
};

export const PLAN_ENTITLEMENTS: Record<CandidatePlan, PlanEntitlements> = {
  basic: {
    monthlyPriceUsd: 14.99,
    trialDays: 5,
    aiFitAndAnswers: true,
    tailoredDocuments: false,
    atsAutomation: false,
  },
  pro: {
    monthlyPriceUsd: 29.99,
    trialDays: 5,
    aiFitAndAnswers: true,
    tailoredDocuments: true,
    atsAutomation: false,
  },
  auto: {
    monthlyPriceUsd: 39.99,
    trialDays: 5,
    aiFitAndAnswers: true,
    tailoredDocuments: true,
    atsAutomation: true,
  },
};

export const PLAN_LABELS: Record<CandidatePlan, string> = {
  basic: "Basic",
  pro: "Pro",
  auto: "Auto",
};

export const BILLABLE_STATUSES = new Set(["trialing", "active"]);

export function isCandidatePlan(value: unknown): value is CandidatePlan {
  return value === "basic" || value === "pro" || value === "auto";
}

export function planAllows(current: CandidatePlan, required: CandidatePlan): boolean {
  const rank: Record<CandidatePlan, number> = { basic: 1, pro: 2, auto: 3 };
  return rank[current] >= rank[required];
}
