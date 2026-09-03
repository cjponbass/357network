import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260903141500_billing_mason_employer.sql"),
  "utf8",
);

const searchFunction = migration.slice(
  migration.indexOf("create or replace function public.search_discoverable_candidates"),
  migration.indexOf("commit;"),
);

describe("Mason employer-discovery privacy contract", () => {
  it("keeps employer discoverability opt-in by default", () => {
    expect(migration).toContain("employer_discoverable boolean not null default false");
    expect(migration).toContain("is_mason boolean not null default false");
  });

  it("requires discoverability before an employer can find a candidate", () => {
    expect(searchFunction).toContain("c.employer_discoverable = true");
  });

  it("supports a Masons-only employer filter", () => {
    expect(searchFunction).toContain("not masons_only or c.is_mason = true");
  });

  it("requires the caller to have an employer profile", () => {
    expect(searchFunction).toContain("exists (select 1 from public.employer_profiles e where e.user_id = auth.uid())");
  });

  it("does not expose private candidate fields through employer search", () => {
    for (const privateField of [
      "address_line1",
      "address_line2",
      "postal_code",
      "phone",
      "email",
      "work_authorization",
      "linkedin_url",
      "github_url",
      "website_url",
    ]) {
      expect(searchFunction).not.toContain(privateField);
    }
  });

  it("requires target candidate discoverability for employer interest requests", () => {
    expect(migration).toContain("c.user_id = candidate_user_id and c.employer_discoverable = true");
  });

  it("does not permit browser clients to write subscription state", () => {
    expect(migration).toContain("revoke insert, update, delete on public.subscriptions from authenticated, anon");
  });
});
