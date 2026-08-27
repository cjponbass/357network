import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDir = resolve(process.cwd(), "supabase/migrations");
const migrationFiles = readdirSync(migrationDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

function expressesVerifiedTrue(sql: string) {
  return /verified\s+(?:is\s+true|=\s*true)|if\s+(?:old\.)?verified\b/i.test(sql);
}

describe("Supabase migration integrity", () => {
  it("uses unique, sortable timestamp prefixes", () => {
    const timestamps = migrationFiles.map((file) => file.match(/^(\d{14})_/)?.[1] ?? null);

    expect(timestamps.every(Boolean)).toBe(true);
    expect(new Set(timestamps).size).toBe(timestamps.length);
    expect(migrationFiles).toEqual([...migrationFiles].sort());
  });

  it("keeps receipt integrity migrations in dependency order", () => {
    const requiredOrder = [
      "20260827030000_verified_receipt_tracker_sync.sql",
      "20260827043000_verified_receipt_immutability.sql",
      "20260827050000_verified_receipt_delete_guard.sql",
      "20260827054500_submission_success_receipt_guard.sql",
      "20260827090000_verified_receipts_only.sql",
      "20260827100000_backfill_verified_receipt_tracker.sql",
    ];

    for (const file of requiredOrder) {
      expect(migrationFiles).toContain(file);
    }

    const positions = requiredOrder.map((file) => migrationFiles.indexOf(file));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("preserves the core verified-receipt safety invariants", () => {
    const verifiedOnly = readFileSync(
      resolve(migrationDir, "20260827090000_verified_receipts_only.sql"),
      "utf8",
    );
    const successGuard = readFileSync(
      resolve(migrationDir, "20260827054500_submission_success_receipt_guard.sql"),
      "utf8",
    );
    const deleteGuard = readFileSync(
      resolve(migrationDir, "20260827050000_verified_receipt_delete_guard.sql"),
      "utf8",
    );

    expect(expressesVerifiedTrue(verifiedOnly)).toBe(true);
    expect(successGuard).toContain("state = 'succeeded'");
    expect(expressesVerifiedTrue(successGuard)).toBe(true);
    expect(expressesVerifiedTrue(deleteGuard)).toBe(true);
  });

  it("keeps saved jobs private to their owning user", () => {
    const savedJobPrivacy = readFileSync(
      resolve(migrationDir, "20260827134700_private_saved_jobs.sql"),
      "utf8",
    );

    expect(savedJobPrivacy).toContain('DROP POLICY IF EXISTS "jobs readable by authenticated"');
    expect(savedJobPrivacy).toContain('CREATE POLICY "jobs select own"');
    expect(savedJobPrivacy).toMatch(/FOR\s+SELECT[\s\S]*TO\s+authenticated[\s\S]*auth\.uid\(\)\s*=\s*created_by/i);
    expect(savedJobPrivacy).not.toMatch(/USING\s*\(\s*true\s*\)/i);
  });

  it("prevents applications from referencing another user's saved job", () => {
    const applicationJobOwnership = readFileSync(
      resolve(migrationDir, "20260827145000_application_job_ownership.sql"),
      "utf8",
    );

    expect(applicationJobOwnership).toContain("enforce_application_job_owner");
    expect(applicationJobOwnership).toMatch(/j\.created_by\s*<>\s*a\.user_id/i);
    expect(applicationJobOwnership).toMatch(/job_owner\s*<>\s*NEW\.user_id/i);
    expect(applicationJobOwnership).toMatch(/BEFORE\s+INSERT\s+OR\s+UPDATE\s+OF\s+job_id,\s*user_id/i);
  });
});
