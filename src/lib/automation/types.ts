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

export const ATS_PROVIDER_LABELS: Record<AtsProvider, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  workday: "Workday",
  unknown: "Unknown / unsupported",
};

export const SUBMISSION_STATE_LABELS: Record<SubmissionState, string> = {
  draft: "Draft",
  queued: "Queued",
  running: "Running",
  needs_user_input: "Needs your input",
  succeeded: "Succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const IMPLEMENTED_PROVIDERS: AtsProvider[] = ["greenhouse", "lever"];

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

export interface ResolvedField extends AtsFormField {
  value: string | null;
  fill: FillValue | null;
  source: "profile" | "document" | "materials" | "saved_answer" | "unresolved";
}

export type SubmittedAnswer =
  | { key: string; label: string; type: "text"; value: string }
  | { key: string; label: string; type: "text"; sensitive: true; provided: true }
  | {
      key: string;
      label: string;
      type: "file";
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

export interface ReadinessReport {
  applicationId: string;
  jobTitle: string;
  company: string;
  targetUrl: string | null;
  detectedProvider: AtsProvider;
  detectionReason: string;
  adapterImplemented: boolean;
  automationConfigured: boolean;
  automationDriverAvailable: boolean;
  automationExecutable: boolean;
  automationProvider: string | null;
  resolved: ResolvedField[];
  unresolved: ResolvedField[];
  blockers: string[];
  notes: string[];
  nextState: SubmissionState;
  errorCategory: AutomationErrorCategory | null;
  attemptId: string | null;
  checkedAt: string;
  dryRun: true;
  disclaimer: string;
}

export interface SubmissionAttempt {
  id: string;
  application_id: string;
  ats_provider: AtsProvider;
  automation_provider: string | null;
  dry_run: boolean;
  state: SubmissionState;
  error_category: AutomationErrorCategory | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  receipt_id: string | null;
}

export const FIELD_REMEDIATION: Record<string, { label: string; to: string }> = {
  first_name: { label: "Candidate Profile", to: "/profile" },
  last_name: { label: "Candidate Profile", to: "/profile" },
  full_name: { label: "Candidate Profile", to: "/profile" },
  name: { label: "Candidate Profile", to: "/profile" },
  email: { label: "Candidate Profile", to: "/profile" },
  phone: { label: "Candidate Profile", to: "/profile" },
  location: { label: "Candidate Profile", to: "/profile" },
  linkedin: { label: "Candidate Profile", to: "/profile" },
  website: { label: "Candidate Profile", to: "/profile" },
  portfolio: { label: "Candidate Profile", to: "/profile" },
  resume: { label: "Documents", to: "/documents" },
  cover_letter: { label: "AI Preparation", to: "/prepare" },
  additional_information: { label: "AI Preparation", to: "/prepare" },
};
