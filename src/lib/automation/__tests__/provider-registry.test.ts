import { describe, expect, it } from "vitest";

import { getAdapter } from "../adapters/registry";
import { IMPLEMENTED_PROVIDERS } from "../types";

describe("ATS provider registry", () => {
  it("keeps every advertised implemented provider backed by an implemented adapter", () => {
    for (const provider of IMPLEMENTED_PROVIDERS) {
      const adapter = getAdapter(provider);
      expect(adapter, `${provider} should be registered`).not.toBeNull();
      expect(adapter?.provider).toBe(provider);
      expect(adapter?.implemented).toBe(true);
    }
  });

  it("does not provide an adapter for unknown targets", () => {
    expect(getAdapter("unknown")).toBeNull();
  });
});
