import { detectAts } from "../ats-detect";
import { isSensitiveLabel } from "../live-fields";
import { findConfirmation } from "./browserbase-dom";
import type {
  BrowserAutomationProvider,
  ProviderBlocker,
  ProviderEvidence,
  ProviderFillInput,
  ProviderFillResult,
  ProviderInspectResult,
  ProviderSession,
  ProviderSubmitResult,
  ProviderVerifyResult,
} from "./contract";

export interface ProviderOwner { userId: string }

const STAGEHAND_BASE_URL = "https://api.stagehand.browserbase.com/v1";
const BROWSERBASE_BASE_URL = "https://api.browserbase.com/v1";
const DEFAULT_STAGEHAND_MODEL = "openai/gpt-5.4-mini";

interface RestConfig {
  apiKey: string;
  projectId: string | null;
  modelApiKey: string;
  modelName: string;
  submitEnabled: boolean;
}

interface RestSessionState {
  pageUrl: string;
  submitted: boolean;
  fields: ProviderInspectResult["fields"];
}

interface StagehandEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: unknown;
}

interface InspectPayload {
  formFound?: boolean;
  captcha?: boolean;
  authWall?: boolean;
  fields?: Array<{
    key?: string;
    label?: string;
    selector?: string;
    required?: boolean;
    sensitive?: boolean;
    kind?: string;
  }>;
}

interface InspectionField extends ProviderInspectResult["fields"][number] {
  selector: string;
}

export function readBrowserbaseRestConfig(): RestConfig {
  const apiKey = process.env["BROWSERBASE_API_KEY"]?.trim();
  const projectId = process.env["BROWSERBASE_PROJECT_ID"]?.trim() || null;
  const modelApiKey = process.env["OPENAI_API_KEY"]?.trim() || process.env["MODEL_API_KEY"]?.trim();
  if (!apiKey) throw new Error("BROWSERBASE_API_KEY is not configured.");
  if (!modelApiKey) throw new Error("OPENAI_API_KEY (or MODEL_API_KEY) is required for the remote Stagehand provider.");
  return {
    apiKey,
    projectId,
    modelApiKey,
    modelName: process.env["STAGEHAND_MODEL"]?.trim() || DEFAULT_STAGEHAND_MODEL,
    submitEnabled: process.env["AUTOMATION_ENABLE_SUBMIT"] === "true",
  };
}

