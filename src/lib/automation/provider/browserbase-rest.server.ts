import { detectAts } from "../ats-detect";
import { isSensitiveLabel } from "../live-fields";
import { findConfirmation } from "./browserbase-dom";
import type { BrowserAutomationProvider, ProviderBlocker, ProviderEvidence, ProviderFillInput, ProviderFillResult, ProviderInspectResult, ProviderSession, ProviderSubmitResult, ProviderVerifyResult } from "./contract";

export interface ProviderOwner { userId: string }
type PublicField = ProviderInspectResult["fields"][number];
type InspectionField = PublicField & { selector: string };
type Config = { apiKey: string; projectId: string | null; modelApiKey: string; modelName: string; submitEnabled: boolean };
type SessionState = { pageUrl: string; submitted: boolean; fields: InspectionField[] };
const STAGEHAND = "https://api.stagehand.browserbase.com/v1";
const BROWSERBASE = "https://api.browserbase.com/v1";

export function readBrowserbaseRestConfig(): Config {
  const apiKey = process.env["BROWSERBASE_API_KEY"]?.trim() ?? "";
  const projectId = process.env["BROWSERBASE_PROJECT_ID"]?.trim() || null;
  const modelApiKey = process.env["MODEL_API_KEY"]?.trim() || process.env["OPENAI_API_KEY"]?.trim() || "";
  if (!apiKey) throw new Error("BROWSERBASE_API_KEY is not configured.");
  if (!modelApiKey) throw new Error("MODEL_API_KEY or OPENAI_API_KEY is required for Browserbase Stagehand.");
  return {
    apiKey,
    projectId,
    modelApiKey,
    modelName: process.env["STAGEHAND_MODEL"]?.trim() || "openai/gpt-5.4-mini",
    submitEnabled: process.env["AUTOMATION_ENABLE_SUBMIT"] === "true",
  };
}

