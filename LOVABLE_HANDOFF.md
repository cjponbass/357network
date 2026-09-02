# 357 Network — Lovable Production Handoff

This is a **deployment-only handoff**. The application engineering is completed in GitHub. Lovable must connect the finished release to production services and hosting; it must not redesign, rebuild, simplify, rename, remove features, or run an open-ended autonomous coding pass.

## 1. Source of truth

- Repository: `cjponbass/357network`
- Production branch: `feature/live-supabase-integration`
- Release selection rule: use the latest commit on that branch whose **Verify Job Platform** GitHub Actions workflow passes all four gates: TypeScript, zero-warning ESLint, complete Vitest suite, and production SSR build.
- Approved artwork: `public/357-network-header.jpg`
- Required tagline: `Where Opportunity Knocks for You. Automatically.`

Do **not** deploy the stale historical Lovable project snapshot or the previously published `network357.lovable.app` code as the production application.

## 2. Important Lovable/GitHub connection constraint

Lovable's normal GitHub connection flow creates/links a repository for a Lovable project; it is not a request to let Lovable rebuild this application from a prose prompt. If the existing Lovable project cannot directly select `cjponbass/357network` as its source, use this clean transfer procedure:

1. In the intended Lovable project, enable the GitHub connection and allow Lovable to create/link its normal repository.
2. Record that newly linked repository name and its default branch.
3. Transfer the **exact green release tree** from `cjponbass/357network` / `feature/live-supabase-integration` into the Lovable-linked repository. This is a source transfer, not an AI rewrite.
4. Preserve the completed `src/`, `public/`, `supabase/migrations/`, package/dependency files, and environment-variable contract.
5. Permit only the minimum host-wrapper/config changes Lovable requires to run TanStack Start on its managed platform.
6. Compare the transferred tree against the release tree before publishing. Product routes, business logic, safety gates, branding, migrations, and ATS/browser automation must not disappear during transfer.

If Lovable offers a direct supported repository-source connection that accepts the finished repository without creating a separate source tree, use that instead and skip the transfer step. The invariant is that the deployed product must be the exact verified release, not the stale Lovable shell.

## 3. Product surface that must remain intact

Preserve all completed routes and supporting server functions, including:

- `/` landing page
- `/auth`
- `/reset-password`
- `/dashboard`
- `/discover`
- `/jobs`
- `/prepare`
- `/answers`
- `/applications`
- application detail route
- `/documents`
- `/profile`
- `/settings`

Preserve job discovery, private saved jobs, AI analysis/tailoring, private document/PDF handling, saved answers, application tracking, Greenhouse/Lever/Ashby/Workday detection and mapping, Browserbase Stagehand REST automation, idempotency, blocker handling, and verified-receipt protections.

## 4. Hosting/runtime requirements

The GitHub verification build uses the TanStack Start Netlify adapter as an independently tested SSR target. For Lovable hosting, use Lovable's supported TanStack/managed runtime wrapper around the same source.

The production Browserbase path is HTTP-only Stagehand REST. It does **not** require a local Chromium or Playwright process on the Lovable runtime. The host must support:

- TanStack Start SSR/server functions
- server-only environment secrets
- outbound HTTPS requests to Supabase, OpenAI, Browserbase/Stagehand and optional discovery providers
- standard `fetch`, `FormData`, `Blob`, and Web Crypto APIs used by the application

Never expose service-role, OpenAI/model, Browserbase or discovery-provider secrets to client bundles.

## 5. Required production environment values

Configure these values in the final hosting project. Copy the names exactly from `.env.example`; never commit real values.

Required for the complete production product:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `BROWSERBASE_API_KEY`
- `AUTOMATION_ENABLE_SUBMIT=false` during deployment validation

Optional/conditional:

- `OPENAI_MODEL`
- `MODEL_API_KEY` — otherwise Stagehand reuses `OPENAI_API_KEY`
- `STAGEHAND_MODEL`
- `BROWSERBASE_PROJECT_ID`
- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`

Do not turn `AUTOMATION_ENABLE_SUBMIT=true` simply to make the deployment appear complete. That switch crosses the real-employer submission boundary and is enabled only for an explicitly approved controlled submission test or intentional production use.

## 6. Supabase account-side setup

Connect the deployed application to the intended production Supabase project, then:

1. Apply **every** SQL file in `supabase/migrations/` in filename order if the exact migration history is not already present.
2. Include `20260902153000_richer_candidate_profile.sql`; it adds the structured candidate address and richer career-fact columns used by the completed Profile/AI flow.
3. Confirm the `candidate-documents` storage bucket exists and remains private.
4. Keep all RLS/ownership policies active.
5. Keep verified-receipt immutability, submission-attempt idempotency, ownership guards and success/receipt integrity guards active.
6. Set Supabase Auth Site URL / redirect URLs to the Lovable preview while testing, then add the final `https://357network.ws` and intended `https://www.357network.ws` production URLs before cutover. Do not remove the password-recovery callback path.