export function createBrowserbaseRestProvider(owner: ProviderOwner, config = readBrowserbaseRestConfig()): BrowserAutomationProvider {
  const sessions = new Map<string, RestSessionState>();
  const state = (session: ProviderSession) => {
    const current = sessions.get(session.sessionId);
    if (!current) throw new Error("Browser session is no longer available.");
    return current;
  };

  return {
    name: "browserbase-stagehand-rest",

    async openSession(targetUrl: string): Promise<ProviderSession> {
      const detected = detectAts(targetUrl);
      if (detected.provider === "unknown") throw new Error("The application URL is not a trusted supported ATS URL.");
      const start = await stagehandRequest<{ sessionId?: string }>(config, "/sessions/start", {
        method: "POST",
        body: {
          modelName: config.modelName,
          browser: { type: "browserbase" },
          selfHeal: true,
          verbose: 0,
          systemPrompt: "You are operating a job application form. Never solve or bypass CAPTCHA, anti-bot checks, authentication walls, or consent gates. Never invent candidate facts. Perform only the explicit field-level actions requested by the caller.",
        },
      });
      const sessionId = start.sessionId?.trim();
      if (!sessionId) throw new Error("Browserbase Stagehand did not return a session ID.");
      try {
        await stagehandRequest(config, `/sessions/${encodeURIComponent(sessionId)}/navigate`, { method: "POST", body: { url: targetUrl } });
      } catch (error) {
        await endSession(config, sessionId).catch(() => undefined);
        throw error;
      }
      sessions.set(sessionId, { pageUrl: targetUrl, submitted: false, fields: [] });
      return { sessionId, pageUrl: targetUrl };
    },

    async inspect(session: ProviderSession): Promise<ProviderInspectResult> {
      const current = state(session);
      const payload = await stagehandRequest<{ result?: InspectPayload }>(config, `/sessions/${encodeURIComponent(session.sessionId)}/extract`, {
        method: "POST",
        body: {
          instruction: "Inspect the currently visible employer application page only. Return every visible form control with its exact stable selector (CSS or XPath), human label, whether it is required, and kind (text, email, phone, url, textarea, select, radio, checkbox, file). Also report whether an application form exists, whether a CAPTCHA/bot check is present, and whether sign-in/authentication is required. Do not interact with the page and do not solve any gate.",
          schema: INSPECTION_SCHEMA,
        },
      });
      const result = payload.result ?? {};
      const blockers: ProviderBlocker[] = [];
      if (result.captcha) blockers.push(blocker("captcha_or_bot_check", "This application is protected by a CAPTCHA / bot check. It is never bypassed; complete this application manually."));
      if (result.authWall) blockers.push(blocker("authentication_required", "This application requires sign-in. Automated sign-in is not performed."));
      const fields = normalizeInspectionFields(result.fields ?? []);
      current.fields = fields;
      if (!result.formFound || fields.length === 0) blockers.push(blocker("unsupported_widget", "No readable application form was found on the page."));
      return {
        fields: fields.map(({ key, label, required, sensitive, kind }) => ({ key, label, required, sensitive, kind })),
        blockers,
      };
    },

    async fill(session: ProviderSession, values: ProviderFillInput[]): Promise<ProviderFillResult> {
      const current = state(session);
      const fields = new Map((current.fields as InspectionField[]).map((field) => [field.key, field]));
      const filled: string[] = [];
      const failed: ProviderFillResult["failed"] = [];
      const blockers: ProviderBlocker[] = [];

      for (const input of values) {
        const field = fields.get(input.key);
        if (!field?.selector) {
          failed.push({ key: input.key, reason: "No exact live selector is available for this field." });
          continue;
        }
        try {
          if (input.value.type === "private_file") {
            const remotePath = await uploadPrivateDocument(config, owner, session.sessionId, input.value.documentId, input.value.fileName, input.value.mimeType);
            await deterministicAct(config, session.sessionId, field.selector, `Attach ${field.label}`, "setInputFiles", [remotePath]);
          } else {
            await fillTextOrChoice(config, session.sessionId, field, input.value.text);
          }
          filled.push(input.key);
        } catch (error) {
          const reason = error instanceof Error ? error.message : "The field could not be filled.";
          if (input.value.type === "private_file") blockers.push(blocker("file_upload_failed", reason, input.key));
          else failed.push({ key: input.key, reason });
        }
      }
      return { filled, failed, blockers };
    },

    async submit(session: ProviderSession): Promise<ProviderSubmitResult> {
      const current = state(session);
      if (!config.submitEnabled) return { submitted: false, blockers: [blocker("provider_unavailable", "Final submit is disabled by the execution boundary. The employer has not received an application.")] };
      try {
        const observed = await stagehandRequest<{ result?: Array<{ selector?: string; description?: string; method?: string; arguments?: string[] }> }>(config, `/sessions/${encodeURIComponent(session.sessionId)}/observe`, {
          method: "POST",
          body: { instruction: "Identify only the final button/control that submits this job application to the employer. Do not click it." },
        });
        const action = observed.result?.find((candidate) => candidate.selector && /submit|apply|send application|complete application/i.test(candidate.description ?? ""));
        if (!action?.selector) return { submitted: false, blockers: [blocker("unsupported_widget", "A single unambiguous final application submit control was not found.")] };
        await deterministicAct(config, session.sessionId, action.selector, "Final employer application submission", action.method || "click", action.arguments ?? []);
        current.submitted = true;
        return { submitted: true, blockers: [] };
      } catch (error) {
        return { submitted: false, blockers: [blocker("provider_error", error instanceof Error ? error.message : "The submit control could not be actioned.")] };
      }
    },

    async verify(session: ProviderSession): Promise<ProviderVerifyResult> {
      const current = state(session);
      if (!current.submitted) return { verified: false, confirmationText: null, confirmationUrl: null, blockers: [blocker("verification_failed", "Nothing was submitted, so there is nothing to verify.")] };
      try {
        const payload = await stagehandRequest<{ result?: { visibleText?: string; currentUrl?: string } }>(config, `/sessions/${encodeURIComponent(session.sessionId)}/extract`, {
          method: "POST",
          body: {
            instruction: "Return the visible page text verbatim after submission and the current page URL. Do not summarize, infer, or invent confirmation wording.",
            schema: VERIFY_SCHEMA,
          },
        });
        const visibleText = payload.result?.visibleText ?? "";
        const currentUrl = payload.result?.currentUrl?.trim() || current.pageUrl;
        current.pageUrl = currentUrl;
        const confirmation = findConfirmation(visibleText, currentUrl);
        if (!confirmation) return { verified: false, confirmationText: null, confirmationUrl: null, blockers: [blocker("verification_failed", "No concrete confirmation state was found after submitting, so success was not recorded.")] };
        return { verified: true, confirmationText: confirmation, confirmationUrl: currentUrl, blockers: [] };
      } catch (error) {
        return { verified: false, confirmationText: null, confirmationUrl: null, blockers: [blocker("verification_failed", error instanceof Error ? error.message : "Submission verification failed.")] };
      }
    },

    async captureEvidence(session: ProviderSession): Promise<ProviderEvidence> {
      const current = state(session);
      return {
        screenshotPath: null,
        pageUrl: current.pageUrl,
        capturedAt: new Date().toISOString(),
        browserbaseSessionId: session.sessionId,
        recordingUrl: `https://www.browserbase.com/sessions/${session.sessionId}`,
      };
    },

    async closeSession(session: ProviderSession): Promise<void> {
      sessions.delete(session.sessionId);
      await endSession(config, session.sessionId).catch(() => undefined);
    },
  };
}