export function createBrowserbaseRestProvider(owner: ProviderOwner, config = readBrowserbaseRestConfig()): BrowserAutomationProvider {
  const sessions = new Map<string, SessionState>();
  const state = (session: ProviderSession) => { const value = sessions.get(session.sessionId); if (!value) throw new Error("Browser session is unavailable."); return value; };
  return {
    name: "browserbase-stagehand-rest",
    async openSession(targetUrl) {
      if (detectAts(targetUrl).provider === "unknown") throw new Error("Unsupported or untrusted ATS URL.");
      const start = await request<{ sessionId?: string }>(config, "/sessions/start", { modelName: config.modelName, browser: { type: "browserbase" }, selfHeal: true, verbose: 0 });
      const sessionId = start.sessionId?.trim();
      if (!sessionId) throw new Error("Browserbase did not return a session ID.");
      try { await request(config, `/sessions/${encodeURIComponent(sessionId)}/navigate`, { url: targetUrl }); }
      catch (error) { await end(config, sessionId).catch(() => undefined); throw error; }
      sessions.set(sessionId, { pageUrl: targetUrl, submitted: false, fields: [] });
      return { sessionId, pageUrl: targetUrl };
    },
    async inspect(session) {
      const current = state(session);
      const result = await request<{ formFound?: boolean; captcha?: boolean; authWall?: boolean; fields?: Array<{ key?: string; label?: string; selector?: string; required?: boolean; sensitive?: boolean; kind?: string }> }>(config, `/sessions/${encodeURIComponent(session.sessionId)}/extract`, { instruction: "Inspect only the visible job application. Return stable selector, label, required, kind for every form control; report captcha and authentication walls. Do not interact.", schema: INSPECTION_SCHEMA });
      const blockers: ProviderBlocker[] = [];
      if (result.captcha) blockers.push(block("captcha_or_bot_check", "CAPTCHA or bot protection requires manual action."));
      if (result.authWall) blockers.push(block("authentication_required", "Employer authentication requires manual action."));
      current.fields = normalize(result.fields ?? []);
      if (!result.formFound || !current.fields.length) blockers.push(block("unsupported_widget", "No supported application form was found."));
      return { fields: current.fields.map(({ selector: _selector, ...field }) => field), blockers };
    },
    async fill(session, values) {
      const current = state(session); const byKey = new Map(current.fields.map((field) => [field.key, field]));
      const filled: string[] = []; const failed: ProviderFillResult["failed"] = []; const blockers: ProviderBlocker[] = [];
      for (const input of values) {
        const field = byKey.get(input.key); if (!field) { failed.push({ key: input.key, reason: "Live field selector is unavailable." }); continue; }
        try {
          if (input.value.type === "private_file") { const remote = await upload(config, owner, session.sessionId, input); await act(config, session.sessionId, field.selector, "setInputFiles", [remote]); }
          else await fillValue(config, session.sessionId, field, input.value.text);
          filled.push(input.key);
        } catch (error) { const reason = error instanceof Error ? error.message : "Field fill failed."; if (input.value.type === "private_file") blockers.push(block("file_upload_failed", reason, input.key)); else failed.push({ key: input.key, reason }); }
      }
      return { filled, failed, blockers };
    },
    async submit(session): Promise<ProviderSubmitResult> {
      const current = state(session);
      if (!config.submitEnabled) return { submitted: false, blockers: [block("provider_unavailable", "Final submit is disabled. No application was sent.")] };
      const observed = await request<Array<{ selector?: string; description?: string; method?: string; arguments?: string[] }>>(config, `/sessions/${encodeURIComponent(session.sessionId)}/observe`, { instruction: "Identify only the single final control that submits this job application to the employer. Do not click it." });
      const candidates = observed.filter((item) => item.selector && (!item.method || item.method === "click") && /submit|apply|send|complete/i.test(item.description ?? ""));
      if (candidates.length !== 1 || !candidates[0]?.selector) return { submitted: false, blockers: [block("unsupported_widget", "Final submit control was not unambiguously identified.")] };
      await act(config, session.sessionId, candidates[0].selector, "click", []); current.submitted = true; return { submitted: true, blockers: [] };
    },
    async verify(session): Promise<ProviderVerifyResult> {
      const current = state(session); if (!current.submitted) return { verified: false, confirmationText: null, confirmationUrl: null, blockers: [block("verification_failed", "Nothing was submitted.")] };
      const result = await request<{ visibleText?: string; currentUrl?: string }>(config, `/sessions/${encodeURIComponent(session.sessionId)}/extract`, { instruction: "Return visible page text verbatim and current URL after submission. Do not infer confirmation.", schema: VERIFY_SCHEMA });
      const url = result.currentUrl?.trim() || current.pageUrl; current.pageUrl = url; const confirmation = findConfirmation(result.visibleText ?? "", url);
      return confirmation ? { verified: true, confirmationText: confirmation, confirmationUrl: url, blockers: [] } : { verified: false, confirmationText: null, confirmationUrl: null, blockers: [block("verification_failed", "No concrete submission confirmation was found.")] };
    },
    async captureEvidence(session): Promise<ProviderEvidence> { const current = state(session); return { screenshotPath: null, pageUrl: current.pageUrl, capturedAt: new Date().toISOString(), browserbaseSessionId: session.sessionId, recordingUrl: `https://www.browserbase.com/sessions/${session.sessionId}` }; },
    async closeSession(session) { sessions.delete(session.sessionId); await end(config, session.sessionId).catch(() => undefined); },
  };
}

export async function verifyBrowserbaseRestHealth(): Promise<boolean> { let id: string | null = null; try { const config = readBrowserbaseRestConfig(); const start = await request<{ sessionId?: string }>(config, "/sessions/start", { modelName: config.modelName, browser: { type: "browserbase" }, verbose: 0 }); id = start.sessionId?.trim() || null; if (id) await end(config, id); return Boolean(id); } catch { return false; } }

