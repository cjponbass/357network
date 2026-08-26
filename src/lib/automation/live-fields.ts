/** Normalize live ATS fields while conservatively classifying sensitive questions. */

import type { AtsFormField } from "./types";

const KINDS: AtsFormField["kind"][] = [
  "text",
  "email",
  "phone",
  "url",
  "file",
  "long_text",
  "choice",
];

const SENSITIVE_PATTERNS: RegExp[] = [
  /sponsor/i,
  /work\s*authoriz|work\s*authoris|authoriz(?:ed|ation)?\s+to\s+work|authoris(?:ed|ation)?\s+to\s+work/i,
  /visa/i,
  /right to work/i,
  /citizen|nationality/i,
  /veteran/i,
  /disabilit/i,
  /gender|race|ethnic|eeoc|diversity/i,
  /salary|compensation|pay expectation|desired pay/i,
  /criminal|conviction|background check/i,
  /age\b|date of birth/i,
];

export function isSensitiveLabel(label: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(label));
}

function normalizeKind(kind: string): AtsFormField["kind"] {
  const lowered = kind.toLowerCase();
  if ((KINDS as string[]).includes(lowered)) return lowered as AtsFormField["kind"];
  switch (lowered) {
    case "textarea":
      return "long_text";
    case "select":
    case "radio":
    case "checkbox":
    case "dropdown":
      return "choice";
    case "upload":
    case "attachment":
      return "file";
    case "tel":
      return "phone";
    default:
      return "text";
  }
}

export interface LiveInspectedField {
  key: string;
  label: string;
  required: boolean;
  sensitive: boolean;
  kind: string;
}

export function normalizeLiveFields(fields: LiveInspectedField[]): AtsFormField[] {
  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    required: field.required,
    sensitive: field.sensitive || isSensitiveLabel(field.label),
    kind: normalizeKind(field.kind),
  }));
}
