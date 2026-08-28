const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ATS_URL_LENGTH = 2048;

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
