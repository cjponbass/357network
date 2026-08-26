import { describe, expect, it } from "vitest";

import { isSensitiveLabel, normalizeLiveFields } from "../live-fields";

describe("live ATS field normalization", () => {
  it("classifies common sensitive employer questions conservatively", () => {
    const sensitiveLabels = [
      "Will you now or in the future require visa sponsorship?",
      "Are you authorized to work in the United States?",
      "What are your salary expectations?",
      "Please select your veteran status",
      "Do you have a disability?",
      "What is your race or ethnicity?",
      "Have you ever been convicted of a crime?",
      "What is your date of birth?",
    ];

    for (const label of sensitiveLabels) {
      expect(isSensitiveLabel(label), label).toBe(true);
    }
  });

  it("does not mark ordinary application questions as sensitive", () => {
    const ordinaryLabels = [
      "Full name",
      "Email address",
      "LinkedIn profile",
      "Why are you interested in this role?",
      "Upload your resume",
    ];

    for (const label of ordinaryLabels) {
      expect(isSensitiveLabel(label), label).toBe(false);
    }
  });

  it("preserves explicit sensitivity from the live inspector", () => {
    const [field] = normalizeLiveFields([
      {
        key: "custom_private",
        label: "Additional information",
        required: false,
        sensitive: true,
        kind: "textarea",
      },
    ]);

    expect(field?.sensitive).toBe(true);
    expect(field?.kind).toBe("long_text");
  });

  it("normalizes browser field kinds into the supported ATS contract", () => {
    const normalized = normalizeLiveFields([
      { key: "a", label: "A", required: false, sensitive: false, kind: "textarea" },
      { key: "b", label: "B", required: false, sensitive: false, kind: "select" },
      { key: "c", label: "C", required: false, sensitive: false, kind: "radio" },
      { key: "d", label: "D", required: false, sensitive: false, kind: "checkbox" },
      { key: "e", label: "E", required: false, sensitive: false, kind: "upload" },
      { key: "f", label: "F", required: false, sensitive: false, kind: "attachment" },
      { key: "g", label: "G", required: false, sensitive: false, kind: "tel" },
      { key: "h", label: "H", required: false, sensitive: false, kind: "mystery-widget" },
    ]);

    expect(normalized.map((field) => field.kind)).toEqual([
      "long_text",
      "choice",
      "choice",
      "choice",
      "file",
      "file",
      "phone",
      "text",
    ]);
  });

  it("keeps required state and auto-flags sensitive labels during normalization", () => {
    const [field] = normalizeLiveFields([
      {
        key: "compensation",
        label: "Desired compensation",
        required: true,
        sensitive: false,
        kind: "text",
      },
    ]);

    expect(field).toEqual({
      key: "compensation",
      label: "Desired compensation",
      required: true,
      sensitive: true,
      kind: "text",
    });
  });
});
