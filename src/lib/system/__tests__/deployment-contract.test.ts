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

  it("enforces baseline production transport and browser hardening", () => {
    const netlify = readRepoFile("netlify.toml");

    expect(netlify).toContain('Strict-Transport-Security = "max-age=31536000"');
    expect(netlify).toContain('X-Content-Type-Options = "nosniff"');
    expect(netlify).toContain('X-Frame-Options = "DENY"');
    expect(netlify).toContain('X-Permitted-Cross-Domain-Policies = "none"');
    expect(netlify).toContain('Cross-Origin-Opener-Policy = "same-origin"');
  });

  it("prevents caching of authenticated candidate workflow pages", () => {
    const netlify = readRepoFile("netlify.toml");
    const privateRoutes = [
      "/dashboard",
      "/applications/*",
      "/profile",
      "/settings",
      "/documents",
      "/answers",
      "/prepare",
    ];

    for (const route of privateRoutes) {
      expect(netlify).toContain(`for = "${route}"`);
    }
    expect(netlify.match(/Cache-Control = "private, no-store, max-age=0"/g)?.length).toBe(
      privateRoutes.length,
    );
  });

  it("preserves the approved 357 Network header asset and exact tagline", () => {
    expect(existsSync(resolve(root, "public/357-network-header.jpg"))).toBe(true);

    const brand = readRepoFile("src/lib/brand.ts");
    expect(brand).toContain("Where Opportunity Knocks for You. Automatically.");
    expect(brand).toContain("/357-network-header.jpg");
  });

  it("checks critical production columns instead of table existence alone", () => {
    const status = readRepoFile("src/lib/system/status.functions.ts");

    expect(status).toContain('select("id,user_id,job_id,status,submitted_at"');
    expect(status).toContain('select("id,user_id,application_id,idempotency_key,state,receipt_id"');
    expect(status).toContain('select("id,application_id,from_status,to_status"');
    expect(status).toContain('select("id,application_id,application_url,verified,submitted_at"');
  });
});
