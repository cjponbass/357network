import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "64px 24px", fontFamily: "system-ui" }}>
      <p style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b7280" }}>
        357Network job application platform
      </p>
      <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: "12px 0 16px" }}>
        Manage, prepare, automate, and verify job applications
      </h1>
      <p style={{ maxWidth: 680, fontSize: 18, lineHeight: 1.6, color: "#4b5563" }}>
        A private workspace for saved jobs, application tracking, reusable documents and answers,
        ATS automation, and verified submission receipts.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
        <Link to="/auth" style={{ padding: "11px 16px", background: "#111827", color: "white", borderRadius: 8, textDecoration: "none" }}>
          Sign in / Sign up
        </Link>
        <Link to="/dashboard" style={{ padding: "11px 16px", border: "1px solid #d1d5db", color: "#111827", borderRadius: 8, textDecoration: "none" }}>
          Open workspace
        </Link>
      </div>
      <section style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Feature title="Application workspace" body="Track jobs, applications, interviews, offers, documents, and reusable answers." />
        <Feature title="Safe automation" body="Required unknown or sensitive answers stop for user input; CAPTCHA and authentication are never bypassed." />
        <Feature title="Verified receipts" body="A successful automated submission must produce concrete confirmation evidence before a receipt is created." />
      </section>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
      <h2 style={{ fontSize: 18, marginTop: 0 }}>{title}</h2>
      <p style={{ color: "#4b5563", lineHeight: 1.55, marginBottom: 0 }}>{body}</p>
    </div>
  );
}
