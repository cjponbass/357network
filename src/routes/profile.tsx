import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { CandidateProfileUpdate } from "@/lib/domain-types";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

type FormState = {
  full_name: string; headline: string; email: string; phone: string; location: string;
  years_experience: string; skills: string; work_authorization: string;
  linkedin_url: string; github_url: string; website_url: string;
};

const EMPTY: FormState = {
  full_name: "", headline: "", email: "", phone: "", location: "", years_experience: "",
  skills: "", work_authorization: "", linkedin_url: "", github_url: "", website_url: "",
};

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error: loadError } = await supabase.from("candidate_profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (loadError) { setError(loadError.message); return; }
    if (!data) return;
    setForm({
      full_name: data.full_name ?? "", headline: data.headline ?? "", email: data.email ?? "", phone: data.phone ?? "",
      location: data.location ?? "", years_experience: data.years_experience == null ? "" : String(data.years_experience),
      skills: (data.skills ?? []).join(", "), work_authorization: data.work_authorization ?? "", linkedin_url: data.linkedin_url ?? "",
      github_url: data.github_url ?? "", website_url: data.website_url ?? "",
    });
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true); setMessage(null); setError(null);
    const years = form.years_experience.trim();
    const values: CandidateProfileUpdate = {
      full_name: form.full_name.trim(), headline: nullable(form.headline), email: nullable(form.email), phone: nullable(form.phone),
      location: nullable(form.location), years_experience: years ? Number(years) : null,
      skills: form.skills.split(",").map((v) => v.trim()).filter(Boolean), work_authorization: nullable(form.work_authorization),
      linkedin_url: nullable(form.linkedin_url), github_url: nullable(form.github_url), website_url: nullable(form.website_url),
    };
    const { error: saveError } = await supabase.from("candidate_profiles").upsert({ user_id: user.id, ...values }, { onConflict: "user_id" });
    if (saveError) setError(saveError.message); else setMessage("Profile saved.");
    setBusy(false);
  }

  if (loading || !user) return <main style={pageStyle}>Loading profile…</main>;

  return <main style={pageStyle}>
    <Nav />
    <h1 style={{ fontSize: 34, marginBottom: 8 }}>Candidate Profile</h1>
    <p style={{ color: "#4b5563" }}>Keep the reusable facts that job applications ask for in one private profile.</p>
    <form onSubmit={save} style={panelStyle}>
      <div style={gridStyle}>
        <Field id="full_name" label="Full name" value={form.full_name} set={setField} />
        <Field id="headline" label="Headline" value={form.headline} set={setField} />
        <Field id="email" label="Contact email" type="email" value={form.email} set={setField} />
        <Field id="phone" label="Phone" value={form.phone} set={setField} />
        <Field id="location" label="Location" value={form.location} set={setField} />
        <Field id="years_experience" label="Years of experience" type="number" value={form.years_experience} set={setField} />
        <Field id="skills" label="Skills (comma separated)" value={form.skills} set={setField} />
        <Field id="work_authorization" label="Work authorization" value={form.work_authorization} set={setField} />
        <Field id="linkedin_url" label="LinkedIn" value={form.linkedin_url} set={setField} />
        <Field id="github_url" label="GitHub" value={form.github_url} set={setField} />
        <Field id="website_url" label="Website" value={form.website_url} set={setField} />
      </div>
      <button disabled={busy} style={primaryButton}>{busy ? "Saving…" : "Save profile"}</button>
    </form>
    {message ? <p style={{ color: "#047857" }}>{message}</p> : null}
    {error ? <p role="alert" style={{ color: "#b91c1c" }}>{error}</p> : null}
  </main>;

  function setField(id: keyof FormState, value: string) { setForm((prev) => ({ ...prev, [id]: value })); }
}

function nullable(value: string) { const v = value.trim(); return v ? v : null; }

function Field({ id, label, value, type = "text", set }: { id: keyof FormState; label: string; value: string; type?: string; set: (id: keyof FormState, value: string) => void }) {
  return <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span><input id={id} type={type} value={value} onChange={(e) => set(id, e.target.value)} style={inputStyle} /></label>;
}

function Nav() { return <nav style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 28 }}><a href="/dashboard" style={navLink}>Dashboard</a><a href="/jobs" style={navLink}>Jobs</a><a href="/applications" style={navLink}>Applications</a><a href="/documents" style={navLink}>Documents</a><a href="/settings" style={navLink}>Settings</a></nav>; }

const pageStyle: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui" };
const navLink: React.CSSProperties = { color: "#1d4ed8", textDecoration: "none" };
const panelStyle: React.CSSProperties = { display: "grid", gap: 18, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, margin: "28px 0" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 };
const inputStyle: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "11px 12px", fontSize: 16 };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 8, padding: "11px 14px", background: "#111827", color: "white", cursor: "pointer", width: "fit-content" };
