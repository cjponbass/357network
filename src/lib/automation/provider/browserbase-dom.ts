/** Pure DOM helpers for the Browserbase driver; testable without a live browser. */

import { isSensitiveLabel } from "../live-fields";

export interface RawDomField {
  label: string;
  selector: string;
  type: string;
  required: boolean;
}

export interface DomFieldSignal {
  captcha: boolean;
  authWall: boolean;
  formFound: boolean;
  fields: RawDomField[];
}

export const EXTRACT_FIELDS_SCRIPT = `(() => {
  const cssEscape = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : v.replace(/[^a-zA-Z0-9_-]/g, "\\\\$&"));
  const labelFor = (el) => {
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label");
    if (el.id) {
      const l = document.querySelector('label[for="' + cssEscape(el.id) + '"]');
      if (l && l.textContent) return l.textContent;
    }
    const wrap = el.closest("label");
    if (wrap && wrap.textContent) return wrap.textContent;
    const group = el.closest(".field, .form-group, fieldset, div");
    const heading = group ? group.querySelector("label, legend") : null;
    if (heading && heading.textContent) return heading.textContent;
    return el.getAttribute("name") || el.getAttribute("placeholder") || "";
  };
  const selectorFor = (el) => {
    if (el.id) return "#" + cssEscape(el.id);
    if (el.getAttribute("name")) return el.tagName.toLowerCase() + '[name="' + el.getAttribute("name") + '"]';
    return "";
  };
  const captcha = Boolean(document.querySelector('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], .g-recaptcha, .h-captcha, .cf-turnstile, iframe[title*="challenge"]'));
  const authWall = Boolean(document.querySelector('input[type="password"]')) || /\\/(login|signin|sign-in|auth)(\\/|$|\\?)/.test(location.pathname + location.search);
  const form = document.querySelector("form");
  const scope = form || document.body;
  const nodes = Array.from(scope.querySelectorAll("input, textarea, select"));
  const fields = [];
  for (const el of nodes) {
    const type = (el.getAttribute("type") || el.tagName).toLowerCase();
    if (type === "hidden" || type === "submit" || type === "button" || el.disabled) continue;
    const selector = selectorFor(el);
    if (!selector) continue;
    const label = String(labelFor(el) || "").replace(/\\s+/g, " ").trim();
    if (!label) continue;
    const required = el.required === true || el.getAttribute("aria-required") === "true" || /\\*/.test(label);
    fields.push({ label: label.replace(/\\*$/, "").trim(), selector, type, required });
  }
  return { captcha, authWall, formFound: Boolean(form), fields };
})()`;

const KEY_PATTERNS: Array<[RegExp, string]> = [
  [/first\s*name/i, "first_name"],
  [/last\s*name|surname|family name/i, "last_name"],
  [/full\s*name/i, "full_name"],
  [/e-?mail/i, "email"],
  [/phone|mobile|telephone/i, "phone"],
  [/resume|cv\b/i, "resume"],
  [/cover\s*letter/i, "cover_letter"],
  [/linked-?in/i, "linkedin"],
  [/website|portfolio|personal site/i, "website"],
  [/github/i, "github"],
];

function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48) || "field";
}

export function canonicalKey(label: string, seen: Set<string>): string {
  for (const [pattern, key] of KEY_PATTERNS) if (pattern.test(label) && !seen.has(key)) return key;
  let key = `custom_${slugify(label)}`;
  let i = 2;
  while (seen.has(key)) key = `custom_${slugify(label)}_${i++}`;
  return key;
}

export interface NormalizedDomField {
  key: string;
  label: string;
  required: boolean;
  sensitive: boolean;
  kind: string;
  selector: string;
}

export function normalizeDomFields(raw: RawDomField[]): NormalizedDomField[] {
  const seen = new Set<string>();
  return raw.map((field) => {
    const key = canonicalKey(field.label, seen);
    seen.add(key);
    return { key, label: field.label, required: field.required, sensitive: isSensitiveLabel(field.label), kind: field.type, selector: field.selector };
  });
}

const CONFIRMATION_PATTERNS: RegExp[] = [
  /thank you for applying/i,
  /your application (has been|was) (successfully )?(submitted|received)/i,
  /application submitted/i,
  /we(’|')?ve received your application/i,
  /we have received your application/i,
];

export function findConfirmation(bodyText: string, url: string): string | null {
  for (const pattern of CONFIRMATION_PATTERNS) {
    const match = pattern.exec(bodyText);
    if (match) return match[0];
  }
  return /\/(confirmation|thanks|thank-you|application_confirmation)(\/|$|\?)/i.test(url)
    ? "Confirmation page reached"
    : null;
}
