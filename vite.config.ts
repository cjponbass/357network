import netlify from "@netlify/vite-plugin-tanstack-start";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * GitHub verification builds the application with the official TanStack Start
 * Netlify adapter so the repository has a known-good SSR production target.
 *
 * The active Browserbase automation path is the Stagehand REST provider and
 * uses outbound HTTPS rather than a local Playwright/CDP process, so the
 * application logic is also suitable for a worker-style Lovable runtime.
 * Lovable's own project wrapper supplies its managed TanStack/Cloudflare Vite
 * configuration at final connection time; that hosting wrapper must not change
 * application source under src/.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackStart(),
    react(),
    netlify({ dev: { edgeFunctions: { enabled: false } } }),
  ],
});
