export const MIN_PASSWORD_LENGTH = 8;

export function validateNewPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
  }
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  const passwordError = validateNewPassword(password);
  if (passwordError) return passwordError;
  if (password !== confirmation) return "The passwords do not match.";
  return null;
}
