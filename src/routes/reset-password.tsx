import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }
    if (!user) {
      setMessage("This password-reset link is invalid or has expired. Request a new link from the sign-in page.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setComplete(true);
      setMessage("Password updated successfully.");
    } catch (error) {
      setMessage(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 460, margin: "0 auto", padding: "64px 24px", fontFamily: "system-ui" }}>
      <a href="/" style={{ color: "#111827", textDecoration: "none", fontWeight: 700 }}>357 Network</a>
      <h1 style={{ fontSize: 34, margin: "28px 0 8px" }}>Reset password</h1>
      <p style={{ color: "#4b5563", lineHeight: 1.5 }}>
        {loading
          ? "Validating your secure reset link…"
          : user
            ? "Choose a new password for your 357 Network account."
            : "Open this page from the secure password-reset email sent by 357 Network."}
      </p>

      {!loading && user && !complete ? (
        <form onSubmit={submit} style={{ display: "grid", gap: 14, marginTop: 28 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>New password</span>
            <input
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Confirm new password</span>
            <input
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              style={inputStyle}
            />
          </label>
          <button disabled={busy} type="submit" style={primaryButton}>
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      ) : null}

      {message ? <p style={{ marginTop: 16, color: "#374151" }}>{message}</p> : null}

      {complete ? (
        <button type="button" onClick={() => void navigate({ to: "/dashboard", replace: true })} style={primaryButton}>
          Continue to dashboard
        </button>
      ) : !loading && !user ? (
        <button type="button" onClick={() => void navigate({ to: "/auth", replace: true })} style={linkButton}>
          Return to sign in
        </button>
      ) : null}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "11px 12px",
  fontSize: 16,
};

const primaryButton: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  padding: "12px 16px",
  background: "#111827",
  color: "white",
  fontSize: 16,
  cursor: "pointer",
  marginTop: 12,
};

const linkButton: React.CSSProperties = {
  border: 0,
  background: "transparent",
  padding: 0,
  marginTop: 20,
  color: "#1d4ed8",
  cursor: "pointer",
};
