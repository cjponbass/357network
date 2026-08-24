/**
 * Browser-automation provider contract (client-safe types only).
 *
 * Hard rules for any implementation:
 *  - never solve, bypass or evade CAPTCHA / bot checks / login walls;
 *  - never invent an answer for a question the orchestrator did not resolve;
 *  - verify() may only report success from concrete on-page evidence.
 */

export type ProviderBlockerKind =
  | "captcha_or_bot_check"
  | "authentication_required"
  | "unsupported_widget"
  | "file_upload_failed"
  | "provider_unavailable"
  | "verification_failed"
  | "provider_error";

export interface ProviderBlocker {
  kind: ProviderBlockerKind;
  message: string;
  fieldKey?: string;
}

export interface ProviderSession {
  sessionId: string;
  pageUrl: string | null;
}

export interface ProviderInspectResult {
  fields: Array<{
    key: string;
    label: string;
    required: boolean;
    sensitive: boolean;
    kind: string;
  }>;
  blockers: ProviderBlocker[];
}

export type ProviderFillValue =
  | { type: "text"; text: string }
  | {
      type: "private_file";
      documentId: string;
      fileName: string;
      mimeType: string | null;
      sizeBytes: number | null;
    };

export interface ProviderFillInput {
  key: string;
  value: ProviderFillValue;
  kind: string;
}

export interface ProviderFillResult {
  filled: string[];
  failed: Array<{ key: string; reason: string }>;
  blockers: ProviderBlocker[];
}

export interface ProviderSubmitResult {
  submitted: boolean;
  blockers: ProviderBlocker[];
}

export interface ProviderVerifyResult {
  verified: boolean;
  confirmationText: string | null;
  confirmationUrl: string | null;
  blockers: ProviderBlocker[];
}

export interface ProviderEvidence {
  screenshotPath: string | null;
  pageUrl: string | null;
  capturedAt: string;
}

export interface BrowserAutomationProvider {
  name: string;
  openSession(targetUrl: string): Promise<ProviderSession>;
  inspect(session: ProviderSession): Promise<ProviderInspectResult>;
  fill(session: ProviderSession, values: ProviderFillInput[]): Promise<ProviderFillResult>;
  submit(session: ProviderSession): Promise<ProviderSubmitResult>;
  verify(session: ProviderSession): Promise<ProviderVerifyResult>;
  captureEvidence(session: ProviderSession): Promise<ProviderEvidence>;
  closeSession(session: ProviderSession): Promise<void>;
}
