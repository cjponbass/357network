import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { detectAts } from "@/lib/automation/ats-detect";
import { IMPLEMENTED_PROVIDERS } from "@/lib/automation/types";
import type { Job } from "@/lib/domain-types";

export const Route = createFileRoute("/jobs")({ component: JobsPage });

function JobsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [trackingJobId, setTrackingJobId] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error: loadError } = await supabase
      .from("jobs")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setJobs(data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addJob(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;

    const normalizedTitle = title.trim();
    const normalizedCompany = company.trim();
    if (!normalizedTitle || !normalizedCompany) {
      setError("Job title and company are required.");
      return;
    }

    setBusy(true);
    setError(null);
    const sourceUrl = url.trim() || null;
    const detection = detectAts(sourceUrl);
    const { error: insertError } = await supabase.from("jobs").insert({
      created_by: user.id,
      title: normalizedTitle,
      company: normalizedCompany,
      location: location.trim() || null,
      description: description.trim() || null,
      source_url: sourceUrl,
      ats_name: detection.provider === "unknown" ? null : detection.provider,
    });
    if (insertError) setError(insertError.message);
    else {
      setTitle("");
      setCompany("");
      setLocation("");
      setDescription("");
      setUrl("");
      await load();
    }
    setBusy(false);
  }

  async function trackApplication(job: Job) {
    if (!user) return;
    setTrackingJobId(job.id);
    setError(null);

    const { data: existing, error: existingError } = await supabase
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("job_id", job.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      setError(existingError.message);
      setTrackingJobId(null);
      return;
    }

    let applicationId = existing?.id ?? null;
    if (!applicationId) {
      const { data: created, error: createError } = await supabase
        .from("applications")
        .insert({ user_id: user.id, job_id: job.id, status: "draft" })
        .select("id")
        .single();
      if (createError) {
        setError(createError.message);
        setTrackingJobId(null);
        return;
      }
      applicationId = created.id;

      const { error: eventError } = await supabase.from("application_status_events").insert({
        application_id: applicationId,
        from_status: null,
        to_status: "draft",
        note: "Application tracking created",
      });
      if (eventError) {
        const { error: rollbackError } = await supabase
          .from("applications")
          .delete()
          .eq("id", applicationId)
          .eq("user_id", user.id);
        setError(
          rollbackError
            ? `Application history could not be recorded (${eventError.message}), and the incomplete application could not be rolled back (${rollbackError.message}).`
            : `Application history could not be recorded: ${eventError.message}`,
        );
        setTrackingJobId(null);
        return;
      }
    }

    setTrackingJobId(null);
    await navigate({
      to: "/applications/$applicationId",
      params: { applicationId },
    });
  }

  async function saveDescription(jobId: string) {
    if (!user) return;
    setError(null);
    const { error: updateError } = await supabase
      .from("jobs")
      .update({ description: editingDescription.trim() || null })
      .eq("id", jobId)
      .eq("created_by", user.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditingJobId(null);
    setEditingDescription("");
    await load();
  }

  async function removeJob(id: string) {
    if (!user) return;
    const { count, error: applicationError } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("job_id", id);
    if (applicationError) {
      setError(applicationError.message);
      return;
    }
    if ((count ?? 0) > 0) {
      setError("Delete the tracked application for this job before deleting the saved job.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);
    if (deleteError) setError(deleteError.message);
    else await load();
  }

  if (loading || !user) return <main style={pageStyle}>Loading jobs…</main>;

  return (
    <main style={pageStyle}>
      <a href="/dashboard" style={backLink}>← Dashboard</a>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Saved jobs</h1>
      <p style={{ color: "#4b5563" }}>
        Save target roles, detect the ATS from the application URL, add the job description for stronger AI tailoring, and start or resume a tracked application.
      </p>

      <form
        onSubmit={addJob}
        style={{
          display: "grid",
          gap: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
          margin: "28px 0",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>Add a job</h2>
        <input
          required
          placeholder="Job title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
        <input
          required
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={inputStyle}
        />
        <textarea
          placeholder="Paste the full job description (recommended for AI fit analysis and tailoring)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, minHeight: 150, resize: "vertical" }}
        />
        <input
          type="url"
          placeholder="Application URL (recommended)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={inputStyle}
        />
        {url.trim() ? <AtsHint url={url.trim()} /> : null}
        <button disabled={busy} style={primaryButton}>{busy ? "Saving…" : "Save job"}</button>
      </form>

      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      <section style={{ display: "grid", gap: 12 }}>
        {jobs.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No saved jobs yet.</p>
        ) : (
          jobs.map((job) => {
            const detection = detectAts(job.source_url);
            const adapterAvailable = IMPLEMENTED_PROVIDERS.includes(detection.provider);
            const editing = editingJobId === job.id;
            return (
              <article
                key={job.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 18,
                  display: "grid",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19 }}>{job.title}</h2>
                    <p style={{ margin: "6px 0", color: "#4b5563" }}>{job.company}{job.location ? ` · ${job.location}` : ""}</p>
                    <p style={{ margin: "6px 0 10px", fontSize: 13, color: "#6b7280" }}>
                      ATS: <strong>{detection.provider === "unknown" ? "Not detected" : detection.provider}</strong>
                      {adapterAvailable
                        ? " · automation adapter available"
                        : detection.provider === "unknown"
                          ? " · manual workflow available"
                          : " · detected, automation adapter not yet enabled"}
                    </p>
                    {job.source_url ? (
                      <a href={job.source_url} target="_blank" rel="noreferrer">Open application page</a>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>No application URL saved</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => void trackApplication(job)}
                      disabled={trackingJobId === job.id}
                      style={primaryButton}
                    >
                      {trackingJobId === job.id ? "Opening…" : "Track / prepare"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingJobId(editing ? null : job.id);
                        setEditingDescription(editing ? "" : (job.description ?? ""));
                      }}
                      style={secondaryButton}
                    >
                      {editing ? "Cancel edit" : job.description ? "Edit description" : "Add description"}
                    </button>
                    <button onClick={() => void removeJob(job.id)} style={dangerButton}>Delete</button>
                  </div>
                </div>

                {editing ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <textarea
                      value={editingDescription}
                      onChange={(event) => setEditingDescription(event.target.value)}
                      style={{ ...inputStyle, minHeight: 180, resize: "vertical" }}
                      placeholder="Paste the full job description"
                    />
                    <button onClick={() => void saveDescription(job.id)} style={primaryButton}>Save description</button>
                  </div>
                ) : job.description ? (
                  <details>
                    <summary style={{ cursor: "pointer", color: "#374151" }}>View saved job description</summary>
                    <pre style={descriptionStyle}>{job.description}</pre>
                  </details>
                ) : (
                  <p style={{ margin: 0, color: "#92400e", fontSize: 14 }}>
                    No job description saved yet. AI fit analysis and tailored materials will be weaker until one is added.
                  </p>
                )}
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

function AtsHint({ url }: { url: string }) {
  const detection = detectAts(url);
  const label = detection.provider === "unknown" ? "ATS not detected" : `Detected ATS: ${detection.provider}`;
  return (
    <span style={{ fontSize: 13, color: detection.provider === "unknown" ? "#92400e" : "#166534" }}>
      {label}. {detection.reason}
    </span>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "40px 24px",
  fontFamily: "system-ui",
};
const backLink: React.CSSProperties = { color: "#1d4ed8", textDecoration: "none" };
const inputStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "11px 12px",
  fontSize: 16,
  boxSizing: "border-box",
  width: "100%",
  fontFamily: "inherit",
};
const primaryButton: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  padding: "11px 14px",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};
const secondaryButton: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "8px 11px",
  background: "#fff",
  color: "#374151",
  height: 38,
  cursor: "pointer",
};
const dangerButton: React.CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: 8,
  padding: "8px 11px",
  background: "#fff",
  color: "#b91c1c",
  height: 38,
  cursor: "pointer",
};
const descriptionStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  fontFamily: "inherit",
  color: "#4b5563",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  maxHeight: 320,
  overflowY: "auto",
};
