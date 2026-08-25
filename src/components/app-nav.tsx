import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

const links = [
  ["Dashboard", "/dashboard"],
  ["Jobs", "/jobs"],
  ["AI Preparation", "/prepare"],
  ["Saved Answers", "/answers"],
  ["Applications", "/applications"],
  ["Documents", "/documents"],
  ["Profile", "/profile"],
  ["Settings", "/settings"],
] as const;

export function AppNav() {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (loading || !user || pathname === "/" || pathname === "/auth") return null;

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/auth");
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(255,255,255,0.96)",
        borderBottom: "1px solid #e5e7eb",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link to="/dashboard" style={{ textDecoration: "none", color: "#111827", marginRight: 8 }}>
          <span style={{ display: "block", fontWeight: 800, lineHeight: 1.1 }}>{BRAND.name}</span>
          <span style={{ display: "block", fontSize: 10, color: "#6b7280", marginTop: 2 }}>{BRAND.tagline}</span>
        </Link>
        <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }} aria-label="Application">
          {links.map(([label, to]) => {
            const active = pathname === to || (to === "/applications" && pathname.startsWith("/applications/"));
            return (
              <Link
                key={to}
                to={to}
                style={{
                  padding: "7px 9px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#111827" : "#4b5563",
                  background: active ? "#f3f4f6" : "transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => void signOut()}
          style={{
            border: "1px solid #d1d5db",
            background: "white",
            borderRadius: 8,
            padding: "7px 10px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
