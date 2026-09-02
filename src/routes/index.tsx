import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/")({ component: Landing });

const capabilities = [
  ["Job workspace", "Save jobs, detect supported ATS providers, and keep the complete job description with your private application record."],
  ["AI preparation", "Generate fact-grounded fit analysis, tailored resume material, cover letters, and safe application-answer suggestions."],
  ["Reusable candidate data", "Keep your profile, private documents, and saved answers organized so you do not rebuild the same application details every time."],
  ["Application tracking", "Track drafts, submissions, interviews, offers, status history, and the evidence attached to verified automated submissions."],
  ["Conservative automation", "Unknown required questions, sensitive answers, CAPTCHAs, authentication walls, and unsupported controls stop for your input."],
  ["Verified submission receipts", "357 Network only records an automated submission as successful when concrete post-submit confirmation evidence is present."],
] as const;

const steps = [
  ["1", "Build your private profile", "Add the candidate facts, documents, preferences, and reusable answers you want available across applications."],
  ["2", "Save and prepare for a job", "Store the job, analyze fit, tailor application material, and resolve anything that needs your judgment."],
  ["3", "Track every application", "Keep the application record, status history, automation diagnostics, and verified receipt evidence together."],
] as const;

function Landing() {
  return (
    <main style={page}>
      <section style={hero}>
        <img
          src={BRAND.headerImagePath}
          alt="357 Network panoramic logo with moon, Gothic lettering, radiant sun, stars, and checkerboard floor"
          style={headerImage}
        />
        <div style={heroCopy}>
          <p style={eyebrow}>PRIVATE JOB-APPLICATION WORKSPACE</p>
          <h1 style={headline}>{BRAND.tagline}</h1>
          <p style={subhead}>
            Prepare stronger applications, reuse your information, track every opportunity, and automate supported ATS workflows without pretending a submission happened when it did not.
          </p>
          <div style={ctaRow}>
            <Link to="/auth" style={primaryCta}>Create account</Link>
            <Link to="/auth" style={secondaryCta}>Sign in</Link>
          </div>
          <p style={trustLine}>Your candidate profile, saved answers, documents, jobs, and applications remain private to your account.</p>
        </div>
      </section>

      <section style={section} aria-labelledby="capabilities-heading">
        <div style={sectionHeading}>
          <p style={eyebrow}>ONE WORKSPACE</p>
          <h2 id="capabilities-heading" style={sectionTitle}>From job discovery to verified application history</h2>
          <p style={sectionIntro}>357 Network is designed around the repetitive work that makes serious job searching exhausting, while keeping judgment and sensitive decisions with you.</p>
        </div>
        <div style={cardGrid}>
          {capabilities.map(([title, body]) => <Feature key={title} title={title} body={body} />)}
        </div>
      </section>

      <section style={darkSection} aria-labelledby="workflow-heading">
        <div style={sectionHeadingDark}>
          <p style={eyebrowLight}>A CLEAR WORKFLOW</p>
          <h2 id="workflow-heading" style={sectionTitleDark}>Prepare once. Reuse intelligently. Verify what happened.</h2>
        </div>
        <div style={stepsGrid}>
          {steps.map(([number, title, body]) => (
            <article key={number} style={stepCard}>
              <div style={stepNumber}>{number}</div>
              <h3 style={stepTitle}>{title}</h3>
              <p style={stepBody}>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={safetySection} aria-labelledby="safety-heading">
        <div>
          <p style={eyebrow}>AUTOMATION WITH BOUNDARIES</p>
          <h2 id="safety-heading" style={sectionTitle}>Built to stop when a human decision is required</h2>
        </div>
        <div style={safetyGrid}>
          <p style={safetyCopy}>357 Network does not bypass CAPTCHA or authentication controls, guess sensitive answers, or convert an uncertain browser state into a fake success.</p>
          <p style={safetyCopy}>Final automated submission remains behind an explicit production safety gate until controlled provider and ATS validation has passed.</p>
        </div>
      </section>

      <section style={finalCta}>
        <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", margin: 0, lineHeight: 1.08 }}>Put your application work in one place.</h2>
        <p style={{ color: "#4b5563", fontSize: 18, lineHeight: 1.6, maxWidth: 680, margin: "16px auto 24px" }}>Create your private workspace and start with the candidate information you already reuse from application to application.</p>
        <Link to="/auth" style={primaryCta}>Open 357 Network</Link>
      </section>

      <footer style={footer}>
        <strong>{BRAND.name}</strong>
        <span>{BRAND.tagline}</span>
        <span>{BRAND.domain}</span>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <article style={card}>
      <h3 style={{ fontSize: 19, margin: 0 }}>{title}</h3>
      <p style={{ color: "#4b5563", lineHeight: 1.62, margin: "10px 0 0" }}>{body}</p>
    </article>
  );
}

const page: React.CSSProperties = { fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#111827", background: "#ffffff" };
const hero: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "28px 24px 72px" };
const headerImage: React.CSSProperties = { width: "100%", maxWidth: 1180, display: "block", margin: "0 auto", objectFit: "contain", borderRadius: 16, background: "#000", boxShadow: "0 18px 60px rgba(0,0,0,.16)" };
const heroCopy: React.CSSProperties = { maxWidth: 840, margin: "48px auto 0", textAlign: "center" };
const eyebrow: React.CSSProperties = { margin: "0 0 12px", fontSize: 12, fontWeight: 800, letterSpacing: ".16em", color: "#6b7280" };
const eyebrowLight: React.CSSProperties = { ...eyebrow, color: "#d1d5db" };
const headline: React.CSSProperties = { margin: 0, fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 1.02, letterSpacing: "-.04em" };
const subhead: React.CSSProperties = { maxWidth: 760, margin: "22px auto 0", color: "#4b5563", fontSize: "clamp(18px, 2.2vw, 21px)", lineHeight: 1.65 };
const ctaRow: React.CSSProperties = { display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap", justifyContent: "center" };
const primaryCta: React.CSSProperties = { display: "inline-block", padding: "13px 19px", background: "#111827", color: "white", borderRadius: 10, textDecoration: "none", fontWeight: 750, boxShadow: "0 8px 24px rgba(17,24,39,.16)" };
const secondaryCta: React.CSSProperties = { display: "inline-block", padding: "13px 19px", border: "1px solid #d1d5db", color: "#111827", background: "white", borderRadius: 10, textDecoration: "none", fontWeight: 700 };
const trustLine: React.CSSProperties = { margin: "18px auto 0", color: "#6b7280", fontSize: 13, lineHeight: 1.5 };
const section: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "72px 24px" };
const sectionHeading: React.CSSProperties = { maxWidth: 780, marginBottom: 30 };
const sectionHeadingDark: React.CSSProperties = { ...sectionHeading, marginLeft: "auto", marginRight: "auto", textAlign: "center" };
const sectionTitle: React.CSSProperties = { margin: 0, fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.08, letterSpacing: "-.025em" };
const sectionTitleDark: React.CSSProperties = { ...sectionTitle, color: "white" };
const sectionIntro: React.CSSProperties = { margin: "16px 0 0", color: "#4b5563", fontSize: 18, lineHeight: 1.65 };
const cardGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 };
const card: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 14, padding: 22, background: "#fff", boxShadow: "0 8px 26px rgba(17,24,39,.045)" };
const darkSection: React.CSSProperties = { background: "#09090b", padding: "78px max(24px, calc((100vw - 1132px) / 2))" };
const stepsGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, maxWidth: 1132, margin: "32px auto 0" };
const stepCard: React.CSSProperties = { border: "1px solid #27272a", borderRadius: 14, padding: 24, background: "#111113" };
const stepNumber: React.CSSProperties = { width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 999, background: "white", color: "#111827", fontWeight: 900, marginBottom: 18 };
const stepTitle: React.CSSProperties = { margin: 0, color: "white", fontSize: 20 };
const stepBody: React.CSSProperties = { color: "#d1d5db", lineHeight: 1.62, marginBottom: 0 };
const safetySection: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "78px 24px", display: "grid", gap: 30 };
const safetyGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 };
const safetyCopy: React.CSSProperties = { margin: 0, padding: 22, borderRadius: 14, background: "#f9fafb", border: "1px solid #e5e7eb", color: "#374151", fontSize: 17, lineHeight: 1.65 };
const finalCta: React.CSSProperties = { maxWidth: 900, margin: "24px auto 84px", padding: "50px 24px", textAlign: "center", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" };
const footer: React.CSSProperties = { minHeight: 78, background: "#f9fafb", borderTop: "1px solid #e5e7eb", padding: "22px 24px", display: "flex", gap: 14, alignItems: "center", justifyContent: "center", flexWrap: "wrap", color: "#6b7280", fontSize: 13 };
