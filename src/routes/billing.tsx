import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { createBillingPortal, getBillingStatus, type BillingStatus } from "@/lib/billing/billing.functions";
import { PLAN_LABELS } from "@/lib/billing/plans";

export const Route = createFileRoute("/billing")({ component: BillingPage });

function BillingPage(){
  const navigate=useNavigate(); const {user,loading}=useAuth(); const [status,setStatus]=useState<BillingStatus|null>(null); const [error,setError]=useState<string|null>(null); const [busy,setBusy]=useState(false);
  useEffect(()=>{if(!loading&&!user)void navigate({to:"/auth",replace:true});},[loading,user,navigate]);
  useEffect(()=>{if(user)void getBillingStatus().then(setStatus).catch(e=>setError(e instanceof Error?e.message:"Could not load billing."));},[user]);
  async function portal(){setBusy(true);setError(null);try{const {url}=await createBillingPortal();window.location.assign(url);}catch(e){setError(e instanceof Error?e.message:"Could not open billing portal.");}finally{setBusy(false);}}
  if(loading||!user)return <main style={page}>Loading billing…</main>;
  const plan=status?.plan?PLAN_LABELS[status.plan]:"No active plan";
  return <main style={page}><h1>Billing</h1><p style={muted}>Manage your 357Network subscription and 5-day trial.</p><section style={panel}><div><strong>Plan</strong><div>{plan}</div></div><div><strong>Status</strong><div>{status?.status??"Not subscribed"}</div></div>{status?.trialEndsAt?<div><strong>Trial ends</strong><div>{new Date(status.trialEndsAt).toLocaleString()}</div></div>:null}{status?.currentPeriodEnd?<div><strong>Current period ends</strong><div>{new Date(status.currentPeriodEnd).toLocaleString()}</div></div>:null}{status?.cancelAtPeriodEnd?<p style={{color:"#92400e"}}>This subscription is set to cancel at the end of the current period.</p>:null}<div style={{display:"flex",gap:10,flexWrap:"wrap"}}><Link to="/pricing" style={buttonLink}>Change plan</Link>{status?.active?<button onClick={()=>void portal()} disabled={busy} style={button}>{busy?"Opening…":"Manage billing in Stripe"}</button>:null}</div></section>{error?<p role="alert" style={errorStyle}>{error}</p>:null}<Link to="/settings">Back to Settings</Link></main>;
}
const page:React.CSSProperties={maxWidth:860,margin:"0 auto",padding:"40px 24px",fontFamily:"system-ui"}; const muted:React.CSSProperties={color:"#6b7280"}; const panel:React.CSSProperties={display:"grid",gap:18,border:"1px solid #e5e7eb",borderRadius:12,padding:20,margin:"24px 0"}; const button:React.CSSProperties={border:0,borderRadius:8,padding:"11px 14px",background:"#111827",color:"white",cursor:"pointer"}; const buttonLink:React.CSSProperties={...button,textDecoration:"none",display:"inline-block"}; const errorStyle:React.CSSProperties={color:"#b91c1c",border:"1px solid #fecaca",background:"#fef2f2",padding:12,borderRadius:8};
