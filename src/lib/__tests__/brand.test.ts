import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { BRAND } from "../brand";

describe("357 Network brand invariants", () => {
  it("preserves the approved product identity and exact tagline", () => {
    expect(BRAND.name).toBe("357 Network");
    expect(BRAND.domain).toBe("357Network.ws");
    expect(BRAND.tagline).toBe("Where Opportunity Knocks for You. Automatically.");
  });

  it("keeps the approved panoramic header asset wired to the canonical path", () => {
    expect(BRAND.headerImagePath).toBe("/357-network-header.jpg");
    expect(existsSync(resolve(process.cwd(), "public/357-network-header.jpg"))).toBe(true);
  });
});
