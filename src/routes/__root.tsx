import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { AuthProvider } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

const siteTitle = `${BRAND.name} — ${BRAND.tagline}`;
const siteDescription = `${BRAND.tagline} Private job-application workspace with preparation, tracking, automation, and verified submission receipts.`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: siteTitle },
      { name: "description", content: siteDescription },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: BRAND.name },
      { property: "og:title", content: siteTitle },
      { property: "og:description", content: siteDescription },
      { property: "og:image", content: "/357-network-header.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: siteTitle },
      { name: "twitter:description", content: siteDescription },
      { name: "twitter:image", content: "/357-network-header.jpg" },
      { name: "theme-color", content: "#000000" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={{ background: "#ffffff" }}>
      <head>
        <HeadContent />
      </head>
      <body style={{ margin: 0, minWidth: 320, background: "#ffffff", color: "#111827" }}>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppNav />
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  );
}
