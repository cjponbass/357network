import { describe, expect, it, vi } from "vitest";
import { fillNativeField, type PageLike } from "../provider/browserbase.server";

function page(overrides: Partial<PageLike> = {}): PageLike {
  const evaluate: PageLike["evaluate"] = async <T = unknown>() => undefined as T;
  return {
    goto: vi.fn(async () => undefined),
    evaluate,
    fill: vi.fn(async () => undefined),
    setInputFiles: vi.fn(async () => undefined),
    click: vi.fn(async () => undefined),
    screenshot: vi.fn(async () => new Uint8Array()),
    url: vi.fn(() => "https://boards.greenhouse.io/example"),
    ...overrides,
  };
}

describe("Browserbase native ATS controls", () => {
  it("fills ordinary text inputs", async () => {
    const p = page();
    await fillNativeField(p, { selector: "#email", kind: "email" }, "candidate@example.com");
    expect(p.fill).toHaveBeenCalledWith("#email", "candidate@example.com");
  });

  it("selects native select options by visible label", async () => {
    const selectOption = vi.fn(async () => undefined);
    const p = page({ selectOption });
    await fillNativeField(p, { selector: "#country", kind: "select" }, "United States");
    expect(selectOption).toHaveBeenCalledWith("#country", { label: "United States" });
  });

  it("checks and unchecks only for explicit boolean answers", async () => {
    const check = vi.fn(async () => undefined);
    const uncheck = vi.fn(async () => undefined);
    const p = page({ check, uncheck });
    await fillNativeField(p, { selector: "#consent", kind: "checkbox" }, "yes");
    await fillNativeField(p, { selector: "#relocate", kind: "checkbox" }, "no");
    expect(check).toHaveBeenCalledWith("#consent");
    expect(uncheck).toHaveBeenCalledWith("#relocate");
  });

  it("refuses to guess radio-button answers", async () => {
    const p = page();
    await expect(fillNativeField(p, { selector: "input[name=choice]", kind: "radio" }, "Maybe")).rejects.toThrow(/not guessed/i);
  });
});
