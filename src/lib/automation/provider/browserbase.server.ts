/**
 * Browserbase browser-automation driver (server-only).
 * Pipeline: create session -> connect Playwright -> inspect live DOM -> fill ->
 * explicit submit boundary -> verify -> capture evidence -> close.
 */
import { detectAts } from "../ats-detect";
import { EXTRACT_FIELDS_SCRIPT, findConfirmation, normalizeDomFields, type DomFieldSignal, type NormalizedDomField } from "./browserbase-dom";
import type { BrowserAutomationProvider, ProviderBlocker, ProviderEvidence, ProviderFillInput, ProviderFillResult, ProviderInspectResult, ProviderSession, ProviderSubmitResult, ProviderVerifyResult } from "./contract";

export interface PageLike {
  goto(url: string, options?: Record<string, unknown>): Promise<unknown>;
  evaluate<T = unknown>(script: string): Promise<T>;
  fill(selector: string, value: string): Promise<void>;
  selectOption?(selector: string, values: string | { label?: string; value?: string }): Promise<unknown>;
  check?(selector: string): Promise<void>;
  uncheck?(selector: string): Promise<void>;
  setInputFiles(selector: string, files: string): Promise<void>;
  click(selector: string, options?: Record<string, unknown>): Promise<void>;
  waitForLoadState?(state?: string, options?: Record<string, unknown>): Promise<void>;
  screenshot(options?: Record<string, unknown>): Promise<Uint8Array>;
  url(): string;
}
export interface BrowserLike { close(): Promise<void>; }
export interface LocalFile { path: string; cleanup: () => Promise<void>; }
export interface ProviderOwner { userId: string; }
export interface BrowserbaseDeps {
  createSession: () => Promise<{ id: string; connectUrl: string }>;
  connect: (connectUrl: string) => Promise<{ browser: BrowserLike; page: PageLike }>;
  releaseSession: (sessionId: string) => Promise<void>;
  downloadDocument: (documentId: string) => Promise<LocalFile>;
  storeScreenshot: (sessionId: string, bytes: Uint8Array) => Promise<string | null>;
  submitEnabled: boolean;
}

const SUBMIT_SELECTORS = ['#submit_app, button#submit_app, input#submit_app', 'button[type="submit"]', 'input[type="submit"]'];
interface SessionState { bbSessionId: string; browser: BrowserLike; page: PageLike; fields: NormalizedDomField[]; submitted: boolean; }
function blocker(kind: ProviderBlocker["kind"], message: string, fieldKey?: string) { return fieldKey ? { kind, message, fieldKey } : { kind, message }; }

export function isTrustedAtsNavigation(targetUrl: string, finalUrl: string): boolean {
  const target = detectAts(targetUrl);
  const final = detectAts(finalUrl);
  return target.provider !== "unknown" && final.provider === target.provider;
}

