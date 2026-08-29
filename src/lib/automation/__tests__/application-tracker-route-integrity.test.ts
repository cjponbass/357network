import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const applicationsRoute = readFileSync(
  resolve(process.cwd(), "src/routes/applications.tsx"),
  "utf8",
);

describe("application tracker route integrity", () => {
  it("records an initial draft history event when tracking is created", () => {
    expect(applicationsRoute).toMatch(
      /\.from\("applications"\)[\s\S]*\.insert\(\{[\s\S]*status:\s*"draft"[\s\S]*\.select\("id"\)[\s\S]*\.single\(\)/,
    );
    expect(applicationsRoute).toMatch(
      /\.from\("application_status_events"\)\.insert\(\{[\s\S]*application_id:\s*createdApplication\.id[\s\S]*from_status:\s*null[\s\S]*to_status:\s*"draft"[\s\S]*note:\s*"Application tracking created"/,
    );
  });

  it("rolls back a newly created application if its initial history event fails", () => {
    expect(applicationsRoute).toMatch(
      /if \(eventError\)[\s\S]*\.from\("applications"\)[\s\S]*\.delete\(\)[\s\S]*\.eq\("id", createdApplication\.id\)[\s\S]*\.eq\("user_id", user\.id\)/,
    );
    expect(applicationsRoute).toContain("the incomplete application could not be rolled back");
  });

  it("keeps submitted_at aligned with the selected tracker status", () => {
    expect(applicationsRoute).toMatch(
      /submitted_at:\s*status\s*===\s*"submitted"\s*\?\s*new Date\(\)\.toISOString\(\)\s*:\s*null/,
    );
  });

  it("records list-view status transitions in application history", () => {
    expect(applicationsRoute).toMatch(
      /application_id:\s*id[\s\S]*from_status:\s*currentApplication\.status[\s\S]*to_status:\s*status[\s\S]*note:\s*"Updated from applications list"/,
    );
  });
});
