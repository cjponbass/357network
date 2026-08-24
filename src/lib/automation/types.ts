/** Shared client-safe automation types for the 357Network job platform. */

export type AtsProvider = "greenhouse" | "lever" | "ashby" | "workday" | "unknown";
export type SubmissionState =
  | "draft"
  | "queued"
  | "running"
  | "needs_user_input"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface AtsFormField {
  key: string;
  label: string;
  required: boolean;
  sensitive: boolean;
  kind: "text" | "email" | "phone" | "url" | "file" | "long_text" | "choice";
}

export type FillValue =
  | { type: "text"; text: string }
  | {
      type: "private_file";
      documentId: string;
      fileName: string;
      mimeType: string | null;
      sizeBytes: number | null;
    };

export type AutomationErrorCategory =
  | "no_automation_provider"
  | "unsupported_ats"
  | "missing_url"
  | "missing_facts"
  | "captcha_or_bot_check"
  | "authentication_required"
  | "verification_failed"
  | "provider_error"
  | "unsupported_widget"
  | "file_upload_failed"
  | "provider_unavailable"
  | "already_submitted";
