import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const orchestrator = readFileSync(
  resolve(process.cwd(), "src/lib/automation/orchestrator.server.ts"),
  "utf8",
);

describe("submission retry safety", () => {
  it("blocks automatic retries after verification becomes uncertain", () => {
    expect(orchestrator).toContain('priorAttempt.error_category === "verification_failed"');
    expect(orchestrator).toContain(
      "Automatic retry is blocked to prevent a duplicate application.",
    );
  });

  it("classifies verified employer submission with failed receipt storage as verification_failed", () => {
    expect(orchestrator).toMatch(
      /receiptError \|\| !receipt[\s\S]*return finish\([\s\S]*"failed",[\s\S]*"verification_failed",[\s\S]*receipt storage failed/i,
    );
  });
});
