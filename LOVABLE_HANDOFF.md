# 357 Network — Lovable Production Handoff

This document is the bounded final hosting handoff. Lovable should connect and deploy the completed application; it should not redesign, rebuild, rename, simplify or invent functionality.

## Source of truth

- Repository: `cjponbass/357network`
- Production branch: `feature/live-supabase-integration`
- Release commit: use the latest commit on that branch whose **Verify Job Platform** workflow passes TypeScript, zero-warning ESLint, the complete Vitest suite and the production SSR build.
- Approved artwork: `public/357-network-header.jpg`
- Required tagline: `Where Opportunity Knocks for You. Automatically.`

## Preserve exactly

Copy/preserve the completed application source and assets, including:

- `src/`
- `public/`
- `supabase/migrations/`
- `.env.example` as the environment-name contract
- application dependencies required by the copied source

Do not substitute Lovable's stale historical project implementation for the release tree. Do not remove the `/discover`, `/jobs`, `/prepare`, `/answers`, `/applications`, `/documents`, `/profile`, `/settings`, auth or recovery routes.

## Lovable hosting wrapper

The GitHub reference build uses the official Netlify TanStack Start adapter only as an independently verified SSR build target. For Lovable hosting, use Lovable's normal managed TanStack/Cloudflare Vite wrapper around the same application source. The active Browserbase production path is HTTP-only Stagehand REST and does not require a local Chromium or Playwright process.

Lovable should make only the minimum host-wrapper/configuration changes required by its platform. No product feature changes are authorized by this handoff.

## Required production environment values

Set these as server/client environment variables in the final hosting project, matching `.env.example`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `BROWSERBASE_API_KEY`
- `AUTOMATION_ENABLE_SUBMIT=false` for initial production validation

Optional:

- `OPENAI_MODEL`
- `MODEL_API_KEY`
- `STAGEHAND_MODEL`
- `BROWSERBASE_PROJECT_ID`
- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`

Never expose server-only secrets to client bundles.

## Supabase

Connect the production application to the intended Supabase project. Apply every SQL file in `supabase/migrations/` in filename order if that exact migration set is not already applied. Confirm the private `candidate-documents` bucket exists and remains non-public. Do not weaken RLS, ownership, verified-receipt or submission-attempt integrity protections to make deployment easier.

## Deployment verification

Before attaching the domain, confirm on the Lovable preview:

1. Landing artwork/tagline render correctly.
2. Signup, sign-in, sign-out and password recovery work.
3. Authenticated navigation includes Dashboard, Discover, Jobs, AI Preparation, Saved Answers, Applications, Documents, Profile and Settings.
4. Job discovery and saving work.
5. Profile/preferences/saved answers persist.
6. Private document upload and generated-PDF export work.
7. AI preparation persists grounded results.
8. Browserbase readiness reports healthy when credentials are configured.
9. An ATS dry run with `AUTOMATION_ENABLE_SUBMIT=false` cannot submit.
10. Narrow/mobile navigation and forms remain usable.

Only after those pass should `357Network.ws` / `www.357network.ws` be attached and DNS/HTTPS verified.

## Final automated submission switch

Do not turn `AUTOMATION_ENABLE_SUBMIT` on merely to deploy. It is an irreversible-action boundary. Enable it only for an explicitly controlled real-submission test or when production automatic employer submissions are intentionally authorized.

## What Lovable is NOT being asked to do

Lovable is not being asked to audit the whole codebase, finish missing pages, invent ATS adapters, rewrite the UI, create job discovery, design new branding, change database policies, debug an undefined list of problems, or run an open-ended autonomous engineering pass. Those tasks belong in the completed source tree before this handoff.
