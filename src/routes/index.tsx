import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "64px 24px", fontFamily: "system-ui" }}>
      <p style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase" }}>
        357Network job application platform
      </p>
      <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: "12px 0 16px" }}>
        Manage, prepare, automate, and verify job applications
      </h1>
      <p style={{ maxWidth: 680, fontSize: 18, lineHeight: 1.6 }}>
        The rebuild is active. This route is intentionally minimal while the authenticated
        workspace and automation UI are migrated and verified.
      </p>
      <p style={{ marginTop: 28 }}>
        <Link to="/">357Network</Link>
      </p>
    </main>
  );
}