If Lovable cannot perform a database/account action itself, the operator should perform that exact Supabase dashboard action and then resume the checklist. No product code rewrite is required.

## 7. External credentials/account blockers

These are the only expected non-code dependencies at handoff:

- Production Supabase project URL, publishable key and service-role key.
- OpenAI API key for AI preparation and, unless a dedicated key is provided, Stagehand model execution.
- Browserbase API key; project ID only when the account/key setup requires it.
- Optional Adzuna application ID/key for broader discovery coverage. The public fallback discovery path remains available without Adzuna.
- Access to the DNS provider controlling `357Network.ws` and `www.357network.ws`.
- Lovable workspace permission to connect the source, configure secrets, publish and attach the custom domain.

Missing credentials are **configuration blockers, not unfinished development**. Do not ask Lovable to recreate the corresponding feature because a key is missing.

## 8. Preview verification before domain cutover

With `AUTOMATION_ENABLE_SUBMIT=false`, verify on the actual Lovable preview:

1. Approved artwork and exact tagline render correctly.
2. Signup, sign-in, sign-out and password recovery work.
3. Authenticated navigation exposes Dashboard, Discover, Jobs, AI Preparation, Saved Answers, Applications, Documents, Profile and Settings.
4. Profile saves/reloads structured contact/address and richer career facts.
5. Profile-synchronized application facts remain private and are available to live ATS field mapping.
6. Settings/preferences and Saved Answers persist.
7. Job discovery works; a result can be saved; an employer application URL can be corrected; ATS detection updates.
8. Private resume/cover-letter upload works and generated tailored materials can be exported to private PDF documents.
9. AI job analysis/resume/cover-letter generation persists and remains grounded in candidate-owned facts.
10. An application can be tracked, documents selected, status/history displayed, and receipt/attempt state displayed.
11. Browserbase readiness reports healthy when its credentials are configured.
12. Greenhouse, Lever, Ashby and Workday live-form inspection can identify actual fields on test-safe targets; CAPTCHA/auth walls stop automation rather than being bypassed.
13. Private resume and cover-letter file transfers work through Browserbase Session Uploads when the live ATS requests files.
14. With `AUTOMATION_ENABLE_SUBMIT=false`, no employer submission can occur and no verified receipt can be fabricated.
15. Desktop and narrow/mobile navigation/forms remain usable.

Any failure here should first be classified as **deployment configuration/source-transfer error vs. code defect**. Do not launch a broad Lovable AI repair pass. Preserve the green source tree and correct only the bounded deployment problem.

## 9. Controlled real-submission test

Only when a real submission is explicitly appropriate:

1. Temporarily set `AUTOMATION_ENABLE_SUBMIT=true`.
2. Use exactly one controlled target.
3. Verify the provider fills only resolved user-owned facts.
4. Stop on unresolved required/sensitive/legal/demographic/compensation/work-authorization questions instead of guessing.
5. Confirm success only after concrete employer confirmation text/page state is observed.
6. Confirm exactly one verified receipt is stored and the application tracker advances appropriately.
7. Confirm repeat/idempotency protection prevents an unintended duplicate.
8. Return the flag to `false` after validation unless continuous live submissions are intentionally authorized.

## 10. Domain cutover

After the preview checks pass:

1. Attach `357Network.ws` and configure the intended `www.357network.ws` behavior in Lovable.
2. Apply the DNS records Lovable provides at the authoritative DNS provider.
3. Wait for DNS verification/SSL issuance as required by the provider.
4. Confirm both intended hostnames resolve to the production deployment and HTTPS is valid.
5. Re-run authentication, database/storage, job discovery, AI, document and Browserbase dry-run checks on the final domain.
6. Confirm `/357-network-header.jpg` loads unchanged and the exact tagline is visible.
7. Confirm no server secret is visible in page source, client bundles or client-visible diagnostics.

## 11. What Lovable is NOT being asked to do

Lovable is **not** being asked to:

- design or rebuild the product
- finish missing pages
- invent ATS adapters
- implement discovery
- create the database schema
- rewrite the UI
- replace the approved branding
- weaken RLS/security protections
- debug an undefined list of issues
- run an open-ended autonomous engineering session

Its remaining assignment is bounded: **source connection/transfer, environment secrets, Supabase account connection/migrations, managed-host wrapper, preview verification, custom domain/DNS/SSL, and final production smoke testing.**

If any external account-side action cannot be completed automatically, return the exact missing credential/account permission/DNS action to the operator; do not substitute additional product development.
