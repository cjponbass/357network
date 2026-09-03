import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Interest = {
  id: string;
  employer_user_id: string;
  candidate_user_id: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

type Employer = { user_id: string; company_name: string; recruiter_name: string | null; website_url: string | null };

export const Route = createFileRoute("/interests")({ component: CandidateInterestsPage });

function CandidateInterestsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [employers, setEmployers] = useState<Record<string, Employer>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) void navigate({ to: "/auth", replace: true }); }, [loading, navigate, user]);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    const { data, error: interestError } = await supabase
      .from("employer_interest_requests")
      .select("id,employer_user_id,candidate_user_id,message,status,created_at")
      .eq("candidate_user_id", user.id)
      .order("created_at", { ascending: false });
    if (interestError) { setError(interestError.message); return; }
    const rows = data ?? [];
    setInterests(rows);
    const ids = [...new Set(rows.map((row) => row.employer_user_id))];
    if (!ids.length) { setEmployers({}); return; }
    const { data: employerRows, error: employerError } = await supabase
      .from("employer_profiles")
      .select("user_id,company_name,recruiter_name,website_url")
      .in("user_id", ids);
    if (employerError) { setError(employerError.message); return; }
    setEmployers(Object.fromEntries((employerRows ?? []).map((row) => [row.user_id, row])));
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  async function respond(id: string, status: "accepted" | "declined") {
    if (!user) return;
    setBusy(id); setError(null); setMessage(null);
    const { error: updateError } = await supabase
      .from("employer_interest_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("candidate_user_id", user.id);
    if (updateError) setError(updateError.message);
    else { setMessage(status === "accepted" ? "Employer interest accepted." : "Employer interest declined."); await load(); }
    setBusy(null);
  }

  if (loading || !user) return <main style={page}>Loading employer interest…</main>;

  return <main style={page}>
    <h1 style={{fontSize:34,marginBottom:8}}>Employer Interest</h1>
    <p style={muted}>Employers can send a private interest request without receiving your email, phone number, documents, saved answers or application history.</p>
    {message ? <p style={success}>{message}</p> : null}
    {error ? <p role="alert" style={errorStyle}>{error}</p> : null}
    {interests.length === 0 ? <section style={panel}><p style={muted}>No employer interest requests yet.</p></section> : interests.map((interest) => {
      const employer = employers[interest.employer_user_id];
      return <article key={interest.id} style={panel}>
        <div><strong>{employer?.company_name ?? "357Network employer"}</strong>{employer?.recruiter_name ? <div style={muted}>{employer.recruiter_name}</div> : null}</div>
        <p style={{whiteSpace:"pre-wrap",margin:0}}>{interest.message}</p>
        <div style={muted}>{new Date(interest.created_at).toLocaleString()} · Status: {interest.status}</div>
        {employer?.website_url ? <a href={employer.website_url} target="_blank" rel="noreferrer">Company website</a> : null}
        {interest.status === "pending" ? <div style={buttons}><button disabled={busy===interest.id} onClick={()=>void respond(interest.id,"accepted")} style={primary}>Accept interest</button><button disabled={busy===interest.id} onClick={()=>void respond(interest.id,"declined")} style={secondary}>Decline</button></div> : null}
      </article>;
    })}
  </main>;
}

const page:React.CSSProperties={maxWidth:900,margin:"0 auto",padding:"40px 24px",fontFamily:"system-ui"};
const muted:React.CSSProperties={color:"#6b7280"};
const panel:React.CSSProperties={display:"grid",gap:14,border:"1px solid #e5e7eb",borderRadius:12,padding:20,margin:"18px 0",background:"white"};
const buttons:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap"};
const primary:React.CSSProperties={border:0,borderRadius:8,padding:"10px 13px",background:"#111827",color:"white",cursor:"pointer"};
const secondary:React.CSSProperties={...primary,background:"#e5e7eb",color:"#111827"};
const errorStyle:React.CSSProperties={color:"#b91c1c",border:"1px solid #fecaca",background:"#fef2f2",padding:12,borderRadius:8};
const success:React.CSSProperties={color:"#047857",border:"1px solid #bbf7d0",background:"#f0fdf4",padding:12,borderRadius:8};
