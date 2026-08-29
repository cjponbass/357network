import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  checkSubmissionReadiness,
  getAutomationStatus,
  listSubmissionAttempts,
  startSubmission,
  type AutomationStatusResult,
} from "@/lib/automation/automation.functions";
import type {
  AutomationErrorCategory,
  ReadinessReport,
  SubmissionAttempt,
  SubmissionState,
} from "@/lib/automation/types";
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

export const Route = createFileRoute("/applications_/$applicationId")({ component: ApplicationDetailPage });

const NONE = "__none__";

type ExecutionView = {
  state: SubmissionState;
  errorCategory: AutomationErrorCategory | null;
  receiptId: string | null;
  message: string;
};

function ApplicationDetailPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [events, setEvents] = useState<ApplicationStatusEvent[]>([]);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [automationStatus, setAutomationStatus] = useState<AutomationStatusResult | null>(null);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [attempts, setAttempts] = useState<SubmissionAttempt[]>([]);
  const [execution, setExecution] = useState<ExecutionView | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>("draft");
  const [notes, setNotes] = useState("");
  const [resumeId, setResumeId] = useState(NONE);
  const [coverId, setCoverId] = useState(NONE);
  const [busy, setBusy] = useState(false);
  const [automationBusy, setAutomationBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const refreshAutomation = useCallback(async () => {
    if (!user) return;
    try {
      const [provider, history] = await Promise.all([
        getAutomationStatus(),
        listSubmissionAttempts({ data: { applicationId } }),
      ]);
      setAutomationStatus(provider);
      setAttempts(history);
    } catch (automationError) {
      setError(
        automationError instanceof Error
          ? automationError.message
          : "Could not load automation status.",
      );
    }
  }, [applicationId, user]);

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
      supabase.from("submission_receipts").select("*").eq("application_id", applicationId).maybeSingle(),
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
    void refreshAutomation();
  }, [load, refreshAutomation]);

  const selectedResume = useMemo(
    () => documents.find((doc) => doc.id === resumeId) ?? null,
    [documents, resumeId],
  );
  const selectedCover = useMemo(
    () => documents.find((doc) => doc.id === coverId) ?? null,
    [documents, coverId],
  );
  const canSubmit = Boolean(
    readiness?.nextState === "queued" &&
      automationStatus?.executable &&
      automationStatus.submitEnabled &&
      !receipt,
  );

  async function saveApplication(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !application) return;
    setBusy(true);
    setError(null);
    const oldStatus = application.status;
    const oldSubmittedAt = application.submitted_at;
    const submittedAt =
      status === "submitted"
        ? application.submitted_at ?? new Date().toISOString()
        : null;

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
        from_status: oldStatus,
        to_status: status,
        note: "Updated from application detail workspace",
      });
      if (eventError) {
        const { error: rollbackError } = await supabase
          .from("applications")
          .update({ status: oldStatus, submitted_at: oldSubmittedAt })
          .eq("id", applicationId)
          .eq("user_id", user.id);
        setError(
          rollbackError
            ? `${eventError.message} Rollback also failed: ${rollbackError.message}`
            : `${eventError.message} The status change was rolled back.`,
        );
      }
    }

    await load();
    setReadiness(null);
    setBusy(false);
  }

  async function runReadiness() {
    setAutomationBusy(true);
    setExecution(null);
    setError(null);
    try {
      const report = await checkSubmissionReadiness({ data: { applicationId } });
      setReadiness(report);
      await refreshAutomation();
    } catch (automationError) {
      setError(
        automationError instanceof Error ? automationError.message : "Readiness check failed.",
      );
    } finally {
      setAutomationBusy(false);
    }
  }

  async function runSubmission() {
    if (!canSubmit) return;
    setAutomationBusy(true);
    setError(null);
    try {
      const result = await startSubmission({
        data: { applicationId, requestKey: crypto.randomUUID() },
      });
      setExecution(result);
      await Promise.all([load(), refreshAutomation()]);
    } catch (automationError) {
      setError(
        automationError instanceof Error ? automationError.message : "Submission run failed.",
      );
    } finally {
      setAutomationBusy(false);
    }
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
        ATS: {readiness?.detectedProvider ?? job?.ats_name ?? "Not detected yet"} · Created {new Date(application.created_at).toLocaleString()}
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
            {documents.filter((doc) => doc.kind === "resume" || doc.kind === "other").map((doc) => <option key={doc.id} value={doc.id}>{doc.name} · {DOCUMENT_KIND_LABELS[doc.kind]}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Cover letter
          <select value={coverId} onChange={(event) => setCoverId(event.target.value)} style={inputStyle}>
            <option value={NONE}>None selected</option>
            {documents.filter((doc) => doc.kind === "cover_letter" || doc.kind === "other").map((doc) => <option key={doc.id} value={doc.id}>{doc.name} · {DOCUMENT_KIND_LABELS[doc.kind]}</option>)}
          </select>
        </label>
        <label style={labelStyle}>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} style={{ ...inputStyle, minHeight: 100 }} /></label>
        <button disabled={busy} style={primaryButton}>{busy ? "Saving…" : "Save application"}</button>
      </form>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Automation readiness</h2>
        <ReadinessItem label="Application URL" ready={Boolean(job?.source_url)} detail={job?.source_url ?? "Add an application URL to the saved job."} />
        <ReadinessItem label="ATS adapter" ready={Boolean(readiness?.adapterImplemented)} detail={readiness ? `${readiness.detectedProvider}: ${readiness.detectionReason}` : "Run the server readiness check to detect the ATS."} />
        <ReadinessItem label="Resume selected" ready={Boolean(selectedResume)} detail={selectedResume?.name ?? "Select and save a resume before automated submission."} />
        <ReadinessItem label="Cover letter" ready={true} detail={selectedCover?.name ?? "Optional unless the employer requires one."} />
        <ReadinessItem
          label="Browser provider"
          ready={Boolean(automationStatus?.executable)}
          detail={
            !automationStatus
              ? "Checking provider status…"
              : !automationStatus.configured
                ? "Browserbase integration is installed, but credentials are not configured."
                : automationStatus.missingConfig.length > 0
                  ? `Missing server configuration: ${automationStatus.missingConfig.join(", ")}.`
                  : `Provider ${automationStatus.provider ?? "configured"} is available; connectivity is verified only during a run.`
          }
        />
        <ReadinessItem
          label="Submit boundary"
          ready={Boolean(automationStatus?.submitEnabled)}
          detail={automationStatus?.submitEnabled ? "Final submit is enabled server-side." : "Final submit is disabled server-side; no employer submission can occur."}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => void runReadiness()} disabled={automationBusy} style={secondaryButton}>
            {automationBusy ? "Working…" : "Run server readiness check"}
          </button>
          <button type="button" onClick={() => void runSubmission()} disabled={!canSubmit || automationBusy} style={{ ...primaryButton, opacity: canSubmit ? 1 : 0.5 }}>
            Start verified submission
          </button>
        </div>
        <p style={{ marginBottom: 0, color: "#6b7280", fontSize: 14 }}>
          Save application changes before checking readiness. CAPTCHA, login walls and unresolved required questions stop the run. A receipt is created only after concrete confirmation evidence is verified.
        </p>

        {readiness ? (
          <div style={resultBox}>
            <strong>Readiness result: {readiness.nextState}</strong>
            {readiness.blockers.length > 0 ? <ul>{readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul> : <p>No readiness blockers found.</p>}
            <p style={{ marginBottom: 0 }}>{readiness.disclaimer}</p>
          </div>
        ) : null}
        {execution ? (
          <div style={resultBox}>
            <strong>Submission result: {execution.state}</strong>
            <p>{execution.message}</p>
            {execution.errorCategory ? <p style={{ marginBottom: 0 }}>Category: {execution.errorCategory}</p> : null}
          </div>
        ) : null}
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Submission attempts</h2>
        {attempts.length === 0 ? <p style={{ color: "#6b7280" }}>No readiness or submission attempts recorded yet.</p> : (
          <ol style={{ display: "grid", gap: 10, paddingLeft: 20 }}>
            {attempts.map((attempt) => (
              <li key={attempt.id}>
                <strong>{attempt.dry_run ? "Dry run" : "Submission"}: {attempt.state}</strong>
                <div style={{ color: "#6b7280", fontSize: 13 }}>{new Date(attempt.created_at).toLocaleString()} · {attempt.ats_provider}</div>
                {attempt.error_message ? <div style={{ color: "#7f1d1d" }}>{attempt.error_message}</div> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Status history</h2>
        {events.length === 0 ? <p style={{ color: "#6b7280" }}>No status changes recorded yet.</p> : <ol style={{ display: "grid", gap: 10, paddingLeft: 20 }}>{events.map((event) => <li key={event.id}><strong>{event.from_status ? `${APPLICATION_STATUS_LABELS[event.from_status]} → ` : ""}{APPLICATION_STATUS_LABELS[event.to_status]}</strong><div style={{ color: "#6b7280", fontSize: 13 }}>{new Date(event.occurred_at).toLocaleString()}</div>{event.note ? <div style={{ color: "#4b5563" }}>{event.note}</div> : null}</li>)}</ol>}
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Verified submission receipt</h2>
        {!receipt ? <p style={{ color: "#6b7280" }}>No verified submission receipt exists. A receipt is created only after a submission is confirmed.</p> : (
          <div style={{ display: "grid", gap: 8 }}>
            <div><strong>ATS:</strong> {receipt.ats_name ?? "Unknown"}</div>
            <div><strong>Submitted:</strong> {receipt.submitted_at ? new Date(receipt.submitted_at).toLocaleString() : "Timestamp unavailable"}</div>
            <div><strong>Confirmation:</strong> {receipt.confirmation_text ?? "Confirmation evidence captured"}</div>
            <div><strong>URL:</strong> {receipt.application_url ? <a href={receipt.application_url} target="_blank" rel="noreferrer">Open application</a> : "Not recorded"}</div>
          </div>
        )}
      </section>
    </main>
  );
}

function ReadinessItem({ label, ready, detail }: { label: string; ready: boolean; detail: string }) {
  return <div style={{ display: "grid", gridTemplateColumns: "150px 90px 1fr", gap: 12, alignItems: "center", borderTop: "1px solid #e5e7eb", padding: "10px 0" }}><strong>{label}</strong><span style={{ color: ready ? "#166534" : "#b45309" }}>{ready ? "Ready" : "Needs work"}</span><span style={{ color: "#6b7280", overflowWrap: "anywhere" }}>{detail}</span></div>;
}

const pageStyle: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui" };
const navLink: React.CSSProperties = { color: "#1d4ed8", textDecoration: "none" };
const panelStyle: React.CSSProperties = { display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, margin: "22px 0", background: "#fff" };
const sectionTitle: React.CSSProperties = { margin: 0, fontSize: 20 };
const labelStyle: React.CSSProperties = { display: "grid", gap: 6, color: "#374151", fontSize: 14 };
const inputStyle: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "11px 12px", fontSize: 16, background: "white" };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 8, padding: "11px 14px", background: "#111827", color: "white", cursor: "pointer", justifySelf: "start" };
const secondaryButton: React.CSSProperties = { ...primaryButton, background: "#e5e7eb", color: "#111827" };
const resultBox: React.CSSProperties = { border: "1px solid #d1d5db", background: "#f9fafb", borderRadius: 8, padding: 14, color: "#374151" };
