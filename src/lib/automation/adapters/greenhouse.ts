/**
 * Greenhouse adapter — first implemented ATS slice.
 */

import type { AtsFormField, ResolvedField } from "../types";
import type { AdapterInspectResult, AtsAdapter, CandidateContext, CandidateDocumentFact } from "./contract";

const GREENHOUSE_FIELDS: AtsFormField[] = [
  { key: "first_name", label: "First name", required: true, sensitive: false, kind: "text" },
  { key: "last_name", label: "Last name", required: true, sensitive: false, kind: "text" },
  { key: "email", label: "Email", required: true, sensitive: false, kind: "email" },
  { key: "phone", label: "Phone", required: true, sensitive: false, kind: "phone" },
  { key: "resume", label: "Resume file", required: true, sensitive: false, kind: "file" },
  { key: "cover_letter", label: "Cover letter", required: false, sensitive: false, kind: "long_text" },
  { key: "linkedin", label: "LinkedIn profile", required: false, sensitive: false, kind: "url" },
  { key: "website", label: "Website / portfolio", required: false, sensitive: false, kind: "url" },
  { key: "work_authorization", label: "Work authorisation / sponsorship", required: true, sensitive: true, kind: "choice" },
  { key: "compensation", label: "Compensation expectations", required: false, sensitive: true, kind: "text" },
  { key: "demographic_questions", label: "Voluntary demographic questions (EEOC)", required: false, sensitive: true, kind: "choice" },
];

function splitName(fullName: string | null): { first: string | null; last: string | null } {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: null, last: null };
  if (parts.length === 1) return { first: parts[0]!, last: null };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}

function matchSavedAnswer(label: string, candidate: CandidateContext): string | null {
  const needle = label.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
  if (needle.length === 0) return null;
  const hit = candidate.savedAnswers.find((a) => {
    const q = a.question.toLowerCase();
    return needle.every((w) => q.includes(w)) && a.answer.trim() !== "";
  });
  return hit ? hit.answer : null;
}

function fromDocument(field: AtsFormField, document: CandidateDocumentFact | null | undefined): ResolvedField {
  if (!document) return { ...field, value: null, fill: null, source: "unresolved" };
  return {
    ...field,
    value: document.fileName,
    fill: {
      type: "private_file",
      documentId: document.id,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
    },
    source: "document",
  };
}

export const greenhouseAdapter: AtsAdapter = {
  provider: "greenhouse",
  displayName: "Greenhouse",
  implemented: true,

  inspectForm(targetUrl: string): AdapterInspectResult {
    const notes = [
      "Field list is Greenhouse's standard application form. Employer-specific custom questions can only be read by opening the live form, which requires a browser-automation provider.",
    ];
    if (!/greenhouse|grnh/.test(targetUrl)) {
      notes.push("URL does not look like a Greenhouse board; treat the field list as indicative.");
    }
    return { fields: GREENHOUSE_FIELDS, notes };
  },

  mapFacts(fields: AtsFormField[], candidate: CandidateContext): ResolvedField[] {
    const { first, last } = splitName(candidate.fullName);
    const fromText = (
      field: AtsFormField,
      value: string | null,
      source: Exclude<ResolvedField["source"], "unresolved">,
    ): ResolvedField =>
      value && value.trim() !== ""
        ? { ...field, value, fill: { type: "text", text: value }, source }
        : { ...field, value: null, fill: null, source: "unresolved" };

    return fields.map((field): ResolvedField => {
      if (field.sensitive) {
        return fromText(field, matchSavedAnswer(field.label, candidate), "saved_answer");
      }
      switch (field.key) {
        case "first_name":
          return fromText(field, first, "profile");
        case "last_name":
          return fromText(field, last, "profile");
        case "email":
          return fromText(field, candidate.email, "profile");
        case "phone":
          return fromText(field, candidate.phone, "profile");
        case "resume":
          return fromDocument(field, candidate.resumeDocument);
        case "cover_letter": {
          if (field.kind === "file") return fromDocument(field, candidate.coverLetterDocument);
          const letter = candidate.coverLetterText?.trim() ?? "";
          if (letter === "") return { ...field, value: null, fill: null, source: "unresolved" };
          return {
            ...field,
            value: `Prepared cover letter (${letter.length} characters)`,
            fill: { type: "text", text: letter },
            source: "materials",
          };
        }
        case "linkedin":
          return fromText(field, candidate.linkedinUrl, "profile");
        case "website":
          return fromText(field, candidate.websiteUrl ?? candidate.githubUrl, "profile");
        default: {
          if (field.kind === "file") {
            return { ...field, value: null, fill: null, source: "unresolved" };
          }
          return fromText(field, matchSavedAnswer(field.label, candidate), "saved_answer");
        }
      }
    });
  },
};
