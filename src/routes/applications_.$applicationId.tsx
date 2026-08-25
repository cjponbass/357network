import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  DOCUMENT_KIND_LABELS,
  type Application,
  type ApplicationStatus,
  type ApplicationStatusEvent,
  type CandidateDocument,
  type Job,
  type SubmissionReceipt,
} from "@/lib/domain-types";

export const Route = createFileRoute("/applications_/$applicationId")({
  component: ApplicationDetailPage,
});

const NONE = "__none__";

function ApplicationDetailPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [events, setEvents] = useState<ApplicationStatusEvent[]>([]);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>("draft");
  const [notes, setNotes] = useState("");
  const [resumeId, setResumeId] = useState(NONE);
  const [coverId, setCoverId] = useState(NONE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    const appResult = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (appResult.error) {
      setError(appResult.error.message);
      return;
    }
    if (!appResult.data) {
      setApplication(null);
      return;
    }

    const app = appResult.data;
    setApplication(app);
    setStatus(app.status);
    setNotes(app.notes ?? "");
    setResumeId(app.resume_document_id ?? NONE);
    setCoverId(app.cover_letter_document_id ?? NONE);

    const [jobResult, docsResult, eventsResult, receiptResult] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", app.job_id).eq("created_by", user.id).maybeSingle(),
      supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("application_status_events").select("*").eq("application_id", applicationId).order("occurred_at", { ascending: false }),
      supabase.from("submission_receipts").select("*").eq("application_id", applicationId).eq("user_id", user.id).maybeSingle(),
    ]);

    if (jobResult.error) setError(jobResult.error.message);
    else setJob(jobResult.data ?? null);
    if (docsResult.error) setError(docsResult.error.message);
    else setDocuments(docsResult.data ?? []);
    if (eventsResult.error) setError(eventsResult.error.message);
    else setEvents(eventsResult.data ?? []);
    if (receiptResult.error) setError(receiptResult.error.message);
    else setReceipt(receiptResult.data ?? null);
  }, [applicationId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedResume = useMemo(
    () => documents.find((doc) => doc.id === resumeId) ?? null,
    [documents, resumeId],
  );
  const selectedCover = useMemo(
    () => documents.find((doc) => doc.id === coverId) ?? null,
    [documents, coverId],
  );

  async function saveApplication(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !application) return;
    setBusy(true);
    setError(null);

    const oldStatus = application.status;
    const submittedAt = status === "submitted" && !application.submitted_at
      ? new Date().toISOString()
      : application.submitted_at;

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status,
        notes: notes.trim() || null,
        resume_document_id: resumeId === NONE ? null : resumeId,
        cover_letter_document_id: coverId === NONE ? null : coverId,
        submitted_at: submittedAt,
      })
      .eq("id", applicationId)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }

    if (oldStatus !== status) {
      const { error: eventError } = await supabase.from("application_status_events").insert({
        application_id: applicationId,
        user_id: user.id,
        from_status: oldStatus,
        to_status: status,
        note: "Updated from application detail workspace",
      });
      if (eventError) setError(eventError.message);
    }

    await load();
    setBusy(false);
  }

  if (loading || !user) return <main style={pageStyle}>Loading application…</main>;
  if (!application) {
    return (
      <main style={pageStyle}>
        <a href="/applications" style={navLink}>← Applications</a>
        <h1>Application not found</h1>
        <p style={{ color: "#6b7280" }}>This application does not exist or is not owned by your account.</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <nav style={{ display: "flex", gap: 14, marginBottom: 26 }}>
        <a href="/applications" style={navLink}>← Applications</a>
        <a href="/dashboard" style={navLink}>Dashboard</a>
        <a href="/documents" style={navLink}>Documents</a>
      </nav>

      <h1 style={{ fontSize: 34, marginBottom: 6 }}>{job?.title ?? "Application"}</h1>
      <p style={{ color: "#4b5563", marginTop: 0 }}>{job?.company ?? "Saved job"}</p>
      <p style={{ color: "#6b7280", fontSize: 14 }}>
        ATS: {job?.ats_name ?? "Not detected yet"} · Created {new Date(application.created_at).toLocaleString()}
      </p>

      {error ? <p role="alert" style={{ color: "#b91c1c" }}>{error}</p> : null}

      <form onSubmit={saveApplication} style={panelStyle}>
        <h2 style={sectionTitle}>Application details</h2>
        <label style={labelStyle}>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as ApplicationStatus)} style={inputStyle}>
            {APPLICATION_STATUSES.map((value) => <option key={value} value={value}>{APPLICATION_STATUS_LABELS[value]}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          Resume
          <select value={resumeId} onChange={(event) => setResumeId(event.target.value)} style={inputStyle}>
            <option value={NONE}>None selected</option>
            {documents.filter((doc) => doc.kind === "resume" || doc.kind === "other").map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name} · {DOCUMENT_KIND_LABELS[doc.kind]}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Cover letter
          <select value={coverId} onChange={(event) => setCoverId(event.target.value)} style={inputStyle}>
            <option value={NONE}>None selected</option>
            {documents.filter((doc) => doc.kind === "cover_letter" || doc.kind === "other").map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name} · {DOCUMENT_KIND_LABELS[doc.kind]}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} style={{ ...inputStyle, minHeight: 100 }} />
        </label>

        <button disabled={busy} style={primaryButton}>{busy ? "Saving…" : "Save application"}</button>
      </form>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Automation readiness</h2>
        <ReadinessItem label="Application URL" ready={Boolean(job?.source_url)} detail={job?.source_url ?? "Add an application URL to the saved job."} />
        <ReadinessItem label="ATS detection" ready={Boolean(job?.ats_name)} detail={job?.ats_name ?? "ATS has not been identified yet."} />
        <ReadinessItem label="Resume selected" ready={Boolean(selectedResume)} detail={selectedResume?.name ?? "Select a resume before automated submission."} />
        <ReadinessItem label="Cover letter" ready={true} detail={selectedCover?.name ?? "Optional unless the employer requires one."} />
        <p style={{ marginBottom: 0, color: "#6b7280", fontSize: 14 }}>
          Automated submission remains server-controlled. CAPTCHA, login walls and unresolved required questions stop the run; success is recorded only after confirmation evidence is verified.
        </p>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Status history</h2>
        {events.length === 0 ? <p style={{ color: "#6b7280" }}>No status changes recorded yet.</p> : (
          <ol style={{ display: "grid", gap: 10, paddingLeft: 20 }}>
            {events.map((event) => (
              <li key={event.id}>
                <strong>{event.from_status ? `${APPLICATION_STATUS_LABELS[event.from_status]} → ` : ""}{APPLICATION_STATUS_LABELS[event.to_status]}</strong>
                <div style={{ color: "#6b7280", fontSize: 13 }}>{new Date(event.occurred_at).toLocaleString()}</div>
                {event.note ? <div style={{ color: "#4b5563" }}>{event.note}</div> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Verified submission receipt</h2>
        {!receipt ? (
          <p style={{ color: "#6b7280" }}>No verified submission receipt exists. A receipt is created only after a submission is confirmed.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <div><strong>ATS:</strong> {receipt.ats_name}</div>
            <div><strong>Submitted:</strong> {new Date(receipt.submitted_at).toLocaleString()}</div>
            <div><strong>Confirmation:</strong> {receipt.confirmation_text ?? "Confirmation evidence captured"}</div>
            <div><strong>URL:</strong> <a href={receipt.application_url} target="_blank" rel="noreferrer">Open application</a></div>
          </div>
        )}
      </section>
    </main>
  );
}

function ReadinessItem({ label, ready, detail }: { label: string; ready: boolean; detail: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "150px 90px 1fr", gap: 12, alignItems: "center", borderTop: "1px solid #e5e7eb", padding: "10px 0" }}>
      <strong>{label}</strong>
      <span style={{ color: ready ? "#166534" : "#b45309" }}>{ready ? "Ready" : "Needs work"}</span>
      <span style={{ color: "#6b7280", overflowWrap: "anywhere" }}>{detail}</span>
    </div>
  );
}

const pageStyle: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui" };
const navLink: React.CSSProperties = { color: "#1d4ed8", textDecoration: "none" };
const panelStyle: React.CSSProperties = { display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, margin: "22px 0", background: "#fff" };
const sectionTitle: React.CSSProperties = { margin: 0, fontSize: 20 };
const labelStyle: React.CSSProperties = { display: "grid", gap: 6, color: "#374151", fontSize: 14 };
const inputStyle: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "11px 12px", fontSize: 16, background: "white" };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 8, padding: "11px 14px", background: "#111827", color: "white", cursor: "pointer", justifySelf: "start" };
