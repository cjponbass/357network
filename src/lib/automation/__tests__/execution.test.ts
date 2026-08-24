import { describe, expect, it } from "vitest";

import { detectAts } from "../ats-detect";
import { greenhouseAdapter } from "../adapters/greenhouse";
import type { CandidateContext } from "../adapters/contract";
import {
  buildFillInputs,
  buildIdempotencyKey,
  buildSubmittedAnswers,
  canCreateReceipt,
  outcomeForBlockers,
  requiresUserInput,
  skippedFields,
} from "../execution";
import { normalizeLiveFields } from "../live-fields";

const candidate: CandidateContext = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+15551234567",
  location: "London",
  linkedinUrl: "https://linkedin.com/in/ada",
  githubUrl: null,
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

const staticFields = greenhouseAdapter.inspectForm(
  "https://boards.greenhouse.io/acme/jobs/1",
).fields;
const mapped = greenhouseAdapter.mapFacts(staticFields, candidate);

describe("ats detection", () => {
  it("detects greenhouse and unknown hosts", () => {
    expect(detectAts("https://boards.greenhouse.io/acme/jobs/1").provider).toBe("greenhouse");
    expect(detectAts("https://careers.example.com/job/1").provider).toBe("unknown");
    expect(detectAts(null).provider).toBe("unknown");
  });
});

describe("sensitive fields", () => {
  it("never guesses a sensitive answer", () => {
    for (const field of mapped.filter((f) => f.sensitive)) {
      expect(field.value).toBeNull();
      expect(field.fill).toBeNull();
      expect(field.source).toBe("unresolved");
    }
  });

  it("blocks on an unresolved REQUIRED sensitive field", () => {
    expect(requiresUserInput(mapped).map((f) => f.key)).toContain("work_authorization");
  });

  it("does not block on unresolved OPTIONAL sensitive fields", () => {
    const blocking = requiresUserInput(mapped).map((f) => f.key);
    expect(blocking).not.toContain("compensation");
    expect(blocking).not.toContain("demographic_questions");
    expect(skippedFields(mapped).map((f) => f.key)).toEqual(
      expect.arrayContaining(["compensation", "demographic_questions"]),
    );
  });

  it("reuses an explicit saved answer for a sensitive question", () => {
    const withAnswer = greenhouseAdapter.mapFacts(staticFields, {
      ...candidate,
      savedAnswers: [
        { question: "Do you require work authorisation sponsorship?", answer: "No sponsorship" },
      ],
    });
    const field = withAnswer.find((f) => f.key === "work_authorization");
    expect(field?.source).toBe("saved_answer");
    expect(requiresUserInput(withAnswer)).toHaveLength(0);
  });
});

describe("fill values and receipt safety", () => {
  const resolvedWithAuth = greenhouseAdapter.mapFacts(staticFields, {
    ...candidate,
    savedAnswers: [
      { question: "Do you require work authorisation sponsorship?", answer: "No sponsorship" },
    ],
  });
  const inputs = buildFillInputs(resolvedWithAuth);

  it("passes actual cover-letter text and a typed private resume reference", () => {
    expect(inputs.find((i) => i.key === "cover_letter")?.value).toEqual({
      type: "text",
      text: candidate.coverLetterText,
    });
    expect(inputs.find((i) => i.key === "resume")?.value).toEqual({
      type: "private_file",
      documentId: "doc-1",
      fileName: "ada-resume.pdf",
      mimeType: "application/pdf",
      sizeBytes: 12345,
    });
  });

  it("omits unresolved optional fields entirely", () => {
    expect(inputs.map((i) => i.key)).not.toContain("compensation");
  });

  it("keeps internal ids and sensitive text out of receipt evidence", () => {
    const answers = buildSubmittedAnswers(resolvedWithAuth);
    const serialized = JSON.stringify(answers);
    expect(serialized).not.toContain("doc-1");
    expect(serialized).not.toContain("No sponsorship");
    expect(answers).toContainEqual({
      key: "resume",
      label: "Resume file",
      type: "file",
      fileName: "ada-resume.pdf",
      mimeType: "application/pdf",
      sizeBytes: 12345,
    });
    expect(answers).toContainEqual({
      key: "work_authorization",
      label: "Work authorisation / sponsorship",
      type: "text",
      sensitive: true,
      provided: true,
    });
  });
});

describe("live inspected fields", () => {
  const live = normalizeLiveFields([
    { key: "first_name", label: "First name", required: true, sensitive: false, kind: "text" },
    { key: "last_name", label: "Last name", required: true, sensitive: false, kind: "text" },
    { key: "email", label: "Email", required: true, sensitive: false, kind: "email" },
    { key: "phone", label: "Phone", required: true, sensitive: false, kind: "tel" },
    { key: "resume", label: "Resume file", required: true, sensitive: false, kind: "upload" },
    {
      key: "custom_1",
      label: "Why do you want to work at Acme?",
      required: true,
      sensitive: false,
      kind: "textarea",
    },
  ]);

  it("normalizes provider kinds and blocks on a required employer-specific question", () => {
    expect(live.find((f) => f.key === "phone")?.kind).toBe("phone");
    expect(live.find((f) => f.key === "resume")?.kind).toBe("file");
    expect(live.find((f) => f.key === "custom_1")?.kind).toBe("long_text");
    expect(requiresUserInput(greenhouseAdapter.mapFacts(live, candidate)).map((f) => f.key)).toEqual([
      "custom_1",
    ]);
  });

  it("marks protected topics sensitive even when provider metadata does not", () => {
    const [field] = normalizeLiveFields([
      {
        key: "q1",
        label: "What are your salary expectations?",
        required: false,
        sensitive: false,
        kind: "text",
      },
    ]);
    expect(field?.sensitive).toBe(true);
  });
});

describe("idempotency and receipt gating", () => {
  it("uses stable keys and honours explicit request keys", () => {
    expect(buildIdempotencyKey({ applicationId: "app", targetUrl: "https://x" })).toBe(
      buildIdempotencyKey({ applicationId: "app", targetUrl: "https://x" }),
    );
    expect(buildIdempotencyKey({ applicationId: "app", targetUrl: null, requestKey: " k1 " })).toBe(
      "k1",
    );
  });

  it("requires submitted + verified + concrete evidence", () => {
    expect(
      canCreateReceipt({
        submitted: true,
        verified: true,
        confirmationText: "Thanks for applying",
        confirmationUrl: null,
      }),
    ).toBe(true);
    expect(
      canCreateReceipt({ submitted: true, verified: true, confirmationText: "", confirmationUrl: null }),
    ).toBe(false);
    expect(
      canCreateReceipt({ submitted: true, verified: false, confirmationText: "Thanks", confirmationUrl: null }),
    ).toBe(false);
    expect(
      canCreateReceipt({ submitted: false, verified: true, confirmationText: "Thanks", confirmationUrl: "https://x" }),
    ).toBe(false);
  });
});

describe("blocker mapping", () => {
  it("routes human-intervention blockers separately from hard failures", () => {
    expect(outcomeForBlockers([{ kind: "captcha_or_bot_check", message: "captcha" }])?.state).toBe(
      "needs_user_input",
    );
    expect(outcomeForBlockers([{ kind: "authentication_required", message: "login" }])?.state).toBe(
      "needs_user_input",
    );
    expect(outcomeForBlockers([{ kind: "file_upload_failed", message: "upload" }])?.state).toBe(
      "failed",
    );
    expect(outcomeForBlockers([])).toBeNull();
  });
});
