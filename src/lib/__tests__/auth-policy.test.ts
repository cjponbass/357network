import { describe, expect, it } from "vitest";

import { MIN_PASSWORD_LENGTH, validateNewPassword, validatePasswordConfirmation } from "../auth-policy";

describe("auth password policy", () => {
  it("requires at least eight characters", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(validateNewPassword("1234567")).toBe("Use at least 8 characters for your password.");
    expect(validateNewPassword("12345678")).toBeNull();
  });

  it("requires reset confirmation to match", () => {
    expect(validatePasswordConfirmation("12345678", "87654321")).toBe("The passwords do not match.");
    expect(validatePasswordConfirmation("12345678", "12345678")).toBeNull();
  });

  it("checks minimum length before confirmation mismatch", () => {
    expect(validatePasswordConfirmation("short", "different")).toBe("Use at least 8 characters for your password.");
  });
});
