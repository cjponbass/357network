import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!loading && user) {
    void navigate({ to: "/dashboard", replace: true });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created. Check your email if confirmation is required, then sign in.");
        setMode("signin");
      }
    } catch (error) {
      setMessage(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 460, margin: "0 auto", padding: "64px 24px", fontFamily: "system-ui" }}>
      <a href="/" style={{ color: "#111827", textDecoration: "none", fontWeight: 700 }}>357Network</a>
      <h1 style={{ fontSize: 34, margin: "28px 0 8px" }}>{mode === "signin" ? "Sign in" : "Create account"}</h1>
      <p style={{ color: "#4b5563", lineHeight: 1.5 }}>Access your private job application workspace.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 14, marginTop: 28 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
        </label>
        <button disabled={busy} type="submit" style={primaryButton}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
      {message ? <p style={{ marginTop: 16, color: "#374151" }}>{message}</p> : null}
      <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} style={linkButton}>
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
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
};
const linkButton: React.CSSProperties = {
  border: 0,
  background: "transparent",
  padding: 0,
  marginTop: 20,
  color: "#1d4ed8",
  cursor: "pointer",
};
