import { describe, expect, it } from "vitest";

import type { CandidateContext } from "../adapters/contract";
import { getAdapter } from "../adapters/registry";
import { leverAdapter } from "../adapters/lever";
import { buildFillInputs, buildSubmittedAnswers, requiresUserInput } from "../execution";

const candidate: CandidateContext = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+15551234567",
  location: "London",
  linkedinUrl: "https://linkedin.com/in/ada",
  githubUrl: "https://github.com/ada",
  websiteUrl: null,
  resumeDocument: {
    id: "doc-1",
    fileName: "ada-resume.pdf",
    mimeType: "application/pdf",
    sizeBytes: 12345,
  },
  coverLetterText: "Dear team, I would love to build analytical engines with you.",
  savedAnswers: [],
};

describe("Lever ATS adapter", () => {
  it("is registered as an implemented provider", () => {
    expect(getAdapter("lever")).toBe(leverAdapter);
    expect(leverAdapter.implemented).toBe(true);
  });

  it("maps standard profile, document, and material fields", () => {
    const fields = leverAdapter.inspectForm("https://jobs.lever.co/acme/123").fields;
    const mapped = leverAdapter.mapFacts(fields, candidate);
    const inputs = buildFillInputs(mapped);

    expect(mapped.find((field) => field.key === "full_name")?.value).toBe("Ada Lovelace");
    expect(mapped.find((field) => field.key === "location")?.value).toBe("London");
    expect(inputs.find((input) => input.key === "resume")?.value).toEqual({
      type: "private_file",
      documentId: "doc-1",
      fileName: "ada-resume.pdf",
      mimeType: "application/pdf",
      sizeBytes: 12345,
    });
    expect(inputs.find((input) => input.key === "cover_letter")?.value).toEqual({
      type: "text",
      text: candidate.coverLetterText,
    });
  });

  it("does not guess sensitive answers and redacts saved sensitive text from receipt evidence", () => {
    const fields = leverAdapter.inspectForm("https://jobs.lever.co/acme/123").fields;
    const unresolved = leverAdapter.mapFacts(fields, candidate);
    expect(unresolved.filter((field) => field.sensitive).every((field) => field.value === null)).toBe(true);

    const mapped = leverAdapter.mapFacts(fields, {
      ...candidate,
      savedAnswers: [
        { question: "What are your compensation expectations?", answer: "$150,000" },
      ],
    });
    const compensation = mapped.find((field) => field.key === "compensation");
    expect(compensation?.source).toBe("saved_answer");

    const serializedReceipt = JSON.stringify(buildSubmittedAnswers(mapped));
    expect(serializedReceipt).not.toContain("$150,000");
  });

  it("blocks on required employer-specific questions discovered from the live form", () => {
    const liveFields = [
      { key: "full_name", label: "Full name", required: true, sensitive: false, kind: "text" as const },
      { key: "email", label: "Email", required: true, sensitive: false, kind: "email" as const },
      { key: "resume", label: "Resume", required: true, sensitive: false, kind: "file" as const },
      {
        key: "custom_why",
        label: "Why are you interested in this role?",
        required: true,
        sensitive: false,
        kind: "long_text" as const,
      },
    ];

    const mapped = leverAdapter.mapFacts(liveFields, candidate);
    expect(requiresUserInput(mapped).map((field) => field.key)).toContain("custom_why");
  });
});
