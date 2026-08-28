const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateApplicationId(input: { applicationId: string }) {
  const applicationId = input.applicationId.trim();
  if (!UUID_PATTERN.test(applicationId)) {
    throw new Error("A valid application ID is required.");
  }
  return { applicationId };
}

export function validateSubmissionInput(input: { applicationId: string; requestKey?: string | null }) {
  const { applicationId } = validateApplicationId(input);
  const requestKey = input.requestKey?.trim() || null;
  if (requestKey && requestKey.length > 200) {
    throw new Error("Submission request key is too long.");
  }
  return { applicationId, requestKey };
}
