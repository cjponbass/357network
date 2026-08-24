/**
 * ATS adapter contract.
 */

import type { AtsFormField, AtsProvider, ResolvedField } from "../types";

export interface CandidateContext {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  resumeDocument: {
    id: string;
    fileName: string;
    mimeType: string | null;
    sizeBytes: number | null;
  } | null;
  coverLetterText: string | null;
  savedAnswers: Array<{ question: string; answer: string }>;
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
