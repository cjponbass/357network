import { describe, expect, it } from "vitest";

import { PLAN_ENTITLEMENTS, isCandidatePlan, planAllows } from "../plans";

describe("candidate billing plans", () => {
  it("locks launch pricing and five-day trials", () => {
    expect(PLAN_ENTITLEMENTS.basic.monthlyPriceUsd).toBe(14.99);
    expect(PLAN_ENTITLEMENTS.pro.monthlyPriceUsd).toBe(29.99);
    expect(PLAN_ENTITLEMENTS.auto.monthlyPriceUsd).toBe(39.99);
    expect(PLAN_ENTITLEMENTS.basic.trialDays).toBe(5);
    expect(PLAN_ENTITLEMENTS.pro.trialDays).toBe(5);
    expect(PLAN_ENTITLEMENTS.auto.trialDays).toBe(5);
  });

  it("keeps feature tiers cumulative", () => {
    expect(planAllows("basic", "basic")).toBe(true);
    expect(planAllows("basic", "pro")).toBe(false);
    expect(planAllows("pro", "basic")).toBe(true);
    expect(planAllows("pro", "pro")).toBe(true);
    expect(planAllows("pro", "auto")).toBe(false);
    expect(planAllows("auto", "basic")).toBe(true);
    expect(planAllows("auto", "pro")).toBe(true);
    expect(planAllows("auto", "auto")).toBe(true);
  });

  it("keeps ATS automation exclusive to Auto", () => {
    expect(PLAN_ENTITLEMENTS.basic.atsAutomation).toBe(false);
    expect(PLAN_ENTITLEMENTS.pro.atsAutomation).toBe(false);
    expect(PLAN_ENTITLEMENTS.auto.atsAutomation).toBe(true);
  });

  it("keeps tailored documents at Pro and above", () => {
    expect(PLAN_ENTITLEMENTS.basic.tailoredDocuments).toBe(false);
    expect(PLAN_ENTITLEMENTS.pro.tailoredDocuments).toBe(true);
    expect(PLAN_ENTITLEMENTS.auto.tailoredDocuments).toBe(true);
  });

  it.each(["basic", "pro", "auto"])("recognizes %s as a candidate plan", (plan) => {
    expect(isCandidatePlan(plan)).toBe(true);
  });

  it.each(["free", "enterprise", "", null, undefined])("rejects invalid plan %s", (plan) => {
    expect(isCandidatePlan(plan)).toBe(false);
  });
});
