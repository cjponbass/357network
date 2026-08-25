import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px 64px", fontFamily: "system-ui" }}>
      <section style={{ textAlign: "center" }}>
        <img
          src={BRAND.headerImagePath}
          alt="357 Network panoramic logo with moon, Gothic lettering, radiant sun, stars, and checkerboard floor"
          style={{ width: "100%", maxWidth: 1120, display: "block", margin: "0 auto", objectFit: "contain" }}
        />
        <p style={{ fontSize: 22, fontWeight: 700, margin: "22px 0 8px" }}>{BRAND.tagline}</p>
        <p style={{ maxWidth: 720, margin: "0 auto", fontSize: 18, lineHeight: 1.6, color: "#4b5563" }}>
          A private job-application workspace for saved jobs, AI preparation, reusable documents and answers,
          ATS automation, application tracking, and verified submission receipts.
        </p>
      </section>

      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          to="/auth"
          style={{ padding: "11px 16px", background: "#111827", color: "white", borderRadius: 8, textDecoration: "none" }}
        >
          Sign in / Sign up
        </Link>
        <Link
          to="/dashboard"
          style={{ padding: "11px 16px", border: "1px solid #d1d5db", color: "#111827", borderRadius: 8, textDecoration: "none" }}
        >
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
