import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const orchestrator = readFileSync(
  resolve(process.cwd(), "src/lib/automation/orchestrator.server.ts"),
  "utf8",
);

describe("live submission gating", () => {
  it("does not block a real submission on generic static ATS template fields", () => {
    expect(orchestrator).not.toContain("const staticMapped =");
    expect(orchestrator).not.toContain("const staticStop =");
  });

  it("inspects the live form before requiring actual missing fields", () => {
    const inspectIndex = orchestrator.indexOf("const inspection = await provider.inspect(session)");
    const liveMapIndex = orchestrator.indexOf("const liveMapped = adapter.mapFacts(normalizeLiveFields(inspection.fields), candidate)");
    const liveStopIndex = orchestrator.indexOf("const liveStop = await stopOnUnresolved(liveMapped)");

    expect(inspectIndex).toBeGreaterThan(-1);
    expect(liveMapIndex).toBeGreaterThan(inspectIndex);
    expect(liveStopIndex).toBeGreaterThan(liveMapIndex);
  });

  it("keeps static templates limited to readiness guidance", () => {
    expect(orchestrator).toContain("const inspection = adapter.inspectForm(targetUrl ?? \"\")");
    expect(orchestrator).toContain("Static readiness only. A real run re-inspects every live form step");
  });

  it("bounds and advances multi-step application forms", () => {
    expect(orchestrator).toContain("const MAX_FORM_STEPS = 12");
    expect(orchestrator).toContain("for (let step = 1; step <= MAX_FORM_STEPS; step += 1)");
    expect(orchestrator).toContain("await provider.advance(session)");
  });
});
