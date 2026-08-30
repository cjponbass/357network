import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { WORK_ARRANGEMENT_LABELS, type WorkArrangement } from "@/lib/domain-types";
import { getDeploymentStatus, type DeploymentStatus } from "@/lib/system/status.functions";

export const Route = createFileRoute("/settings")({ component: SettingsPage });
const ARRANGEMENTS: WorkArrangement[] = ["onsite", "hybrid", "remote"];

function SettingsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [titles, setTitles] = useState("");
  const [locations, setLocations] = useState("");
  const [arrangements, setArrangements] = useState<WorkArrangement[]>([]);
  const [minSalary, setMinSalary] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [deployment, setDeployment] = useState<DeploymentStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data, error: loadError }, deploymentStatus] = await Promise.all([
      supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      getDeploymentStatus().catch(() => null),
    ]);
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setDeployment(deploymentStatus);
    if (!data) return;
    setTitles((data.desired_titles ?? []).join(", "));
    setLocations((data.desired_locations ?? []).join(", "));
    setArrangements(data.work_arrangements ?? []);
    setMinSalary(data.min_salary == null ? "" : String(data.min_salary));
    setCurrency(data.currency ?? "USD");
    setEmailNotifications(data.email_notifications);
    setWeeklyDigest(data.weekly_digest);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setMessage(null);
    setError(null);

    const normalizedMinSalary = minSalary.trim();
    const parsedMinSalary = normalizedMinSalary ? Number(normalizedMinSalary) : null;
    if (parsedMinSalary !== null && (!Number.isFinite(parsedMinSalary) || parsedMinSalary < 0)) {
      setError("Minimum salary must be a valid non-negative number.");
      setBusy(false);
      return;
    }

    const { error: saveError } = await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        desired_titles: splitList(titles),
        desired_locations: splitList(locations),
        work_arrangements: arrangements,
        min_salary: parsedMinSalary,
        currency: currency.trim() ? currency.trim().toUpperCase() : null,
        email_notifications: emailNotifications,
        weekly_digest: weeklyDigest,
      },
      { onConflict: "user_id" },
    );
    if (saveError) setError(saveError.message);
    else setMessage("Preferences saved.");
    setBusy(false);
  }

  if (loading || !user) return <main style={pageStyle}>Loading settings…</main>;

  return (
    <main style={pageStyle}>
      <Nav />
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Settings</h1>
      <p style={{ color: "#4b5563" }}>Preferences that will drive matching, search, and notifications.</p>

      <form onSubmit={save} style={panelStyle}>
        <div style={gridStyle}>
          <Field label="Desired titles (comma separated)" value={titles} set={setTitles} />
          <Field label="Desired locations (comma separated)" value={locations} set={setLocations} />
          <Field label="Minimum salary" type="number" value={minSalary} set={setMinSalary} />
          <Field label="Currency" value={currency} set={setCurrency} />
        </div>
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Work arrangements</legend>
          <div style={checkRow}>
            {ARRANGEMENTS.map((value) => (
              <label key={value} style={checkLabel}>
                <input
                  type="checkbox"
                  checked={arrangements.includes(value)}
                  onChange={(e) =>
                    setArrangements((prev) =>
                      e.target.checked
                        ? [...new Set([...prev, value])]
                        : prev.filter((v) => v !== value),
                    )
                  }
                />
                {WORK_ARRANGEMENT_LABELS[value]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Notifications</legend>
          <div style={checkRow}>
            <label style={checkLabel}>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
              Email notifications
            </label>
            <label style={checkLabel}>
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
              />
              Weekly digest
            </label>
          </div>
        </fieldset>
        <button disabled={busy} style={primaryButton}>
          {busy ? "Saving…" : "Save preferences"}
        </button>
      </form>

      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Deployment readiness</h2>
            <p style={{ margin: "6px 0 0", color: "#4b5563" }}>
              Checks configuration, the critical database schema, and live Supabase storage reachability. Secret values are never returned to the browser.
            </p>
          </div>
          <button type="button" style={secondaryButton} onClick={() => void load()}>
            Recheck readiness
          </button>
        </div>
        {deployment ? (
          <>
            <div style={gridStyle}>
              <Status label="Manual workspace" ok={deployment.readyForManualUse} />
              <Status label="AI preparation" ok={deployment.readyForAiPreparation} />
              <Status label="Automation dry run" ok={deployment.readyForAutomationDryRun} />
              <Status label="Verified submission" ok={deployment.readyForVerifiedSubmission} />
              <Status label="Supabase server config" ok={deployment.supabaseServer} />
              <Status label="Supabase database reachable" ok={deployment.supabaseServerReachable} />
              <Status label="Critical database schema" ok={deployment.criticalSchemaReady} />
              <Status label="Private document storage" ok={deployment.candidateDocumentsBucketReady} />
              <Status label="Supabase browser config" ok={deployment.supabaseClient} />
              <Status label="AI provider" ok={deployment.aiConfigured} />
              <Status
                label={`Browser provider${deployment.browserProvider ? ` (${deployment.browserProvider})` : ""}`}
                ok={deployment.browserProviderExecutable}
              />
            </div>
            {deployment.missingCriticalTables.length ? (
              <p style={{ margin: 0, color: "#92400e" }}>
                Missing or unreachable critical tables: {deployment.missingCriticalTables.join(", ")}
              </p>
            ) : null}
            {deployment.readinessNotes.length ? (
              <div style={{ border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 10, padding: 14 }}>
                <strong>Readiness notes</strong>
                <ul style={{ marginBottom: 0 }}>
                  {deployment.readinessNotes.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </div>
            ) : (
              <p style={{ margin: 0, color: "#047857" }}>No configuration warnings detected.</p>
            )}
          </>
        ) : (
          <p style={{ margin: 0, color: "#92400e" }}>Deployment diagnostics are not available yet.</p>
        )}
        {deployment?.missingBrowserConfig.length ? (
          <p style={{ margin: 0, color: "#92400e" }}>
            Browser automation still needs: {deployment.missingBrowserConfig.join(", ")}
          </p>
        ) : null}
        {deployment?.browserProviderConfigured && !deployment.submitEnabled ? (
          <p style={{ margin: 0, color: "#4b5563" }}>
            Final automated submit remains intentionally disabled until controlled end-to-end testing is complete.
          </p>
        ) : null}
      </section>

      <section style={panelStyle}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Account</h2>
        <p style={{ margin: 0, color: "#4b5563" }}>Signed in as {user.email}</p>
      </section>
      {message ? <p style={{ color: "#047857" }}>{message}</p> : null}
      {error ? <p role="alert" style={{ color: "#b91c1c" }}>{error}</p> : null}
    </main>
  );
}

function Status({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
      <strong>{label}</strong>
      <div style={{ marginTop: 5, color: ok ? "#047857" : "#92400e" }}>
        {ok ? "Ready" : "Needs configuration"}
      </div>
    </div>
  );
}

function splitList(value: string) {
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

function Field({ label, value, set, type = "text" }: { label: string; value: string; set: (value: string) => void; type?: string }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      <input type={type} value={value} onChange={(e) => set(e.target.value)} style={inputStyle} />
    </label>
  );
}

function Nav() {
  return (
    <nav style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 28 }}>
      <a href="/dashboard" style={navLink}>Dashboard</a>
      <a href="/jobs" style={navLink}>Jobs</a>
      <a href="/applications" style={navLink}>Applications</a>
      <a href="/documents" style={navLink}>Documents</a>
      <a href="/profile" style={navLink}>Profile</a>
    </nav>
  );
}

const pageStyle: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui" };
const navLink: React.CSSProperties = { color: "#1d4ed8", textDecoration: "none" };
const panelStyle: React.CSSProperties = { display: "grid", gap: 18, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, margin: "28px 0" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 };
const inputStyle: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "11px 12px", fontSize: 16 };
const fieldsetStyle: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 };
const legendStyle: React.CSSProperties = { fontWeight: 700, padding: "0 6px" };
const checkRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 18 };
const checkLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7 };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 8, padding: "11px 14px", background: "#111827", color: "white", cursor: "pointer", width: "fit-content" };
const secondaryButton: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", background: "white", color: "#111827", cursor: "pointer", width: "fit-content" };
