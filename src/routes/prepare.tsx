import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  analyzeJobFit,
  generateCoverLetter,
  generateTailoredResume,
  getAiStatus,
  suggestApplicationAnswer,
  type AiStatusResult,
  type FitAnalysisResult,
  type SuggestedAnswerResult,
} from "@/lib/ai/ai.functions";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type Material = Database["public"]["Tables"]["application_materials"]["Row"];

type PreparationSearch = {
  jobId?: string;
};

export const Route = createFileRoute("/prepare")({
  validateSearch: (search: Record<string, unknown>): PreparationSearch => {
    const value = search["jobId"];
    return typeof value === "string" && value.trim() ? { jobId: value } : {};
  },
  component: PreparationPage,
});

function PreparationPage() {
  const navigate = useNavigate();
  const { jobId: requestedJobId } = Route.useSearch();
  const { user, loading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatusResult | null>(null);
  const [analysis, setAnalysis] = useState<FitAnalysisResult | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<SuggestedAnswerResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, navigate, user]);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    const { data, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    if (jobsError) {
      setError(jobsError.message);
      return;
    }
    const ownedJobs = data ?? [];
    setJobs(ownedJobs);
    setJobId((current) => {
      if (requestedJobId && ownedJobs.some((job) => job.id === requestedJobId)) return requestedJobId;
      if (current && ownedJobs.some((job) => job.id === current)) return current;
      return ownedJobs[0]?.id ?? "";
    });
  }, [requestedJobId, user]);

  const loadMaterial = useCallback(async () => {
    if (!user || !jobId) {
      setMaterial(null);
      return;
    }
    const { data, error: materialError } = await supabase
      .from("application_materials")
      .select("*")
      .eq("user_id", user.id)
      .eq("job_id", jobId)
      .maybeSingle();
    if (materialError) setError(materialError.message);
    else setMaterial(data ?? null);
  }, [jobId, user]);

  useEffect(() => {
    if (!user) return;
    void loadJobs();
    void getAiStatus()
      .then(setAiStatus)
      .catch((statusError: unknown) =>
        setError(statusError instanceof Error ? statusError.message : "Could not read AI status."),
      );
  }, [loadJobs, user]);

  useEffect(() => {
    setAnalysis(null);
    setAnswer(null);
    void loadMaterial();
  }, [loadMaterial]);

  const selectedJob = useMemo(() => jobs.find((job) => job.id === jobId) ?? null, [jobId, jobs]);

  async function runTask(name: string, task: () => Promise<void>) {
    setBusy(name);
    setError(null);
    try {
      await task();
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "AI preparation failed.");
    } finally {
      setBusy(null);
    }
  }

  if (loading || !user) return <main style={pageStyle}>Loading preparation workspace…</main>;

  return (
    <main style={pageStyle}>
      <nav style={navStyle}>
        <a href="/dashboard" style={linkStyle}>Dashboard</a>
        <a href="/jobs" style={linkStyle}>Jobs</a>
        <a href="/applications" style={linkStyle}>Applications</a>
        <a href="/documents" style={linkStyle}>Documents</a>
      </nav>
      <h1 style={{ fontSize: 34, marginBottom: 6 }}>AI application preparation</h1>
      <p style={muted}>Generate fact-grounded job analysis, resume text, cover letters, and application-answer suggestions. Generated content is saved to your private workspace.</p>

      {error ? <p role="alert" style={errorStyle}>{error}</p> : null}

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Provider status</h2>
        <div>
          {aiStatus?.configured
            ? `Configured: ${aiStatus.provider ?? "AI provider"}${aiStatus.model ? ` · ${aiStatus.model}` : ""}`
            : "AI provider is not configured on the server yet."}
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Choose a saved job</h2>
        {jobs.length === 0 ? (
          <p style={muted}>Save a job first, then return here for preparation.</p>
        ) : (
          <select value={jobId} onChange={(event) => setJobId(event.target.value)} style={inputStyle}>
            {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} · {job.company}</option>)}
          </select>
        )}
        {selectedJob ? (
          <div style={resultStyle}>
            <strong>{selectedJob.title} at {selectedJob.company}</strong>
            <div style={muted}>{selectedJob.location ?? "Location not specified"}</div>
            {!selectedJob.description ? <div style={warningStyle}>Add the job description to the saved job for stronger analysis and tailoring.</div> : null}
          </div>
        ) : null}
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Job fit analysis</h2>
        <button
          disabled={!jobId || !aiStatus?.configured || Boolean(busy)}
          style={primaryButton}
          onClick={() => void runTask("analysis", async () => setAnalysis(await analyzeJobFit({ data: { jobId } })))}
        >
          {busy === "analysis" ? "Analyzing…" : "Analyze fit"}
        </button>
        {analysis ? (
          <div style={resultStyle}>
            <strong>Fit score: {analysis.fit_score}/100</strong>
            <p>{analysis.summary}</p>
            <List title="Strengths" values={analysis.strengths} />
            <List title="Gaps" values={analysis.gaps} />
            <List title="Keyword matches" values={analysis.keyword_matches} />
            <List title="Missing keywords" values={analysis.missing_keywords} />
            {analysis.positioning ? <p><strong>Positioning:</strong> {analysis.positioning}</p> : null}
          </div>
        ) : null}
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Tailored materials</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            disabled={!jobId || !aiStatus?.configured || Boolean(busy)}
            style={primaryButton}
            onClick={() => void runTask("resume", async () => {
              await generateTailoredResume({ data: { jobId } });
              await loadMaterial();
            })}
          >
            {busy === "resume" ? "Generating…" : "Generate tailored resume text"}
          </button>
          <button
            disabled={!jobId || !aiStatus?.configured || Boolean(busy)}
            style={secondaryButton}
            onClick={() => void runTask("cover", async () => {
              await generateCoverLetter({ data: { jobId } });
              await loadMaterial();
            })}
          >
            {busy === "cover" ? "Generating…" : "Generate cover letter"}
          </button>
        </div>
        <Output title="Tailored resume" text={material?.tailored_resume_text ?? ""} />
        <Output title="Cover letter" text={material?.cover_letter_text ?? ""} />
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>Application answer assistant</h2>
        <label style={{ display: "grid", gap: 6 }}>
          Question
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} style={{ ...inputStyle, minHeight: 90 }} placeholder="Paste an employer application question" />
        </label>
        <button
          disabled={!jobId || !question.trim() || !aiStatus?.configured || Boolean(busy)}
          style={primaryButton}
          onClick={() => void runTask("answer", async () => setAnswer(await suggestApplicationAnswer({ data: { jobId, question } })))}
        >
          {busy === "answer" ? "Checking facts…" : "Suggest answer"}
        </button>
        {answer ? (
          <div style={resultStyle}>
            <strong>{answer.status === "OK" ? "Fact-grounded answer" : "Needs your input"}</strong>
            {answer.answer ? <pre style={preStyle}>{answer.answer}</pre> : null}
            {answer.missing_facts.length > 0 ? <List title="Missing facts" values={answer.missing_facts} /> : null}
            {answer.note ? <p style={muted}>{answer.note}</p> : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function List({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) return null;
  return <div><strong>{title}</strong><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></div>;
}

function Output({ title, text }: { title: string; text: string }) {
  return (
    <div style={resultStyle}>
      <strong>{title}</strong>
      {text ? <pre style={preStyle}>{text}</pre> : <p style={muted}>Not generated yet.</p>}
    </div>
  );
}

const pageStyle: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui" };
const navStyle: React.CSSProperties = { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 26 };
const linkStyle: React.CSSProperties = { color: "#1d4ed8", textDecoration: "none" };
const muted: React.CSSProperties = { color: "#6b7280" };
const errorStyle: React.CSSProperties = { color: "#b91c1c", border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 8, padding: 12 };
const warningStyle: React.CSSProperties = { color: "#92400e", marginTop: 8 };
const panelStyle: React.CSSProperties = { display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, margin: "22px 0", background: "#fff" };
const sectionTitle: React.CSSProperties = { margin: 0, fontSize: 20 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 8, padding: "11px 12px", fontSize: 16, background: "white" };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 8, padding: "11px 14px", background: "#111827", color: "white", cursor: "pointer", justifySelf: "start" };
const secondaryButton: React.CSSProperties = { ...primaryButton, background: "#e5e7eb", color: "#111827" };
const resultStyle: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: 14, background: "#f9fafb" };
const preStyle: React.CSSProperties = { whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit", marginBottom: 0 };
