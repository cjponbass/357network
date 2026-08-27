import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260827194500_status_event_tracker_integrity.sql"),
  "utf8",
);

describe("application status event integrity", () => {
  it("requires status-history events to match the application's live tracker state", () => {
    expect(migration).toContain("enforce_status_event_tracker_integrity");
    expect(migration).toMatch(/SELECT\s+a\.status[\s\S]*FROM\s+public\.applications\s+a[\s\S]*a\.id\s*=\s*NEW\.application_id/i);
    expect(migration).toMatch(/NEW\.to_status\s*<>\s*current_status/i);
    expect(migration).toMatch(/NEW\.from_status\s+IS\s+NOT\s+NULL[\s\S]*NEW\.from_status\s*=\s*NEW\.to_status/i);
    expect(migration).toMatch(/BEFORE\s+INSERT\s+ON\s+public\.application_status_events/i);
  });

  it("does not expose the integrity function to authenticated callers", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.enforce_status_event_tracker_integrity() FROM PUBLIC",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.enforce_status_event_tracker_integrity() FROM authenticated",
    );
  });
});
