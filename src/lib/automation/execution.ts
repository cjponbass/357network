/**
 * Pure, client-safe execution helpers for the submission state machine.
 * Kept free of I/O so they can be unit tested directly.
 */

import type { ProviderBlocker, ProviderFillInput } from "./provider/contract";
import type {
  AutomationErrorCategory,
  ResolvedField,
  SubmissionState,
  SubmittedAnswer,
} from "./types";

/** Deterministic key so a repeated request reuses the same attempt row. */
export function buildIdempotencyKey(input: {
  applicationId: string;
  targetUrl: string | null;
  requestKey?: string | null | undefined;
}): string {
  if (input.requestKey && input.requestKey.trim() !== "") return input.requestKey.trim();
  return `${input.applicationId}:${input.targetUrl ?? "no-url"}`;
}

/** Blockers map 1:1 onto attempt error categories. */
export function categoryForBlocker(blocker: ProviderBlocker): AutomationErrorCategory {
  return blocker.kind;
}

export function requiresUserInput(fields: ResolvedField[]): ResolvedField[] {
  return fields.filter((f) => f.source === "unresolved" && f.required);
}

export function skippedFields(fields: ResolvedField[]): ResolvedField[] {
  return fields.filter((f) => f.source === "unresolved" && !f.required);
}

export function buildFillInputs(fields: ResolvedField[]): ProviderFillInput[] {
  return fields.flatMap((field) =>
    field.source !== "unresolved" && field.fill
      ? [{ key: field.key, kind: field.kind, value: field.fill }]
      : [],
  );
}

export function buildSubmittedAnswers(fields: ResolvedField[]): SubmittedAnswer[] {
  return fields.flatMap((field): SubmittedAnswer[] => {
    if (field.source === "unresolved" || !field.fill) return [];
    if (field.fill.type === "private_file") {
      return [
        {
          key: field.key,
          label: field.label,
          type: "file",
          fileName: field.fill.fileName,
          mimeType: field.fill.mimeType,
          sizeBytes: field.fill.sizeBytes,
        },
      ];
    }
    if (field.sensitive) {
      return [
        { key: field.key, label: field.label, type: "text", sensitive: true, provided: true },
      ];
    }
    return [{ key: field.key, label: field.label, type: "text", value: field.fill.text }];
  });
}

export function canCreateReceipt(input: {
  verified: boolean;
  confirmationText: string | null;
  confirmationUrl: string | null;
  submitted: boolean;
}): boolean {
  if (!input.submitted || !input.verified) return false;
  const hasEvidence =
    (input.confirmationText?.trim().length ?? 0) > 0 ||
    (input.confirmationUrl?.trim().length ?? 0) > 0;
  return hasEvidence;
}

export interface TerminalOutcome {
  state: SubmissionState;
  errorCategory: AutomationErrorCategory | null;
  message: string | null;
}

export function outcomeForBlockers(blockers: ProviderBlocker[]): TerminalOutcome | null {
  const first = blockers[0];
  if (!first) return null;
  const needsUser =
    first.kind === "captcha_or_bot_check" ||
    first.kind === "authentication_required" ||
    first.kind === "unsupported_widget";
  return {
    state: needsUser ? "needs_user_input" : "failed",
    errorCategory: categoryForBlocker(first),
    message: first.message,
  };
}
