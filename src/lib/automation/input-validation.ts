const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ATS_URL_LENGTH = 2048;

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return false;

  const octets = parts.map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return false;

  const a = octets[0]!;
  const b = octets[1]!;
  const c = octets[2]!;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isLocalOrPrivateHost(hostname: string) {
  const host = hostname
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\.+$/, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan") ||
    host.endsWith(".home.arpa") ||
    (!host.includes(".") && !host.includes(":")) ||
    isPrivateIpv4(host)
  ) {
    return true;
  }
  if (
    host === "::" ||
    host === "::1" ||
    host.startsWith("::ffff:") ||
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    /^fe[89ab]/.test(host)
  ) {
    return true;
  }

  return false;
}

export function validateApplicationId(input: { applicationId: string }) {
  const applicationId = input.applicationId.trim();
  if (!UUID_PATTERN.test(applicationId)) {
    throw new Error("A valid application ID is required.");
  }
  return { applicationId };
}

export function validateAtsUrlInput(input: { url: string | null }) {
  if (input.url === null) return { url: null };
  if (typeof input.url !== "string") {
    throw new Error("A valid application URL is required.");
  }

  const url = input.url.trim();
  if (url.length === 0) return { url: null };
  if (url.length > MAX_ATS_URL_LENGTH) {
    throw new Error("Application URL is too long.");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("A valid HTTP(S) application URL is required.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("A valid HTTP(S) application URL is required.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Application URL cannot contain embedded credentials.");
  }
  if (isLocalOrPrivateHost(parsed.hostname)) {
    throw new Error("Application URL cannot target a local or private network address.");
  }

  return { url };
}

export function validateSubmissionInput(input: { applicationId: string; requestKey?: string | null }) {
  const { applicationId } = validateApplicationId(input);
  const requestKey = input.requestKey?.trim() || null;
  if (requestKey && requestKey.length > 200) {
    throw new Error("Submission request key is too long.");
  }
  return { applicationId, requestKey };
}
