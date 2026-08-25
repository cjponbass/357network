import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

type Counts = { jobs: number; applications: number; interviews: number; offers: number };

function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [counts, setCounts] = useState<Counts>({ jobs: 0, applications: 0, interviews: 0, offers: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const head = { count: "exact" as const, head: true };
      const [jobs, applications, interviews, offers] = await Promise.all([
        supabase.from("jobs").select("id", head).eq("created_by", user.id),
        supabase.from("applications").select("id", head).eq("user_id", user.id),
        supabase.from("applications").select("id", head).eq("user_id", user.id).eq("status", "interview"),
        supabase.from("applications").select("id", head).eq("user_id", user.id).eq("status", "offer"),
      ]);
      const failure = [jobs, applications, interviews, offers].find((result) => result.error)?.error;
      if (cancelled) return;
      if (failure) {
        setError(failure.message);
        return;
      }
      setCounts({
        jobs: jobs.count ?? 0,
        applications: applications.count ?? 0,
        interviews: interviews.count ?? 0,
        offers: offers.count ?? 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth" });
  }

  if (loading || !user) {
    return <main style={{ padding: 40, fontFamily: "system-ui" }}>Loading workspace…</main>;
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, color: "#6b7280" }}>357Network</p>
          <h1 style={{ margin: "4px 0 0", fontSize: 34 }}>Application dashboard</h1>
        </div>
        <button onClick={signOut} style={secondaryButton}>Sign out</button>
      </header>

      <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "28px 0" }}>
        <a href="/dashboard" style={navLink}>Dashboard</a>
        <a href="/jobs" style={navLink}>Jobs</a>
        <a href="/applications" style={navLink}>Applications</a>
        <a href="/documents" style={navLink}>Documents</a>
        <a href="/profile" style={navLink}>Profile</a>
        <a href="/settings" style={navLink}>Settings</a>
      </nav>

      {error ? <p style={{ color: "#b91c1c" }}>Could not load dashboard: {error}</p> : null}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
        <Metric label="Saved jobs" value={counts.jobs} />
        <Metric label="Applications" value={counts.applications} />
        <Metric label="Interviews" value={counts.interviews} />
        <Metric label="Offers" value={counts.offers} />
      </section>

      <section style={{ marginTop: 32, border: "1px solid #e5e7eb", borderRadius: 12, padding: 22 }}>
        <h2 style={{ marginTop: 0 }}>Automation status</h2>
        <p style={{ color: "#4b5563", lineHeight: 1.6 }}>
          Greenhouse automation, Browserbase provider controls, sensitive-answer gating, idempotency,
          and verified submission receipt logic are installed in this rebuild. Live employer submission
          remains disabled until the controlled provider test is explicitly configured and verified.
        </p>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
      <div style={{ color: "#6b7280", fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 700, marginTop: 8 }}>{value}</div>
    </div>
  );
}

const navLink: React.CSSProperties = {
  padding: "9px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  color: "#111827",
  textDecoration: "none",
};
const secondaryButton: React.CSSProperties = {
  padding: "9px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  cursor: "pointer",
};