export async function verifyBrowserbaseRestHealth(): Promise<boolean> {
  let sessionId: string | null = null;
  try {
    const config = readBrowserbaseRestConfig();
    const start = await stagehandRequest<{ sessionId?: string }>(config, "/sessions/start", { method: "POST", body: { modelName: config.modelName, browser: { type: "browserbase" }, verbose: 0 } });
    sessionId = start.sessionId?.trim() || null;
    return Boolean(sessionId);
  } catch {
    return false;
  } finally {
    if (sessionId) {
      try { await endSession(readBrowserbaseRestConfig(), sessionId); } catch { /* best effort */ }
    }
  }
}

async function fillTextOrChoice(config: RestConfig, sessionId: string, field: InspectionField, value: string) {
  const kind = field.kind.toLowerCase();
  if (kind === "radio") throw new Error("Radio-button questions are not guessed; an explicit supported option is required.");
  if (kind === "checkbox") {
    const normalized = value.trim().toLowerCase();
    if (["yes", "true", "1", "on", "checked"].includes(normalized)) {
      await deterministicAct(config, sessionId, field.selector, `Check ${field.label}`, "check", []);
      return;
    }
    if (["no", "false", "0", "off", "unchecked"].includes(normalized)) {
      await deterministicAct(config, sessionId, field.selector, `Uncheck ${field.label}`, "uncheck", []);
      return;
    }
    throw new Error("Checkbox answer must be an explicit yes/no value.");
  }
  if (kind === "select") {
    await deterministicAct(config, sessionId, field.selector, `Select ${field.label}`, "selectOption", [value]);
    return;
  }
  await deterministicAct(config, sessionId, field.selector, `Fill ${field.label}`, "fill", [value]);
}

async function deterministicAct(config: RestConfig, sessionId: string, selector: string, description: string, method: string, args: string[]) {
  const payload = await stagehandRequest<{ result?: { success?: boolean; message?: string } }>(config, `/sessions/${encodeURIComponent(sessionId)}/act`, {
    method: "POST",
    body: { input: { selector, description, method, arguments: args } },
  });
  if (payload.result?.success === false) throw new Error(payload.result.message || `Stagehand ${method} action failed.`);
}

