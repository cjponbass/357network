import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const requiredRoutes = [
  "src/routes/index.tsx",
  "src/routes/auth.tsx",
  "src/routes/reset-password.tsx",
  "src/routes/dashboard.tsx",
  "src/routes/discover.tsx",
  "src/routes/jobs.tsx",
  "src/routes/prepare.tsx",
  "src/routes/answers.tsx",
  "src/routes/applications.tsx",
  "src/routes/applications_.$applicationId.tsx",
  "src/routes/documents.tsx",
  "src/routes/profile.tsx",
  "src/routes/settings.tsx",
] as const;

function read(path: string): string { return readFileSync(resolve(root, path), "utf8"); }

describe("357 Network final product surface", () => {
  it("ships every required public and authenticated route", () => {
    for (const route of requiredRoutes) expect(existsSync(resolve(root, route)), route).toBe(true);
  });
  it("keeps unfinished-build language out of user-facing routes", () => {
    const banned = ["Phase 1", "PHASE 1", "skeleton", "Coming soon", "COMING SOON"];
    for (const route of requiredRoutes) {
      const source = read(route);
      for (const phrase of banned) expect(source, `${route} contains unfinished phrase: ${phrase}`).not.toContain(phrase);
    }
  });
  it("uses the approved artwork and exact commercial tagline on the landing page", () => {
    const landing = read("src/routes/index.tsx");
    const brand = read("src/lib/brand.ts");
    expect(brand).toContain('headerImagePath: "/357-network-header.jpg"');
    expect(brand).toContain('tagline: "Where Opportunity Knocks for You. Automatically."');
    expect(landing).toContain("BRAND.headerImagePath");
    expect(landing).toContain("BRAND.tagline");
    expect(landing).toContain("Create account");
    expect(landing).toContain("Sign in");
  });
  it("keeps authentication and recovery on the shared password policy", () => {
    const auth = read("src/routes/auth.tsx");
    const reset = read("src/routes/reset-password.tsx");
    const policy = read("src/lib/auth-policy.ts");
    expect(policy).toContain("MIN_PASSWORD_LENGTH = 8");
    expect(auth).toContain("MIN_PASSWORD_LENGTH");
    expect(auth).toContain("validateNewPassword");
    expect(reset).toContain("MIN_PASSWORD_LENGTH");
    expect(reset).toContain("validatePasswordConfirmation");
  });
  it("exposes the complete authenticated workspace in navigation", () => {
    const nav = read("src/components/app-nav.tsx");
    for (const path of ["/dashboard", "/discover", "/jobs", "/prepare", "/answers", "/applications", "/documents", "/profile", "/settings"]) expect(nav).toContain(`"${path}"`);
  });
  it("ships job discovery and private tailored-document export", () => {
    const discover = read("src/routes/discover.tsx");
    const preparation = read("src/routes/prepare.tsx");
    expect(discover).toContain("searchJobs");
    expect(discover).toContain("Save to 357 Network");
    expect(preparation).toContain("Save tailored resume as PDF");
    expect(preparation).toContain("Save cover letter as PDF");
    expect(preparation.includes("DOCUMENT_STORAGE_BUCKET") || preparation.includes("candidate-documents")).toBe(true);
  });
  it("ships the richer private profile schema and live-form facts", () => {
    const migrationPath = "supabase/migrations/20260902153000_richer_candidate_profile.sql";
    expect(existsSync(resolve(root, migrationPath))).toBe(true);
    const migration = read(migrationPath);
    const profile = read("src/routes/profile.tsx");
    const facts = read("src/lib/ai/facts.server.ts");
    for (const column of ["address_line1", "city", "region", "postal_code", "country", "career_summary", "experience_highlights", "education", "certifications", "languages"]) {
      expect(migration).toContain(column);
      expect(profile).toContain(column);
    }
    expect(profile).toContain("profile_sync");
    expect(facts).toContain("Career summary");
    expect(facts).toContain("Never fabricate experience");
  });
  it("uses the Cloudflare-compatible Browserbase Stagehand REST execution path", () => {
    const provider = read("src/lib/automation/provider/browserbase-rest.server.ts");
    const resolver = read("src/lib/automation/provider/resolve.server.ts");
    expect(provider).toContain("api.stagehand.browserbase.com/v1");
    expect(provider).toContain("canonicalKey");
    expect(provider).toContain("AUTOMATION_ENABLE_SUBMIT");
    expect(provider).toContain("/uploads");
    expect(resolver).toContain("createBrowserbaseRestProvider");
  });
  it("keeps the verified-submission safety language visible", () => {
    const detail = read("src/routes/applications_.$applicationId.tsx");
    expect(detail).toContain("A receipt is created only after concrete confirmation evidence is verified.");
    expect(detail).toContain("CAPTCHA, login walls and unresolved required questions stop the run.");
  });
  it("ships a bounded Lovable deployment handoff instead of delegating product development", () => {
    const handoff = read("LOVABLE_HANDOFF.md");
    expect(handoff).toContain("deployment-only handoff");
    expect(handoff).toContain("exact green release tree");
    expect(handoff).toContain("20260902153000_richer_candidate_profile.sql");
    expect(handoff).toContain("VITE_SUPABASE_URL");
    expect(handoff).toContain("BROWSERBASE_API_KEY");
    expect(handoff).toContain("AUTOMATION_ENABLE_SUBMIT=false");
    expect(handoff).toContain("357Network.ws");
    expect(handoff).toContain("What Lovable is NOT being asked to do");
  });
});
