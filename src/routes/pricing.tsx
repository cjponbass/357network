import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { createCheckout } from "@/lib/billing/billing.functions";
import { PLAN_ENTITLEMENTS, PLAN_LABELS, type CandidatePlan } from "@/lib/billing/plans";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

const copy: Record<CandidatePlan, string[]> = {
  basic: ["Private candidate profile", "Job discovery and saved jobs", "Application tracking", "Documents and saved answers", "AI job-fit analysis and fact-grounded answer help"],
  pro: ["Everything in Basic", "Tailored resume generation", "Tailored cover-letter generation", "Private PDF export", "Full professional application-preparation workflow"],
  auto: ["Everything in Pro", "Supported ATS automation", "Browser automation dry runs", "Required-question and CAPTCHA safeguards", "Verified auto-submit when the global safety gate is enabled"],
};

function PricingPage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState<CandidatePlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(plan: CandidatePlan) {
    if (!user) { window.location.assign(`/auth?plan=${plan}`); return; }
    setBusy(plan); setError(null);
    try {
      const { url } = await createCheckout({ data: { plan } });
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout could not be started.");
    } finally { setBusy(null); }
  }

  return <main style={page}>
    <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
      <p style={eyebrow}>357 NETWORK PRICING</p>
      <h1 style={{fontSize:"clamp(36px,7vw,64px)",margin:"0 0 14px"}}>5 days free. Then simple monthly pricing.</h1>
      <p style={muted}>Cancel during the trial and you will not be billed. No weekly billing and no expiring application credits.</p>
    </div>
    <section style={grid}>
      {(["basic","pro","auto"] as CandidatePlan[]).map((plan) => {
        const p=PLAN_ENTITLEMENTS[plan];
        return <article key={plan} style={{...card,...(plan==="pro"?featured:{})}}>
          <h2 style={{margin:0}}>{PLAN_LABELS[plan]}</h2>
          <div style={price}>${p.monthlyPriceUsd.toFixed(2)}<span style={{fontSize:16,fontWeight:500}}>/month</span></div>
          <strong>5-day free trial</strong>
          <ul style={{lineHeight:1.8,paddingLeft:20}}>{copy[plan].map(x=><li key={x}>{x}</li>)}</ul>
          <button onClick={()=>void choose(plan)} disabled={busy!==null} style={button}>{busy===plan?"Opening Stripe…":"Start 5-day free trial"}</button>
        </article>;
      })}
    </section>
    {error?<p role="alert" style={errorStyle}>{error}</p>:null}
    <p style={{textAlign:"center",marginTop:28}}><Link to="/" style={{color:"#111827"}}>Back to 357 Network</Link></p>
  </main>;
}
const page:React.CSSProperties={maxWidth:1180,margin:"0 auto",padding:"64px 24px",fontFamily:"system-ui",color:"#111827"};
const eyebrow:React.CSSProperties={fontSize:12,fontWeight:800,letterSpacing:".16em",color:"#6b7280"};
const muted:React.CSSProperties={color:"#6b7280",fontSize:18,lineHeight:1.6};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18,marginTop:42};
const card:React.CSSProperties={border:"1px solid #d1d5db",borderRadius:16,padding:24,display:"grid",gap:14,background:"white"};
const featured:React.CSSProperties={border:"2px solid #111827",boxShadow:"0 16px 40px rgba(0,0,0,.10)"};
const price:React.CSSProperties={fontSize:38,fontWeight:850,letterSpacing:"-.03em"};
const button:React.CSSProperties={border:0,borderRadius:9,padding:"13px 15px",background:"#111827",color:"white",fontWeight:750,cursor:"pointer"};
const errorStyle:React.CSSProperties={maxWidth:760,margin:"24px auto",padding:12,border:"1px solid #fecaca",background:"#fef2f2",color:"#b91c1c",borderRadius:8};