async function fillValue(config: Config, id: string, field: InspectionField, value: string) { const kind = field.kind.toLowerCase(); if (kind === "radio") throw new Error("Radio questions require manual confirmation."); if (kind === "checkbox") { const yes = ["yes","true","1","on","checked"].includes(value.trim().toLowerCase()); const no = ["no","false","0","off","unchecked"].includes(value.trim().toLowerCase()); if (!yes && !no) throw new Error("Checkbox requires explicit yes/no."); await act(config,id,field.selector,yes?"check":"uncheck",[]); return; } await act(config,id,field.selector,kind === "select" ? "selectOption" : "fill",[value]); }
async function act(config: Config, id: string, selector: string, method: string, args: string[]) { await request(config, `/sessions/${encodeURIComponent(id)}/act`, { input: { selector, description: "Deterministic application field action", method, arguments: args } }); }
async function upload(config: Config, owner: ProviderOwner, id: string, input: Extract<ProviderFillInput,{ value: { type: "private_file" } }> | ProviderFillInput) { if (input.value.type !== "private_file") throw new Error("Expected private file."); const { supabaseAdmin } = await import("@/integrations/supabase/client.server"); const { data: doc } = await supabaseAdmin.from("documents").select("storage_path,name,mime_type").eq("id",input.value.documentId).eq("user_id",owner.userId).maybeSingle(); if (!doc?.storage_path) throw new Error("Private document is unavailable."); const { data: file } = await supabaseAdmin.storage.from("candidate-documents").download(doc.storage_path); if (!file) throw new Error("Private document could not be read."); const name=(doc.name||input.value.fileName||"document.pdf").replace(/[^\w.-]+/g,"_"); const form=new FormData(); form.append("file",new Blob([await file.arrayBuffer()],{type:doc.mime_type||input.value.mimeType||"application/octet-stream"}),name); const response=await fetch(`${BROWSERBASE}/sessions/${encodeURIComponent(id)}/uploads`,{method:"POST",headers:{"x-bb-api-key":config.apiKey},body:form}); if(!response.ok) throw new Error(`Browserbase upload failed (${response.status}).`); return `/tmp/.uploads/${name}`; }
async function end(config: Config,id:string){ await request(config,`/sessions/${encodeURIComponent(id)}/end`,{}); }
async function request<T=Record<string,unknown>>(config:Config,path:string,body:unknown):Promise<T>{
  const headers: Record<string,string> = {"content-type":"application/json","x-bb-api-key":config.apiKey,"x-model-api-key":config.modelApiKey,"x-language":"typescript","x-sdk-version":"357network-stagehand-rest-1"};
  if (config.projectId) headers["x-bb-project-id"] = config.projectId;
  const response=await fetch(`${STAGEHAND}${path}`,{method:"POST",headers,body:JSON.stringify(body)});
  const text=await response.text(); if(!response.ok) throw new Error(`Browserbase Stagehand failed (${response.status}).`);
  const parsed=text?JSON.parse(text) as {success?:boolean;data?:T}:{}; if(parsed.success===false) throw new Error("Browserbase Stagehand operation failed."); return (parsed.data??parsed) as T;
}
function normalize(raw:Array<{key?:string;label?:string;selector?:string;required?:boolean;sensitive?:boolean;kind?:string}>):InspectionField[]{ const seen=new Set<string>(); return raw.flatMap((item,index)=>{const selector=item.selector?.trim()||""; const label=item.label?.trim()||`Field ${index+1}`; const key=item.key?.trim()||selector||`field_${index+1}`; if(!selector||seen.has(key)) return []; seen.add(key); return [{key,label,selector,required:Boolean(item.required),sensitive:Boolean(item.sensitive)||isSensitiveLabel(label),kind:item.kind?.trim()||"text"}];}); }
function block(kind:ProviderBlocker["kind"],message:string,fieldKey?:string):ProviderBlocker{return fieldKey?{kind,message,fieldKey}:{kind,message};}
const INSPECTION_SCHEMA={type:"object",required:["formFound","captcha","authWall","fields"],properties:{formFound:{type:"boolean"},captcha:{type:"boolean"},authWall:{type:"boolean"},fields:{type:"array",items:{type:"object",required:["key","label","selector","required","kind"],properties:{key:{type:"string"},label:{type:"string"},selector:{type:"string"},required:{type:"boolean"},sensitive:{type:"boolean"},kind:{type:"string"}}}}}};
const VERIFY_SCHEMA={type:"object",required:["visibleText","currentUrl"],properties:{visibleText:{type:"string"},currentUrl:{type:"string"}}};