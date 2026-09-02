import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

type ExtendedProfile = {
  full_name: string; headline: string | null; email: string | null; phone: string | null; location: string | null;
  address_line1: string | null; address_line2: string | null; city: string | null; region: string | null; postal_code: string | null; country: string | null;
  years_experience: number | null; skills: string[]; work_authorization: string | null;
  career_summary: string | null; experience_highlights: string | null; education: string | null; certifications: string | null; languages: string | null;
  linkedin_url: string | null; github_url: string | null; website_url: string | null;
};
type FormState = {
  full_name: string; headline: string; email: string; phone: string; location: string;
  address_line1: string; address_line2: string; city: string; region: string; postal_code: string; country: string;
  years_experience: string; skills: string; work_authorization: string;
  career_summary: string; experience_highlights: string; education: string; certifications: string; languages: string;
  linkedin_url: string; github_url: string; website_url: string;
};
const EMPTY: FormState = {
  full_name: "", headline: "", email: "", phone: "", location: "", address_line1: "", address_line2: "", city: "", region: "", postal_code: "", country: "",
  years_experience: "", skills: "", work_authorization: "", career_summary: "", experience_highlights: "", education: "", certifications: "", languages: "",
  linkedin_url: "", github_url: "", website_url: "",
};

function ProfilePage() {
  const navigate = useNavigate(); const { user, loading } = useAuth(); const [form, setForm] = useState<FormState>(EMPTY); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!loading && !user) void navigate({ to: "/auth", replace: true }); }, [loading, user, navigate]);
  const load = useCallback(async () => {
    if (!user) return; const { data, error: loadError } = await supabase.from("candidate_profiles").select("*").eq("user_id", user.id).maybeSingle(); if (loadError) { setError(loadError.message); return; } if (!data) return; const p = data as unknown as ExtendedProfile;
    setForm({ full_name:p.full_name??"",headline:p.headline??"",email:p.email??"",phone:p.phone??"",location:p.location??"",address_line1:p.address_line1??"",address_line2:p.address_line2??"",city:p.city??"",region:p.region??"",postal_code:p.postal_code??"",country:p.country??"",years_experience:p.years_experience==null?"":String(p.years_experience),skills:(p.skills??[]).join(", "),work_authorization:p.work_authorization??"",career_summary:p.career_summary??"",experience_highlights:p.experience_highlights??"",education:p.education??"",certifications:p.certifications??"",languages:p.languages??"",linkedin_url:p.linkedin_url??"",github_url:p.github_url??"",website_url:p.website_url??"" });
  }, [user]); useEffect(() => { void load(); }, [load]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!user) return; setBusy(true); setMessage(null); setError(null); const years=form.years_experience.trim(); const yearsExperience=years?Number(years):null; if(yearsExperience!==null&&(!Number.isFinite(yearsExperience)||yearsExperience<0)){setError("Years of experience must be a non-negative number.");setBusy(false);return;}
    const values={user_id:user.id,full_name:form.full_name.trim(),headline:nullable(form.headline),email:nullable(form.email),phone:nullable(form.phone),location:nullable(form.location),address_line1:nullable(form.address_line1),address_line2:nullable(form.address_line2),city:nullable(form.city),region:nullable(form.region),postal_code:nullable(form.postal_code),country:nullable(form.country),years_experience:yearsExperience,skills:csv(form.skills),work_authorization:nullable(form.work_authorization),career_summary:nullable(form.career_summary),experience_highlights:nullable(form.experience_highlights),education:nullable(form.education),certifications:nullable(form.certifications),languages:nullable(form.languages),linkedin_url:nullable(form.linkedin_url),github_url:nullable(form.github_url),website_url:nullable(form.website_url)};
    const {error:saveError}=await supabase.from("candidate_profiles").upsert(values as never,{onConflict:"user_id"}); if(saveError){setError(saveError.message);setBusy(false);return;}
    const syncError=await syncStructuredAnswers(user.id,form); if(syncError){setError(`Profile saved, but application-field synchronization failed: ${syncError}`);}else setMessage("Profile saved. These facts are now available for tailoring and supported application forms."); setBusy(false);
  }
  if(loading||!user)return <main style={pageStyle}>Loading profile…</main>;
  return <main style={pageStyle}><Nav/><h1 style={{fontSize:34,marginBottom:8}}>Candidate Profile</h1><p style={{color:"#4b5563"}}>Keep reusable, user-owned facts in one private profile. 357Network never invents missing application answers.</p><form onSubmit={save} style={panelStyle}>
    <h2 style={sectionHeading}>Contact & identity</h2><div style={gridStyle}><Field id="full_name" label="Full name" value={form.full_name} set={setField}/><Field id="headline" label="Professional headline" value={form.headline} set={setField}/><Field id="email" label="Contact email" type="email" value={form.email} set={setField}/><Field id="phone" label="Phone" value={form.phone} set={setField}/><Field id="location" label="Location summary" value={form.location} set={setField}/></div>
    <h2 style={sectionHeading}>Address</h2><div style={gridStyle}><Field id="address_line1" label="Street address" value={form.address_line1} set={setField}/><Field id="address_line2" label="Address line 2" value={form.address_line2} set={setField}/><Field id="city" label="City" value={form.city} set={setField}/><Field id="region" label="State / province / region" value={form.region} set={setField}/><Field id="postal_code" label="ZIP / postal code" value={form.postal_code} set={setField}/><Field id="country" label="Country" value={form.country} set={setField}/></div>
    <h2 style={sectionHeading}>Career facts</h2><div style={gridStyle}><Field id="years_experience" label="Years of experience" type="number" value={form.years_experience} set={setField}/><Field id="skills" label="Skills (comma separated)" value={form.skills} set={setField}/><Field id="languages" label="Languages" value={form.languages} set={setField}/><Field id="work_authorization" label="Work authorization" value={form.work_authorization} set={setField}/></div>
    <Area id="career_summary" label="Career summary" value={form.career_summary} set={setField} hint="A factual overview of your background. This can ground resume and cover-letter tailoring."/><Area id="experience_highlights" label="Experience highlights — one per line" value={form.experience_highlights} set={setField}/><Area id="education" label="Education — one entry per line" value={form.education} set={setField}/><Area id="certifications" label="Certifications — one per line" value={form.certifications} set={setField}/>
    <h2 style={sectionHeading}>Professional links</h2><div style={gridStyle}><Field id="linkedin_url" label="LinkedIn" type="url" value={form.linkedin_url} set={setField}/><Field id="github_url" label="GitHub" type="url" value={form.github_url} set={setField}/><Field id="website_url" label="Website / portfolio" type="url" value={form.website_url} set={setField}/></div><button disabled={busy} style={primaryButton}>{busy?"Saving…":"Save complete profile"}</button>
  </form>{message?<p style={{color:"#047857"}}>{message}</p>:null}{error?<p role="alert" style={{color:"#b91c1c"}}>{error}</p>:null}</main>;
  function setField(id:keyof FormState,value:string){setForm(prev=>({...prev,[id]:value}));}
}

