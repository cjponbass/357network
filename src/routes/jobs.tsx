import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Job } from "@/lib/domain-types";

export const Route = createFileRoute("/jobs")({ component: JobsPage });

function JobsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
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
    setBusy(true);
    setError(null);
    const { error: insertError } = await supabase.from("jobs").insert({
      created_by: user.id,
      title: title.trim(),
      company: company.trim(),
      source_url: url.trim() || null,
    });
    if (insertError) setError(insertError.message);
    else {
      setTitle("");
      setCompany("");
      setUrl("");
      await load();
    }
    setBusy(false);
  }

  async function removeJob(id: string) {
    if (!user) return;
    const { error: deleteError } = await supabase.from("jobs").delete().eq("id", id).eq("created_by", user.id);
    if (deleteError) setError(deleteError.message);
    else await load();
  }

  if (loading || !user) return <main style={pageStyle}>Loading jobs…</main>;

  return (
    <main style={pageStyle}>
      <a href="/dashboard" style={backLink}>← Dashboard</a>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Saved jobs</h1>
      <p style={{ color: "#4b5563" }}>Save target roles here before preparing or tracking an application.</p>

      <form onSubmit={addJob} style={{ display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, margin: "28px 0" }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Add a job</h2>
        <input required placeholder="Job title" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        <input required placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} style={inputStyle} />
        <input type="url" placeholder="Application URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} style={inputStyle} />
        <button disabled={busy} style={primaryButton}>{busy ? "Saving…" : "Save job"}</button>
      </form>

      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      <section style={{ display: "grid", gap: 12 }}>
        {jobs.length === 0 ? <p style={{ color: "#6b7280" }}>No saved jobs yet.</p> : jobs.map((job) => (
          <article key={job.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, display: "flex", justifyContent: "space-between", gap: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 19 }}>{job.title}</h2>
              <p style={{ margin: "6px 0", color: "#4b5563" }}>{job.company}</p>
              {job.source_url ? <a href={job.source_url} target="_blank" rel="noreferrer">Open application page</a> : null}
            </div>
            <button onClick={() => void removeJob(job.id)} style={dangerButton}>Delete</button>
          </article>
        ))}
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = { maxWidth: 900, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui" };
const backLink: React.CSSProperties = { color: "#1d4ed8", textDecoration: "none" };
const inputStyle: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "11px 12px", fontSize: 16 };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 8, padding: "11px 14px", background: "#111827", color: "white", cursor: "pointer" };
const dangerButton: React.CSSProperties = { border: "1px solid #fecaca", borderRadius: 8, padding: "8px 11px", background: "#fff", color: "#b91c1c", height: 38, cursor: "pointer" };
