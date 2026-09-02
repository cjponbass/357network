/**
 * Greenhouse adapter — common fields plus authoritative live-form mapping.
 */

import type { AtsFormField, ResolvedField } from "../types";
import { structuredProfileValue } from "./contract";
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
    fill: { type: "private_file", documentId: document.id, fileName: document.fileName, mimeType: document.mimeType, sizeBytes: document.sizeBytes },
    source: "document",
  };
}

export const greenhouseAdapter: AtsAdapter = {
  provider: "greenhouse",
  displayName: "Greenhouse",
  implemented: true,

  inspectForm(targetUrl: string): AdapterInspectResult {
    const notes = ["Field list is Greenhouse's common application form. Employer-specific questions are discovered from the live form."];
    if (!/greenhouse|grnh/.test(targetUrl)) notes.push("URL does not look like a Greenhouse board; treat the static list as indicative.");
    return { fields: GREENHOUSE_FIELDS, notes };
  },

  mapFacts(fields: AtsFormField[], candidate: CandidateContext): ResolvedField[] {
    const { first, last } = splitName(candidate.fullName);
    const fromText = (field: AtsFormField, value: string | null, source: Exclude<ResolvedField["source"], "unresolved">): ResolvedField =>
      value && value.trim() !== "" ? { ...field, value, fill: { type: "text", text: value }, source } : { ...field, value: null, fill: null, source: "unresolved" };

    return fields.map((field): ResolvedField => {
      if (field.sensitive) return fromText(field, matchSavedAnswer(field.label, candidate), "saved_answer");
      switch (field.key) {
        case "first_name": return fromText(field, first, "profile");
        case "last_name": return fromText(field, last, "profile");
        case "full_name":
        case "name": return fromText(field, candidate.fullName, "profile");
        case "email": return fromText(field, candidate.email, "profile");
        case "phone": return fromText(field, candidate.phone, "profile");
        case "location": return fromText(field, candidate.location, "profile");
        case "resume": return fromDocument(field, candidate.resumeDocument);
        case "cover_letter": {
          if (field.kind === "file") return fromDocument(field, candidate.coverLetterDocument);
          const letter = candidate.coverLetterText?.trim() ?? "";
          return letter ? { ...field, value: `Prepared cover letter (${letter.length} characters)`, fill: { type: "text", text: letter }, source: "materials" } : { ...field, value: null, fill: null, source: "unresolved" };
        }
        case "linkedin": return fromText(field, candidate.linkedinUrl, "profile");
        case "website":
        case "portfolio": return fromText(field, candidate.websiteUrl ?? candidate.githubUrl, "profile");
        default: {
          if (field.kind === "file") return { ...field, value: null, fill: null, source: "unresolved" };
          const profileValue = structuredProfileValue(field.key, candidate);
          if (profileValue) return fromText(field, profileValue, "profile");
          return fromText(field, matchSavedAnswer(field.label, candidate), "saved_answer");
        }
      }
    });
  },
};