async function syncStructuredAnswers(userId:string,form:FormState):Promise<string|null>{
  const canonical=[
    ["Street address",form.address_line1],["Address line 2",form.address_line2],["City",form.city],["State province region",form.region],["Postal ZIP code",form.postal_code],["Country",form.country],
  ] as const;
  const {error:deleteError}=await supabase.from("saved_answers").delete().eq("user_id",userId).contains("tags",["profile_sync"]); if(deleteError)return deleteError.message;
  const rows=canonical.filter(([,answer])=>answer.trim()).map(([question,answer])=>({user_id:userId,question,answer:answer.trim(),tags:["profile_sync","application_fact"]})); if(!rows.length)return null;
  const {error:insertError}=await supabase.from("saved_answers").insert(rows); return insertError?.message??null;
}
function nullable(value:string){const v=value.trim();return v?v:null;} function csv(value:string){return value.split(",").map(v=>v.trim()).filter(Boolean);}
function Field({id,label,value,type="text",set}:{id:keyof FormState;label:string;value:string;type?:string;set:(id:keyof FormState,value:string)=>void}){return <label style={{display:"grid",gap:6}}><span style={{fontSize:14,fontWeight:600}}>{label}</span><input id={id} type={type} value={value} onChange={e=>set(id,e.target.value)} style={inputStyle}/></label>;}
function Area({id,label,value,set,hint}:{id:keyof FormState;label:string;value:string;set:(id:keyof FormState,value:string)=>void;hint?:string}){return <label style={{display:"grid",gap:6}}><span style={{fontSize:14,fontWeight:600}}>{label}</span>{hint?<span style={{fontSize:13,color:"#6b7280"}}>{hint}</span>:null}<textarea id={id} value={value} onChange={e=>set(id,e.target.value)} rows={4} style={{...inputStyle,resize:"vertical"}}/></label>;}
function Nav(){return <nav style={{display:"flex",flexWrap:"wrap",gap:14,marginBottom:28}}><a href="/dashboard" style={navLink}>Dashboard</a><a href="/discover" style={navLink}>Discover</a><a href="/jobs" style={navLink}>Jobs</a><a href="/applications" style={navLink}>Applications</a><a href="/documents" style={navLink}>Documents</a><a href="/settings" style={navLink}>Settings</a></nav>;}
const pageStyle:React.CSSProperties={maxWidth:980,margin:"0 auto",padding:"40px 24px",fontFamily:"system-ui"}; const navLink:React.CSSProperties={color:"#1d4ed8",textDecoration:"none"}; const panelStyle:React.CSSProperties={display:"grid",gap:18,border:"1px solid #e5e7eb",borderRadius:12,padding:20,margin:"28px 0"}; const gridStyle:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}; const inputStyle:React.CSSProperties={border:"1px solid #d1d5db",borderRadius:8,padding:"11px 12px",fontSize:16}; const primaryButton:React.CSSProperties={border:0,borderRadius:8,padding:"11px 14px",background:"#111827",color:"white",cursor:"pointer",width:"fit-content"}; const sectionHeading:React.CSSProperties={fontSize:19,margin:"8px 0 0"};
