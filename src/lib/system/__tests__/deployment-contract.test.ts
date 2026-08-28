import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readRepoFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("production deployment contract", () => {
  it("keeps the verified Node and pnpm runtime pinned", () => {
    const pkg = JSON.parse(readRepoFile("package.json")) as {
      packageManager?: string;
      engines?: { node?: string };
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(pkg.packageManager).toBe("pnpm@10.15.0");
    expect(pkg.engines?.node).toBe(">=22");

    const declaredVersions = [
      ...Object.values(pkg.dependencies ?? {}),
      ...Object.values(pkg.devDependencies ?? {}),
    ];

    expect(declaredVersions.length).toBeGreaterThan(0);
    for (const version of declaredVersions) {
      expect(version).not.toMatch(/^[~^]/);
    }
  });

  it("keeps Netlify on the same pnpm runtime contract", () => {
    const netlify = readRepoFile("netlify.toml");

    expect(netlify).toContain('command = "pnpm run build"');
    expect(netlify).toContain('NODE_VERSION = "22"');
    expect(netlify).not.toContain('command = "bun run build"');
  });

  it("preserves the approved 357 Network header asset and exact tagline", () => {
    expect(existsSync(resolve(root, "public/357-network-header.jpg"))).toBe(true);

    const brand = readRepoFile("src/lib/brand.ts");
    expect(brand).toContain("Where Opportunity Knocks for You. Automatically.");
    expect(brand).toContain("/357-network-header.jpg");
  });
});
