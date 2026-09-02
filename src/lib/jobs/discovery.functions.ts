import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const JOB_SEARCH_COUNTRIES = ["us", "gb", "ca", "au", "nz", "de", "fr", "nl", "at", "pl", "br", "in", "sg", "za"] as const;
export type JobSearchCountry = (typeof JOB_SEARCH_COUNTRIES)[number];

export interface DiscoveredJob {
  externalId: string;
  source: "adzuna" | "arbeitnow";
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  sourceUrl: string;
  postedAt: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  remote: boolean | null;
  tags: string[];
}

export interface JobSearchResult {
  jobs: DiscoveredJob[];
  sources: Array<{ source: DiscoveredJob["source"]; ok: boolean; note: string }>;
  page: number;
  hasMore: boolean;
}

export interface JobSearchStatus {
  adzunaConfigured: boolean;
  publicFallbackAvailable: true;
}

type SearchInput = {
  query: string;
  location: string | undefined;
  country: JobSearchCountry;
  remoteOnly: boolean;
  page: number;
};

const COUNTRY_SET = new Set<string>(JOB_SEARCH_COUNTRIES);

function validateSearchInput(value: unknown): SearchInput {
  if (!value || typeof value !== "object") throw new Error("Search input is required.");
  const input = value as Record<string, unknown>;
  const query = typeof input["query"] === "string" ? input["query"].trim() : "";
  const location = typeof input["location"] === "string" ? input["location"].trim() : "";
  const country = typeof input["country"] === "string" ? input["country"].toLowerCase() : "us";
  const rawPage = typeof input["page"] === "number" ? input["page"] : 1;
  if (query.length < 2) throw new Error("Enter at least 2 characters to search jobs.");
  if (query.length > 100) throw new Error("Search query is too long.");
  if (location.length > 100) throw new Error("Location is too long.");
  if (!COUNTRY_SET.has(country)) throw new Error("Unsupported country selection.");
  if (!Number.isInteger(rawPage) || rawPage < 1 || rawPage > 10) throw new Error("Invalid search page.");
  return { query, location: location || undefined, country: country as JobSearchCountry, remoteOnly: input["remoteOnly"] === true, page: rawPage };
}

export const getJobSearchStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<JobSearchStatus> => ({
    adzunaConfigured: Boolean(process.env["ADZUNA_APP_ID"]?.trim() && process.env["ADZUNA_APP_KEY"]?.trim()),
    publicFallbackAvailable: true,
  }));

export const searchJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateSearchInput)
  .handler(async ({ data }): Promise<JobSearchResult> => {
    const [adzuna, arbeitnow] = await Promise.all([
      searchAdzuna(data).catch((error: unknown) => ({ jobs: [] as DiscoveredJob[], ok: false, note: error instanceof Error ? error.message : "Adzuna search failed.", hasMore: false })),
      searchArbeitnow(data).catch((error: unknown) => ({ jobs: [] as DiscoveredJob[], ok: false, note: error instanceof Error ? error.message : "Public job search failed.", hasMore: false })),
    ]);
    const jobs = dedupeJobs([...adzuna.jobs, ...arbeitnow.jobs])
      .filter((job) => !data.remoteOnly || job.remote === true || /remote/i.test(job.location ?? ""))
      .slice(0, 40);
    return {
      jobs,
      sources: [
        { source: "adzuna", ok: adzuna.ok, note: adzuna.note },
        { source: "arbeitnow", ok: arbeitnow.ok, note: arbeitnow.note },
      ],
      page: data.page,
      hasMore: adzuna.hasMore || arbeitnow.hasMore,
    };
  });

