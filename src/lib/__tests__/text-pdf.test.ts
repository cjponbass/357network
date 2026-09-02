import { describe, expect, it } from "vitest";
import { buildTextPdf } from "@/lib/documents/text-pdf";

describe("text PDF export", () => {
  it("creates a structurally complete PDF document", () => {
    const bytes = buildTextPdf("Tailored Resume", "Summary\nAudio engineering and production experience.\nSkills: editing, mixing.");
    const text = new TextDecoder().decode(bytes);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("Tailored Resume");
    expect(text).toContain("Audio engineering and production experience.");
    expect(text).toContain("xref");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("creates multiple pages for long material", () => {
    const bytes = buildTextPdf("Cover Letter", Array.from({ length: 120 }, (_, index) => `Line ${index + 1} candidate material`).join("\n"));
    const text = new TextDecoder().decode(bytes);
    expect((text.match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(1);
    expect(text).toContain("Page 1 of");
  });
});