async function uploadPrivateDocument(config: RestConfig, owner: ProviderOwner, sessionId: string, documentId: string, fileName: string, mimeType: string | null): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: doc, error: docError } = await supabaseAdmin.from("documents").select("storage_path,name,mime_type").eq("id", documentId).eq("user_id", owner.userId).maybeSingle();
  if (docError || !doc?.storage_path) throw new Error("The selected private document is unavailable.");
  const { data: file, error: downloadError } = await supabaseAdmin.storage.from("candidate-documents").download(doc.storage_path);
  if (downloadError || !file) throw new Error("The selected private document could not be read.");
  const safeName = (doc.name || fileName || "document.pdf").replace(/[^\w.-]+/g, "_");
  const form = new FormData();
  form.append("file", new Blob([await file.arrayBuffer()], { type: doc.mime_type || mimeType || "application/octet-stream" }), safeName);
  const response = await fetch(`${BROWSERBASE_BASE_URL}/sessions/${encodeURIComponent(sessionId)}/uploads`, { method: "POST", headers: { "x-bb-api-key": config.apiKey }, body: form });
  if (!response.ok) throw new Error(`Browserbase file upload failed with HTTP ${response.status}.`);
  return `/tmp/.uploads/${safeName}`;
}

async function endSession(config: RestConfig, sessionId: string) {
  await stagehandRequest(config, `/sessions/${encodeURIComponent(sessionId)}/end`, { method: "POST", body: {} });
}

async function stagehandRequest<T = Record<string, unknown>>(config: RestConfig, path: string, options: { method: "GET" | "POST"; body?: unknown }): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-bb-api-key": config.apiKey,
    "x-model-api-key": config.modelApiKey,
    "x-language": "typescript",
    "x-sdk-version": "357network-rest-1.0",
  };
  if (config.projectId) headers["x-bb-project-id"] = config.projectId;
  const response = await fetch(`${STAGEHAND_BASE_URL}${path}`, { method: options.method, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  const text = await response.text();
  let parsed: StagehandEnvelope<T> | null = null;
  try { parsed = text ? JSON.parse(text) as StagehandEnvelope<T> : null; } catch { parsed = null; }
  if (!response.ok || parsed?.success === false) throw new Error(`Browserbase Stagehand request failed (HTTP ${response.status}).${text ? ` ${text.slice(0, 300)}` : ""}`);
  return (parsed?.data ?? parsed ?? {}) as T;
}

function normalizeInspectionFields(raw: InspectPayload["fields"]): InspectionField[] {
  const fields: InspectionField[] = [];
  const seen = new Set<string>();
  for (const item of raw ?? []) {
    const selector = item.selector?.trim() ?? "";
    const label = item.label?.trim() ?? "";
    if (!selector || !label) continue;
    const baseKey = (item.key?.trim() || label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `field_${fields.length + 1}`).slice(0, 120);
    let key = baseKey;
    let suffix = 2;
    while (seen.has(key)) key = `${baseKey}_${suffix++}`;
    seen.add(key);
    fields.push({ key, label, selector, required: item.required === true, sensitive: item.sensitive === true || isSensitiveLabel(label), kind: normalizeKind(item.kind) });
  }
  return fields;
}

function normalizeKind(value: string | undefined): string {
  const kind = (value ?? "text").toLowerCase();
  if (["text", "email", "phone", "url", "textarea", "select", "radio", "checkbox", "file"].includes(kind)) return kind;
  if (kind === "tel") return "phone";
  if (kind === "upload" || kind === "attachment") return "file";
  if (kind === "dropdown") return "select";
  return "text";
}

function blocker(kind: ProviderBlocker["kind"], message: string, fieldKey?: string): ProviderBlocker {
  return fieldKey ? { kind, message, fieldKey } : { kind, message };
}

const INSPECTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["formFound", "captcha", "authWall", "fields"],
  properties: {
    formFound: { type: "boolean" },
    captcha: { type: "boolean" },
    authWall: { type: "boolean" },
    fields: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "selector", "required", "sensitive", "kind"],
        properties: {
          key: { type: "string" }, label: { type: "string" }, selector: { type: "string" }, required: { type: "boolean" }, sensitive: { type: "boolean" }, kind: { type: "string" },
        },
      },
    },
  },
};

const VERIFY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["visibleText", "currentUrl"],
  properties: { visibleText: { type: "string" }, currentUrl: { type: "string" } },
};
