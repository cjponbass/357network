import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type ApplicationWithJob,
  type Job,
} from "@/lib/domain-types";

export const Route = createFileRoute("/applications")({ component: ApplicationsPage });

function ApplicationsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    const [applicationsResult, jobsResult] = await Promise.all([
      supabase.from("applications").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
      supabase.from("jobs").select("*").eq("created_by", user.id).order("created_at", { ascending: false }),
    ]);

    if (jobsResult.error) {
      setError(jobsResult.error.message);
      setJobs([]);
      return;
    }
    const ownedJobs = jobsResult.data ?? [];
    setJobs(ownedJobs);

    if (applicationsResult.error) {
      setError(applicationsResult.error.message);
      setApplications([]);
      return;
    }

    const jobsById = new Map(ownedJobs.map((job) => [job.id, job]));
    setApplications(
      (applicationsResult.data ?? []).map((application) => {
        const job = jobsById.get(application.job_id);
        return {
          ...application,
          job: job ? { id: job.id, title: job.title, company: job.company, ats_name: job.ats_name } : null,
        };
      }),
    );
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableJobs = useMemo(() => {
    const tracked = new Set(applications.map((application) => application.job_id));
    return jobs.filter((job) => !tracked.has(job.id));
  }, [applications, jobs]);

  async function createApplication(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !jobId) return;
    setBusy(true);
    setError(null);
    const { data: createdApplication, error: insertError } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        job_id: jobId,
        status: "draft",
        notes: notes.trim() || null,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
    } else {
      const { error: eventError } = await supabase.from("application_status_events").insert({
        application_id: createdApplication.id,
        from_status: null,
        to_status: "draft",
        note: "Application tracking created",
      });

      if (eventError) {
        const { error: rollbackError } = await supabase
          .from("applications")
          .delete()
          .eq("id", createdApplication.id)
          .eq("user_id", user.id);
        setError(
          rollbackError
            ? `Application history could not be recorded (${eventError.message}), and the incomplete application could not be rolled back (${rollbackError.message}).`
            : `Application history could not be recorded: ${eventError.message}`,
        );
        setBusy(false);
        return;
      }

      setJobId("");
      setNotes("");
      await load();
    }
    setBusy(false);
  }

  async function updateStatus(id: string, status: ApplicationStatus) {
    if (!user) return;
    const currentApplication = applications.find((application) => application.id === id);
    if (!currentApplication || currentApplication.status === status) return;

    setError(null);
    const changes = {
      status,
      submitted_at: status === "submitted" ? new Date().toISOString() : null,
    };
    const { error: updateError } = await supabase
      .from("applications")
      .update(changes)
      .eq("id", id)
      .eq("user_id", user.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    const { error: eventError } = await supabase.from("application_status_events").insert({
      application_id: id,
      from_status: currentApplication.status,
      to_status: status,
      note: "Updated from applications list",
    });

    if (eventError) {
      const { error: rollbackError } = await supabase
        .from("applications")
        .update({
          status: currentApplication.status,
          submitted_at: currentApplication.submitted_at,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      await load();
      setError(
        rollbackError
          ? `Status history could not be recorded (${eventError.message}), and the status change could not be rolled back (${rollbackError.message}).`
          : `Status history could not be recorded, so the status change was rolled back: ${eventError.message}`,
      );
      return;
    }

    await load();
  }

  async function removeApplication(id: string) {
    if (!user) return;
    setError(null);
    const { error: deleteError } = await supabase
      .from("applications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (deleteError) setError(deleteError.message);
    else await load();
  }

  if (loading || !user) return <main style={pageStyle}>Loading applications…</main>;

  return (
    <main style={pageStyle}>
      <nav style={{ display: "flex", gap: 14, marginBottom: 28 }}>
        <a href="/dashboard" style={navLink}>Dashboard</a>
        <a href="/jobs" style={navLink}>Jobs</a>
      </nav>

      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Applications</h1>
      <p style={{ color: "#4b5563" }}>Track each application from preparation through offer or rejection.</p>

      <form onSubmit={createApplication} style={panelStyle}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Track a saved job</h2>
        <select required value={jobId} onChange={(event) => setJobId(event.target.value)} style={inputStyle}>
          <option value="">Choose a saved job</option>
          {availableJobs.map((job) => <option key={job.id} value={job.id}>{job.title} — {job.company}</option>)}
        </select>
        <textarea placeholder="Notes (optional)" value={notes} onChange={(event) => setNotes(event.target.value)} style={{ ...inputStyle, minHeight: 88 }} />
        <button disabled={busy || availableJobs.length === 0} style={primaryButton}>
          {busy ? "Creating…" : "Create application"}
        </button>
        {availableJobs.length === 0 ? <small style={{ color: "#6b7280" }}>Save another job before creating a new application.</small> : null}
      </form>

      {error ? <p role="alert" style={{ color: "#b91c1c" }}>{error}</p> : null}

      <section style={{ display: "grid", gap: 14 }}>
        {applications.length === 0 ? <p style={{ color: "#6b7280" }}>No applications tracked yet.</p> : applications.map((application) => (
          <article key={application.id} style={cardStyle}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 19 }}>
                <a href={`/applications/${application.id}`} style={{ color: "#111827", textDecoration: "none" }}>
                  {application.job?.title ?? "Saved job"}
                </a>
              </h2>
              <p style={{ margin: "6px 0", color: "#4b5563" }}>{application.job?.company ?? "Unknown company"}</p>
              <p style={{ margin: "6px 0", color: "#6b7280", fontSize: 14 }}>
                ATS: {application.job?.ats_name ?? "Not detected yet"}
              </p>
              {application.notes ? <p style={{ color: "#374151", whiteSpace: "pre-wrap" }}>{application.notes}</p> : null}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
              <a href={`/applications/${application.id}`} style={detailButton}>Open</a>
              <label style={{ fontSize: 14, color: "#374151" }}>
                Status{" "}
                <select
                  aria-label={`Status for ${application.job?.title ?? "application"}`}
                  value={application.status}
                  onChange={(event) => void updateStatus(application.id, event.target.value as ApplicationStatus)}
                  style={{ ...inputStyle, padding: "8px 10px", marginLeft: 4 }}
                >
                  {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{APPLICATION_STATUS_LABELS[status]}</option>)}
                </select>
              </label>
              <button onClick={() => void removeApplication(application.id)} style={dangerButton}>Delete</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui" };
const navLink: React.CSSProperties = { color: "#1d4ed8", textDecoration: "none" };
const panelStyle: React.CSSProperties = { display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, margin: "28px 0" };
const cardStyle: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center" };
const inputStyle: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "11px 12px", fontSize: 16, background: "white" };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 8, padding: "11px 14px", background: "#111827", color: "white", cursor: "pointer" };
const detailButton: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 11px", color: "#111827", textDecoration: "none" };
const dangerButton: React.CSSProperties = { border: "1px solid #fecaca", borderRadius: 8, padding: "8px 11px", background: "#fff", color: "#b91c1c", cursor: "pointer" };
