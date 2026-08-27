import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDir = resolve(process.cwd(), "supabase/migrations");
const migrationFiles = readdirSync(migrationDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

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

    expect(verifiedOnly).toContain("verified IS TRUE");
    expect(successGuard).toContain("state = 'succeeded'");
    expect(successGuard).toContain("verified IS TRUE");
    expect(deleteGuard).toContain("verified IS TRUE");
  });
});