export function createBrowserbaseProvider(deps: BrowserbaseDeps): BrowserAutomationProvider {
  const sessions = new Map<string, SessionState>();
  const state = (session: ProviderSession): SessionState => {
    const found = sessions.get(session.sessionId);
    if (!found) throw new Error("Browser session is no longer available.");
    return found;
  };

  return {
    name: "browserbase",
    async openSession(targetUrl: string): Promise<ProviderSession> {
      const remote = await deps.createSession();
      let connected: { browser: BrowserLike; page: PageLike };
      try { connected = await deps.connect(remote.connectUrl); }
      catch (error) {
        await deps.releaseSession(remote.id).catch(() => undefined);
        throw new Error(`Could not connect to the browser session. ${error instanceof Error ? error.message : ""}`.trim());
      }
      try { await connected.page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45_000 }); }
      catch {
        await connected.browser.close().catch(() => undefined);
        await deps.releaseSession(remote.id).catch(() => undefined);
        throw new Error("Navigation to the application page failed.");
      }
      const finalUrl = connected.page.url();
      if (!isTrustedAtsNavigation(targetUrl, finalUrl)) {
        await connected.browser.close().catch(() => undefined);
        await deps.releaseSession(remote.id).catch(() => undefined);
        throw new Error("Navigation left the trusted ATS provider. Candidate data was not entered.");
      }
      sessions.set(remote.id, { bbSessionId: remote.id, browser: connected.browser, page: connected.page, fields: [], submitted: false });
      return { sessionId: remote.id, pageUrl: finalUrl };
    },

    async inspect(session: ProviderSession): Promise<ProviderInspectResult> {
      const current = state(session);
      let signal: DomFieldSignal;
      try { signal = await current.page.evaluate<DomFieldSignal>(EXTRACT_FIELDS_SCRIPT); }
      catch { return { fields: [], blockers: [blocker("provider_error", "The live form could not be read.")] }; }
      const blockers: ProviderBlocker[] = [];
      if (signal.captcha) blockers.push(blocker("captcha_or_bot_check", "This application is protected by a CAPTCHA / bot check. It is never bypassed — please finish this application manually."));
      if (signal.authWall) blockers.push(blocker("authentication_required", "The application page requires signing in. Automated sign-in is not performed."));
      if (!signal.formFound || signal.fields.length === 0) blockers.push(blocker("unsupported_widget", "No readable application form was found on the page."));
      const normalized = normalizeDomFields(signal.fields ?? []);
      current.fields = normalized;
      return { fields: normalized.map(({ key, label, required, sensitive, kind }) => ({ key, label, required, sensitive, kind })), blockers };
    },

    async fill(session: ProviderSession, values: ProviderFillInput[]): Promise<ProviderFillResult> {
      const current = state(session);
      const filled: string[] = [];
      const failed: ProviderFillResult["failed"] = [];
      const blockers: ProviderBlocker[] = [];
      const fields = new Map(current.fields.map((field) => [field.key, field]));
      for (const input of values) {
        const field = fields.get(input.key);
        if (!field) { failed.push({ key: input.key, reason: "No matching field on the live form." }); continue; }
        if (input.value.type === "text") {
          try {
            await fillNativeField(current.page, field, input.value.text);
            filled.push(input.key);
          } catch (error) {
            failed.push({ key: input.key, reason: error instanceof Error ? error.message : "The field could not be filled." });
          }
          continue;
        }
        let local: LocalFile | null = null;
        try {
          local = await deps.downloadDocument(input.value.documentId);
          await current.page.setInputFiles(field.selector, local.path);
          filled.push(input.key);
        } catch {
          blockers.push(blocker("file_upload_failed", `Could not upload ${input.value.fileName}.`, input.key));
        } finally { if (local) await local.cleanup().catch(() => undefined); }
      }
      return { filled, failed, blockers };
    },

    async submit(session: ProviderSession): Promise<ProviderSubmitResult> {
      const current = state(session);
      if (!deps.submitEnabled) return { submitted: false, blockers: [blocker("provider_unavailable", "The final submit step is disabled by the execution boundary. Everything up to submission ran; nothing was sent to the employer.")] };
      for (const selector of SUBMIT_SELECTORS) {
        try {
          await current.page.click(selector, { timeout: 5_000 });
          current.submitted = true;
          await current.page.waitForLoadState?.("networkidle", { timeout: 30_000 });
          return { submitted: true, blockers: [] };
        } catch { continue; }
      }
      return { submitted: false, blockers: [blocker("unsupported_widget", "No submit control could be actioned.")] };
    },

    async verify(session: ProviderSession): Promise<ProviderVerifyResult> {
      const current = state(session);
      if (!current.submitted) return { verified: false, confirmationText: null, confirmationUrl: null, blockers: [blocker("verification_failed", "Nothing was submitted, so there is nothing to verify.")] };
      let bodyText = "";
      try { bodyText = await current.page.evaluate<string>("document.body.innerText"); } catch { bodyText = ""; }
      const url = current.page.url();
      const confirmation = findConfirmation(bodyText, url);
      if (!confirmation) return { verified: false, confirmationText: null, confirmationUrl: null, blockers: [blocker("verification_failed", "No confirmation state was found after submitting, so the result is ambiguous.")] };
      return { verified: true, confirmationText: confirmation, confirmationUrl: url, blockers: [] };
    },

    async captureEvidence(session: ProviderSession): Promise<ProviderEvidence> {
      const current = state(session);
      let screenshotPath: string | null = null;
      try { screenshotPath = await deps.storeScreenshot(current.bbSessionId, await current.page.screenshot({ fullPage: true, type: "png" })); } catch { screenshotPath = null; }
      return { screenshotPath, pageUrl: current.page.url(), capturedAt: new Date().toISOString() };
    },

    async closeSession(session: ProviderSession): Promise<void> {
      const current = sessions.get(session.sessionId);
      sessions.delete(session.sessionId);
      if (!current) return;
      await current.browser.close().catch(() => undefined);
      await deps.releaseSession(current.bbSessionId).catch(() => undefined);
    },
  };
}

