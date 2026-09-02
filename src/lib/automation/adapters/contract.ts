/**
 * ATS adapter contract.
 */

import type { AtsFormField, AtsProvider, ResolvedField } from "../types";

export interface CandidateDocumentFact {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
}

export interface CandidateContext {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  resumeDocument: CandidateDocumentFact | null;
  /** Selected application cover-letter file. Optional for backward-compatible adapter tests/callers. */
  coverLetterDocument?: CandidateDocumentFact | null;
  coverLetterText: string | null;
  savedAnswers: Array<{ question: string; answer: string }>;
}

/** Canonical live-form keys that can be answered directly from candidate-owned profile facts. */
export function structuredProfileValue(key: string, candidate: CandidateContext): string | null {
  switch (key) {
    case "address_line1":
    case "street_address":
    case "address":
      return candidate.addressLine1 ?? null;
    case "address_line2":
    case "address2":
      return candidate.addressLine2 ?? null;
    case "city":
      return candidate.city ?? null;
    case "state":
    case "province":
    case "region":
      return candidate.region ?? null;
    case "postal_code":
    case "zip_code":
    case "zip":
      return candidate.postalCode ?? null;
    case "country":
      return candidate.country ?? null;
    default:
      return null;
  }
}

export interface AdapterInspectResult {
  fields: AtsFormField[];
  notes: string[];
}

export interface AtsAdapter {
  provider: AtsProvider;
  displayName: string;
  implemented: boolean;
  inspectForm(targetUrl: string): AdapterInspectResult;
  mapFacts(fields: AtsFormField[], candidate: CandidateContext): ResolvedField[];
}
