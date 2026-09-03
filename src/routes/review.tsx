import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { cancelReview, listReviewQueue, type ReviewItem } from "@/lib/automation/parity.functions";

export const Route=createFileRoute("/review")({component:ReviewPage});
function ReviewPage(){
  const navigate=useNavigate();const{user,loading}=useAuth();const[items,setItems]=useState<ReviewItem[]>([]);const[error,setError]=useState<string|null>(null);
  useEffect(()=>{if(!loading&&!user)void navigate({to:"/auth",replace:true});},[loading,user,navigate]);
  const load=useCallback(async()=>{if(!user)return;try{setItems(await listReviewQueue());setError(null);}catch(e){setError(e instanceof Error?e.message:"Could not load review queue.");}},[user]);
  useEffect(()=>{void load();},[load]);
  async function remove(applicationId:string){try{await cancelReview({data:{applicationId}});await load();}catch(e){setError(e instanceof Error?e.message:"Could not cancel review item.");}}
  if(loading||!user)return <main style={page}>Loading review queue…</main>;
  return <main style={page}><nav style={nav}><a href="/dashboard">Dashboard</a><a href="/applications">Applications</a><a href="/settings">Settings</a></nav><h1>Review Queue</h1><p style={muted}>Manual Review Mode keeps applications here until you inspect documents/questions and intentionally continue. Nothing in this queue is submitted automatically.</p>{error?<p role="alert" style={{color:"#b91c1c"}}>{error}</p>:null}<section style={{display:"grid",gap:12}}>{items.length===0?<p style={muted}>No applications are waiting for review.</p>:items.map(item=><article key={item.applicationId} style={card}><div><strong>{item.jobTitle}</strong><div style={muted}>{item.company} · {item.reviewType.replaceAll("_"," ")}</div><small style={muted}>{new Date(item.createdAt).toLocaleString()}</small></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><a href={`/applications/${item.applicationId}`} style={button}>Open & review</a><button type="button" onClick={()=>void remove(item.applicationId)} style={secondary}>Cancel</button></div></article>)}</section></main>;
}
const page:React.CSSProperties={maxWidth:980,margin:"0 auto",padding:"40px 24px",fontFamily:"system-ui"};const nav:React.CSSProperties={display:"flex",gap:14,marginBottom:26};const muted:React.CSSProperties={color:"#6b7280"};const card:React.CSSProperties={border:"1px solid #e5e7eb",borderRadius:12,padding:18,display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"};const button:React.CSSProperties={background:"#111827",color:"white",padding:"9px 12px",borderRadius:8,textDecoration:"none",fontWeight:700};const secondary:React.CSSProperties={border:"1px solid #d1d5db",background:"white",padding:"9px 12px",borderRadius:8,cursor:"pointer"};
