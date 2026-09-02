import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

const links = [
  ["Dashboard", "/dashboard"],
  ["Discover", "/discover"],
  ["Saved Jobs", "/jobs"],
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

  if (loading || !user || pathname === "/" || pathname === "/auth" || pathname === "/reset-password") return null;

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/auth");
  }

  return (
    <header style={headerStyle}>
      <div style={shellStyle}>
        <Link to="/dashboard" style={brandLink} aria-label={`${BRAND.name} dashboard`}>
          <span style={brandName}>{BRAND.name}</span>
          <span style={tagline}>{BRAND.tagline}</span>
        </Link>
        <nav style={navStyle} aria-label="Application workspace">
          {links.map(([label, to]) => {
            const active = pathname === to || (to === "/applications" && pathname.startsWith("/applications/"));
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                style={{ ...navItem, ...(active ? activeNavItem : null) }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <button type="button" onClick={() => void signOut()} style={signOutButton}>Sign out</button>
      </div>
    </header>
  );
}

const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  background: "rgba(255,255,255,0.97)",
  borderBottom: "1px solid #e5e7eb",
  backdropFilter: "blur(12px)",
};

const shellStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "10px 20px",
  display: "flex",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
};

const brandLink: React.CSSProperties = {
  textDecoration: "none",
  color: "#111827",
  marginRight: 6,
  flex: "0 0 auto",
};

const brandName: React.CSSProperties = { display: "block", fontWeight: 850, lineHeight: 1.05, letterSpacing: "-.02em" };
const tagline: React.CSSProperties = { display: "block", fontSize: 10, color: "#6b7280", marginTop: 3, whiteSpace: "nowrap" };
const navStyle: React.CSSProperties = { display: "flex", gap: 5, flexWrap: "wrap", flex: "1 1 680px", minWidth: 0 };
const navItem: React.CSSProperties = {
  padding: "7px 9px",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 550,
  color: "#4b5563",
  background: "transparent",
  whiteSpace: "nowrap",
};
const activeNavItem: React.CSSProperties = { fontWeight: 750, color: "#111827", background: "#f3f4f6" };
const signOutButton: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "white",
  borderRadius: 8,
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: 13,
  flex: "0 0 auto",
};
