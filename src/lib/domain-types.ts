import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type UUID = string;
export type ISODateString = string;
export type EmploymentType = Enums["employment_type"];
export type WorkArrangement = Enums["work_arrangement"];
export type ApplicationStatus = Enums["application_status"];
export type DocumentKind = Enums["document_kind"];
export type CandidateProfile = Tables["candidate_profiles"]["Row"];
export type CandidateProfileUpdate = Tables["candidate_profiles"]["Update"];
export type UserPreferences = Tables["user_preferences"]["Row"];
export type UserPreferencesUpdate = Tables["user_preferences"]["Update"];
export type Job = Tables["jobs"]["Row"];
export type JobInsert = Tables["jobs"]["Insert"];
export type Application = Tables["applications"]["Row"];
export type ApplicationInsert = Tables["applications"]["Insert"];
export type ApplicationStatusEvent = Tables["application_status_events"]["Row"];
export type CandidateDocument = Tables["documents"]["Row"];
export type CandidateDocumentInsert = Tables["documents"]["Insert"];
export type SavedAnswer = Tables["saved_answers"]["Row"];
export type SubmissionReceipt = Tables["submission_receipts"]["Row"];
export type JobAnalysis = Tables["job_analyses"]["Row"];
export type ApplicationMaterials = Tables["application_materials"]["Row"];

export type ApplicationWithJob = Application & {
  job: Pick<Job, "id" | "title" | "company" | "ats_name"> | null;
};

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "draft", "submitted", "in_review", "interview", "offer", "rejected", "withdrawn",
];

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  resume: "Resume",
  cover_letter: "Cover letter",
  transcript: "Transcript",
  portfolio: "Portfolio",
  other: "Other",
};

export const DOCUMENT_KINDS: DocumentKind[] = ["resume", "cover_letter", "transcript", "portfolio", "other"];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const DOCUMENT_STORAGE_BUCKET = "candidate-documents";

export function documentStoragePath(userId: UUID, fileName: string): string {
  return `${userId}/${Date.now()}-${fileName.replace(/[^\w.-]+/g, "_")}`;
}
