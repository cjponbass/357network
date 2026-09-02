import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { detectAts } from "@/lib/automation/ats-detect";
import {
  JOB_SEARCH_COUNTRIES,
  getJobSearchStatus,
  searchJobs,
  type DiscoveredJob,
  type JobSearchCountry,
  type JobSearchResult,
  type JobSearchStatus,
} from "@/lib/jobs/discovery.functions";

export const Route = createFileRoute("/discover")({ component: DiscoverJobsPage });

const COUNTRY_LABELS: Record<JobSearchCountry, string> = {
  us: "United States",
  gb: "United Kingdom",
  ca: "Canada",
  au: "Australia",
  nz: "New Zealand",
  de: "Germany",
  fr: "France",
  nl: "Netherlands",
  at: "Austria",
  pl: "Poland",
  br: "Brazil",
  in: "India",
  sg: "Singapore",
  za: "South Africa",
};

function DiscoverJobsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState<JobSearchCountry>("us");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [result, setResult] = useState<JobSearchResult | null>(null);
  const [status, setStatus] = useState<JobSearchStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, navigate, user]);

  useEffect(() => {
    if (!user) return;
    void getJobSearchStatus().then(setStatus).catch(() => setStatus(null));
    void supabase
      .from("jobs")
      .select("source_url")
      .eq("created_by", user.id)
      .not("source_url", "is", null)
      .then(({ data }) => setSavedUrls(new Set((data ?? []).map((row) => row.source_url).filter((value): value is string => Boolean(value)))));
  }, [user]);

  const sourcesAvailable = useMemo(() => {
    if (!status) return "Checking search providers…";
    return status.adzunaConfigured
      ? "Adzuna search + public fallback are ready."
      : "Public fallback search is ready. Add Adzuna credentials for broader coverage.";
  }, [status]);

  async function runSearch(page = 1) {
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const next = await searchJobs({
        data: {
          query: query.trim(),
          location: location.trim(),
          country,
          remoteOnly,
          page,
        },
      });
      setResult(next);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Job search failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveJob(job: DiscoveredJob) {
    if (!user) return;
    setSaving(job.externalId);
    setError(null);
    setMessage(null);
    const detection = detectAts(job.sourceUrl);
    const { error: saveError } = await supabase.from("jobs").insert({
      created_by: user.id,
      title: job.title,
      company: job.company,
      location: job.location,
      work_arrangement: job.remote ? "remote" : null,
      salary_min: job.salaryMin == null ? null : Math.max(0, Math.round(job.salaryMin)),
      salary_max: job.salaryMax == null ? null : Math.max(0, Math.round(job.salaryMax)),
      currency: job.currency,
      source_url: job.sourceUrl,
      ats_name: detection.provider === "unknown" ? null : detection.provider,
      description: job.description,
      posted_at: job.postedAt ? job.postedAt.slice(0, 10) : null,
    });
    if (saveError) {
      if (saveError.code === "23505") {
        setSavedUrls((current) => new Set(current).add(job.sourceUrl));
        setMessage("That job is already in your saved workspace.");
      } else {
        setError(saveError.message);
      }
    } else {
      setSavedUrls((current) => new Set(current).add(job.sourceUrl));
      setMessage(`${job.title} at ${job.company} was saved.`);
    }
    setSaving(null);
  }

  if (loading || !user) return <main style={pageStyle}>Loading job discovery…</main>;

  return (
    <main style={pageStyle}>
      <div style={headingRow}>
        <div>
          <p style={eyebrow}>JOB DISCOVERY</p>
          <h1 style={titleStyle}>Find jobs without rebuilding your search every day.</h1>
          <p style={introStyle}>Search multiple job sources, review the listing, then save the opportunity directly into your private 357 Network application workflow.</p>
        </div>
        <a href="/jobs" style={secondaryLink}>Saved jobs</a>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void runSearch(1);
        }}
        style={searchPanel}
      >
        <label style={fieldStyle}>
          <span style={labelStyle}>Role or keywords</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. audio engineer, sales director" style={inputStyle} required minLength={2} />
        </label>
        <label style={fieldStyle}>
          <span style={labelStyle}>Location</span>
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, state, region, or Remote" style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span style={labelStyle}>Country</span>
          <select value={country} onChange={(event) => setCountry(event.target.value as JobSearchCountry)} style={inputStyle}>
            {JOB_SEARCH_COUNTRIES.map((value) => <option key={value} value={value}>{COUNTRY_LABELS[value]}</option>)}
          </select>
        </label>
        <label style={remoteLabel}>
          <input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} />
          Remote only
        </label>
        <button type="submit" disabled={busy || query.trim().length < 2} style={primaryButton}>
          {busy ? "Searching…" : "Search jobs"}
        </button>
        <small style={{ color: "#6b7280", gridColumn: "1 / -1" }}>{sourcesAvailable}</small>
      </form>

      {message ? <p style={successStyle}>{message}</p> : null}
      {error ? <p role="alert" style={errorStyle}>{error}</p> : null}

      {result ? (
        <>
          <section style={sourceStrip} aria-label="Search source status">
            {result.sources.map((source) => (
              <div key={source.source} style={{ ...sourceChip, borderColor: source.ok ? "#bbf7d0" : "#fde68a", background: source.ok ? "#f0fdf4" : "#fffbeb" }}>
                <strong>{source.source === "adzuna" ? "Adzuna" : "Public fallback"}</strong>
                <span>{source.note}</span>
              </div>
            ))}
          </section>

          <div style={resultHeader}>
            <div><strong>{result.jobs.length}</strong> results on page {result.page}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" disabled={busy || result.page <= 1} onClick={() => void runSearch(result.page - 1)} style={smallButton}>Previous</button>
              <button type="button" disabled={busy || !result.hasMore} onClick={() => void runSearch(result.page + 1)} style={smallButton}>Next</button>
            </div>
          </div>

          <section style={resultsGrid}>
            {result.jobs.length === 0 ? (
              <div style={emptyState}>
                <strong>No matching jobs on this page.</strong>
                <span>Try a broader role, remove the location, or move to the next page.</span>
              </div>
            ) : result.jobs.map((job) => {
              const alreadySaved = savedUrls.has(job.sourceUrl);
              return (
                <article key={job.externalId} style={cardStyle}>
                  <div style={cardTop}>
                    <div>
                      <div style={sourceLabel}>{job.source === "adzuna" ? "ADZUNA" : "PUBLIC JOB BOARD"}</div>
                      <h2 style={jobTitleStyle}>{job.title}</h2>
                      <p style={companyStyle}>{job.company}{job.location ? ` · ${job.location}` : ""}</p>
                    </div>
                    {job.remote ? <span style={remoteBadge}>Remote</span> : null}
                  </div>
                  {job.salaryMin != null || job.salaryMax != null ? (
                    <div style={salaryStyle}>{formatSalary(job)}</div>
                  ) : null}
                  {job.tags.length ? <div style={tagRow}>{job.tags.slice(0, 5).map((tag) => <span key={tag} style={tagStyle}>{tag}</span>)}</div> : null}
                  {job.description ? <p style={descriptionStyle}>{job.description}</p> : null}
                  <div style={cardActions}>
                    <a href={job.sourceUrl} target="_blank" rel="noreferrer" style={secondaryLink}>Open listing</a>
                    <button type="button" disabled={alreadySaved || saving === job.externalId} onClick={() => void saveJob(job)} style={{ ...primaryButton, opacity: alreadySaved ? 0.55 : 1 }}>
                      {alreadySaved ? "Saved" : saving === job.externalId ? "Saving…" : "Save to 357 Network"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      ) : (
        <section style={emptyState}>
          <strong>Search your next opportunity.</strong>
          <span>Results can be saved directly into the same preparation, document, tracking, and verified-submission workflow.</span>
        </section>
      )}
    </main>
  );
}

function formatSalary(job: DiscoveredJob) {
  const format = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  const prefix = job.currency ? `${job.currency} ` : "";
  if (job.salaryMin != null && job.salaryMax != null) return `${prefix}${format(job.salaryMin)}–${format(job.salaryMax)}`;
  if (job.salaryMin != null) return `${prefix}${format(job.salaryMin)}+`;
  if (job.salaryMax != null) return `Up to ${prefix}${format(job.salaryMax)}`;
  return "";
}

const pageStyle: React.CSSProperties = { maxWidth: 1120, margin: "0 auto", padding: "44px 24px 80px", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" };
const headingRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", flexWrap: "wrap" };
const eyebrow: React.CSSProperties = { margin: "0 0 8px", color: "#6b7280", fontWeight: 800, fontSize: 12, letterSpacing: ".14em" };
const titleStyle: React.CSSProperties = { margin: 0, maxWidth: 760, fontSize: "clamp(32px,5vw,52px)", lineHeight: 1.05, letterSpacing: "-.03em" };
const introStyle: React.CSSProperties = { maxWidth: 760, color: "#4b5563", fontSize: 18, lineHeight: 1.65 };
const searchPanel: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(220px,2fr) minmax(180px,1.2fr) minmax(160px,.8fr)", gap: 12, alignItems: "end", margin: "30px 0", padding: 20, border: "1px solid #e5e7eb", borderRadius: 16, background: "#fafafa", boxShadow: "0 10px 35px rgba(17,24,39,.05)" };
const fieldStyle: React.CSSProperties = { display: "grid", gap: 6, minWidth: 0 };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700 };
const inputStyle: React.CSSProperties = { width: "100%", minWidth: 0, boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 10, padding: "11px 12px", background: "white", fontSize: 15 };
const remoteLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 650, paddingBottom: 10 };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 10, padding: "11px 14px", background: "#111827", color: "white", cursor: "pointer", fontWeight: 750 };
const secondaryLink: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 13px", color: "#111827", textDecoration: "none", background: "white", fontWeight: 700 };
const smallButton: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, background: "white", padding: "7px 10px", cursor: "pointer" };
const sourceStrip: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10, margin: "0 0 20px" };
const sourceChip: React.CSSProperties = { display: "grid", gap: 4, border: "1px solid", borderRadius: 10, padding: 12, color: "#374151", fontSize: 13 };
const resultHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", margin: "18px 0" };
const resultsGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 };
const cardStyle: React.CSSProperties = { display: "grid", gap: 13, border: "1px solid #e5e7eb", borderRadius: 16, padding: 20, background: "white", boxShadow: "0 10px 32px rgba(17,24,39,.055)" };
const cardTop: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 };
const sourceLabel: React.CSSProperties = { color: "#6b7280", fontSize: 10, fontWeight: 900, letterSpacing: ".12em" };
const jobTitleStyle: React.CSSProperties = { margin: "7px 0 3px", fontSize: 21, lineHeight: 1.22 };
const companyStyle: React.CSSProperties = { margin: 0, color: "#4b5563", lineHeight: 1.5 };
const remoteBadge: React.CSSProperties = { borderRadius: 999, background: "#ecfdf5", color: "#047857", padding: "5px 8px", fontSize: 12, fontWeight: 750, whiteSpace: "nowrap" };
const salaryStyle: React.CSSProperties = { fontWeight: 750, color: "#111827" };
const tagRow: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap" };
const tagStyle: React.CSSProperties = { borderRadius: 999, background: "#f3f4f6", padding: "4px 7px", fontSize: 11, color: "#4b5563" };
const descriptionStyle: React.CSSProperties = { margin: 0, color: "#4b5563", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" };
const cardActions: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: "auto" };
const emptyState: React.CSSProperties = { display: "grid", gap: 7, placeItems: "center", textAlign: "center", padding: "46px 24px", border: "1px dashed #d1d5db", borderRadius: 16, color: "#6b7280" };
const successStyle: React.CSSProperties = { color: "#047857", border: "1px solid #bbf7d0", background: "#f0fdf4", borderRadius: 10, padding: 12 };
const errorStyle: React.CSSProperties = { color: "#b91c1c", border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 10, padding: 12 };