export async function fillNativeField(page: PageLike, field: Pick<NormalizedDomField, "selector" | "kind">, value: string): Promise<void> {
  const kind = field.kind.toLowerCase();
  if (kind === "select") {
    if (!page.selectOption) throw new Error("This select control is not supported by the browser driver.");
    try { await page.selectOption(field.selector, { label: value }); }
    catch { await page.selectOption(field.selector, value); }
    return;
  }
  if (kind === "checkbox") {
    const normalized = value.trim().toLowerCase();
    const checked = ["yes", "true", "1", "checked", "on"].includes(normalized);
    const unchecked = ["no", "false", "0", "unchecked", "off"].includes(normalized);
    if (!checked && !unchecked) throw new Error("Checkbox answer must be an explicit yes/no value.");
    if (checked) {
      if (!page.check) throw new Error("This checkbox control is not supported by the browser driver.");
      await page.check(field.selector);
    } else {
      if (!page.uncheck) throw new Error("This checkbox control is not supported by the browser driver.");
      await page.uncheck(field.selector);
    }
    return;
  }
  if (kind === "radio") throw new Error("Radio-button questions require an explicit supported choice and are not guessed.");
  await page.fill(field.selector, value);
}

export function readBrowserbaseConfig() {
  const apiKey = process.env["BROWSERBASE_API_KEY"]?.trim();
  const projectId = process.env["BROWSERBASE_PROJECT_ID"]?.trim();
  if (!apiKey) throw new Error("BROWSERBASE_API_KEY is not configured.");
  if (!projectId) throw new Error("BROWSERBASE_PROJECT_ID is not configured.");
  return { apiKey, projectId };
}

export async function browserbaseDeps(owner: ProviderOwner): Promise<BrowserbaseDeps> {
  const { apiKey, projectId } = readBrowserbaseConfig();
  const { default: Browserbase } = await import("@browserbasehq/sdk");
  const bb = new Browserbase({ apiKey });
  return {
    submitEnabled: process.env["AUTOMATION_ENABLE_SUBMIT"] === "true",
    async createSession() {
      const session = await bb.sessions.create({ projectId });
      const connectUrl = session.connectUrl;
      if (!session.id || !connectUrl) throw new Error("The browser provider did not return a usable session.");
      return { id: session.id, connectUrl };
    },
    async connect(connectUrl) {
      const { chromium } = await import("playwright-core");
      const browser = await chromium.connectOverCDP(connectUrl);
      const context = browser.contexts()[0] ?? (await browser.newContext());
      const page = context.pages()[0] ?? (await context.newPage());
      return { browser: browser as unknown as BrowserLike, page: page as unknown as PageLike };
    },
    async releaseSession(sessionId) {
      try { await bb.sessions.update(sessionId, { projectId, status: "REQUEST_RELEASE" }); } catch { /* best effort */ }
    },
    async downloadDocument(documentId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: doc } = await supabaseAdmin.from("documents").select("storage_path, name").eq("id", documentId).eq("user_id", owner.userId).maybeSingle();
      if (!doc?.storage_path) throw new Error("Document is not available.");
      const { data: file, error } = await supabaseAdmin.storage.from("candidate-documents").download(doc.storage_path);
      if (error || !file) throw new Error("Document could not be read.");
      const { writeFile, rm, mkdtemp } = await import("node:fs/promises");
      const { tmpdir } = await import("node:os");
      const { join } = await import("node:path");
      const dir = await mkdtemp(join(tmpdir(), "ats-"));
      const safeName = (doc.name || "resume.pdf").replace(/[^\w.-]+/g, "_");
      const path = join(dir, safeName);
      await writeFile(path, Buffer.from(await file.arrayBuffer()));
      return { path, cleanup: async () => { await rm(dir, { recursive: true, force: true }).catch(() => undefined); } };
    },
    async storeScreenshot(sessionId, bytes) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const path = `${owner.userId}/automation-evidence/${sessionId}-${Date.now()}.png`;
      const { error } = await supabaseAdmin.storage.from("candidate-documents").upload(path, bytes, { contentType: "image/png", upsert: false });
      return error ? null : path;
    },
  };
}