async function searchAdzuna(input: SearchInput): Promise<{ jobs: DiscoveredJob[]; ok: boolean; note: string; hasMore: boolean }> {
  const appId = process.env["ADZUNA_APP_ID"]?.trim();
  const appKey = process.env["ADZUNA_APP_KEY"]?.trim();
  if (!appId || !appKey) return { jobs: [], ok: false, note: "Adzuna credentials are not configured; using the public fallback source.", hasMore: false };
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${input.country}/search/${input.page}`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", "25");
  url.searchParams.set("what", input.query);
  url.searchParams.set("content-type", "application/json");
  if (input.location) url.searchParams.set("where", input.location);
  const response = await fetchWithTimeout(url, 10_000);
  if (!response.ok) throw new Error(`Adzuna returned HTTP ${response.status}.`);
  const payload = await response.json() as { count?: number; results?: Array<Record<string, unknown>> };
  const rows = Array.isArray(payload.results) ? payload.results : [];
  const jobs = rows.map((row): DiscoveredJob | null => {
    const title = text(row["title"]);
    const company = text(record(row["company"])?.["display_name"]);
    const location = text(record(row["location"])?.["display_name"]) || null;
    const sourceUrl = safeHttpUrl(text(row["redirect_url"]));
    if (!title || !company || !sourceUrl) return null;
    return {
      externalId: `adzuna:${text(row["id"]) || hashKey(`${title}|${company}|${sourceUrl}`)}`,
      source: "adzuna", title, company, location,
      description: cleanDescription(text(row["description"])) || null,
      sourceUrl,
      postedAt: text(row["created"]) || null,
      salaryMin: numberOrNull(row["salary_min"]),
      salaryMax: numberOrNull(row["salary_max"]),
      currency: currencyForCountry(input.country),
      remote: location ? /remote|home[- ]?based/i.test(location) : null,
      tags: [text(record(row["category"])?.["label"]), text(row["contract_time"]), text(row["contract_type"])].filter(Boolean),
    };
  }).filter((job): job is DiscoveredJob => Boolean(job));
  return { jobs, ok: true, note: `${jobs.length} result${jobs.length === 1 ? "" : "s"} from Adzuna.`, hasMore: typeof payload.count === "number" ? input.page * 25 < payload.count : jobs.length === 25 };
}

async function searchArbeitnow(input: SearchInput): Promise<{ jobs: DiscoveredJob[]; ok: boolean; note: string; hasMore: boolean }> {
  const response = await fetchWithTimeout(new URL(`https://www.arbeitnow.com/api/job-board-api?page=${input.page}`), 10_000);
  if (!response.ok) throw new Error(`Public fallback returned HTTP ${response.status}.`);
  const payload = await response.json() as { data?: Array<Record<string, unknown>>; links?: { next?: string | null } };
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const queryTokens = tokenize(input.query);
  const locationTokens = tokenize(input.location ?? "");
  const jobs = rows.map((row): DiscoveredJob | null => {
    const title = text(row["title"]);
    const company = text(row["company_name"]);
    const sourceUrl = safeHttpUrl(text(row["url"]));
    if (!title || !company || !sourceUrl) return null;
    const description = cleanDescription(text(row["description"]));
    const location = text(row["location"]) || null;
    const tags = arrayOfText(row["tags"]);
    const searchable = `${title} ${company} ${description} ${tags.join(" ")}`.toLowerCase();
    const locationSearchable = `${location ?? ""} ${row["remote"] === true ? "remote" : ""}`.toLowerCase();
    if (!queryTokens.every((token) => searchable.includes(token))) return null;
    if (locationTokens.length && !locationTokens.every((token) => locationSearchable.includes(token))) return null;
    return {
      externalId: `arbeitnow:${text(row["slug"]) || hashKey(`${title}|${company}|${sourceUrl}`)}`,
      source: "arbeitnow", title, company, location,
      description: description || null, sourceUrl,
      postedAt: dateFromEpoch(row["created_at"]), salaryMin: null, salaryMax: null, currency: null,
      remote: typeof row["remote"] === "boolean" ? row["remote"] : null,
      tags: [...tags, ...arrayOfText(row["job_types"])].slice(0, 10),
    };
  }).filter((job): job is DiscoveredJob => Boolean(job));
  return { jobs, ok: true, note: `${jobs.length} matching public result${jobs.length === 1 ? "" : "s"}.`, hasMore: Boolean(payload.links?.next) };
}

async function fetchWithTimeout(url: URL, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, headers: { accept: "application/json", "user-agent": "357Network/1.0 job-search" } });
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Job source timed out.");
    throw error;
  } finally { clearTimeout(timeout); }
}

function dedupeJobs(jobs: DiscoveredJob[]): DiscoveredJob[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = `${job.title}|${job.company}|${job.location ?? ""}`.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function cleanDescription(value: string): string { return decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()).slice(0, 20_000); }
function decodeEntities(value: string): string { return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">"); }
function tokenize(value: string): string[] { return value.toLowerCase().split(/\s+/).map((part) => part.trim()).filter((part) => part.length > 1); }
function text(value: unknown): string { return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : ""; }
function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function arrayOfText(value: unknown): string[] { return Array.isArray(value) ? value.map(text).filter(Boolean) : []; }
function numberOrNull(value: unknown): number | null { const number = typeof value === "number" ? value : Number(value); return Number.isFinite(number) ? number : null; }
function safeHttpUrl(value: string): string { try { const parsed = new URL(value); return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : ""; } catch { return ""; } }
function dateFromEpoch(value: unknown): string | null { if (typeof value !== "number" && typeof value !== "string") return null; const raw = Number(value); if (!Number.isFinite(raw)) return null; const date = new Date(raw > 10_000_000_000 ? raw : raw * 1000); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }
function currencyForCountry(country: JobSearchCountry): string | null { const currencies: Partial<Record<JobSearchCountry, string>> = { us: "USD", gb: "GBP", ca: "CAD", au: "AUD", nz: "NZD", de: "EUR", fr: "EUR", nl: "EUR", at: "EUR", pl: "PLN", br: "BRL", in: "INR", sg: "SGD", za: "ZAR" }; return currencies[country] ?? null; }
function hashKey(value: string): string { let hash = 2166136261; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(36); }
