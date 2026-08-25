import netlify from "@netlify/vite-plugin-tanstack-start";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * 357Network deploys on Netlify. Use Netlify's official TanStack Start adapter
 * so server functions run in Netlify's Node-compatible function runtime rather
 * than Lovable's Cloudflare worker preset. Browserbase connects to a remote
 * browser over CDP and therefore must remain in a Node server environment.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackStart(),
    react(),
    netlify({ dev: { edgeFunctions: { enabled: false } } }),
  ],
});
