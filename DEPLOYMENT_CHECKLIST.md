# 357 Network — Production Deployment Checklist

**Where Opportunity Knocks for You. Automatically.**

This checklist applies to the active production branch `feature/live-supabase-integration` and the TanStack Start application under `src/`. Historical Next.js or `job-platform-rebuild` instructions are obsolete.

## 1. Release gate

- [ ] Exact release commit is on `feature/live-supabase-integration`.
- [ ] Latest **Verify Job Platform** workflow is green for that exact commit.
- [ ] TypeScript passes.
- [ ] ESLint passes with zero warnings.
- [ ] Full Vitest suite passes.
- [ ] Production SSR build passes.
- [ ] Approved header asset exists at `/public/357-network-header.jpg`.
- [ ] Official tagline remains exactly `Where Opportunity Knocks for You. Automatically.`
- [ ] Product surface includes landing, auth/recovery, dashboard, Discover, Saved Jobs, AI Preparation, Saved Answers, Applications, Documents, Profile and Settings.

## 2. Runtime contract

- [ ] Host supports TanStack Start SSR/server functions.
- [ ] Server functions can read server-only environment secrets and make outbound HTTPS requests.
- [ ] Active browser automation uses Browserbase Stagehand REST over HTTPS; no local Chromium/Playwright process is required for production execution.
- [ ] Client bundles never receive Supabase service-role, OpenAI/model, Browserbase, or job-source secrets.
- [ ] GitHub's reference production build uses Node 22+ and pnpm 10.15.0.

## 3. Production environment configuration

Configure these values in the final host. Never commit real secrets.

Required for the complete product:

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `BROWSERBASE_API_KEY`
- [ ] `AUTOMATION_ENABLE_SUBMIT=false` during deployment validation

Optional:

- [ ] `OPENAI_MODEL` — AI preparation model override
- [ ] `MODEL_API_KEY` — dedicated Stagehand model key; otherwise Stagehand reuses `OPENAI_API_KEY`
- [ ] `STAGEHAND_MODEL` — defaults to `openai/gpt-5.4-mini`
- [ ] `BROWSERBASE_PROJECT_ID` — supported for older/non-project-scoped setups; current project-scoped Browserbase API keys do not require it
- [ ] `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` — broader job-discovery coverage; public fallback search remains available without them

Keep `AUTOMATION_ENABLE_SUBMIT=false` through deployment, authentication testing, provider connectivity testing and ATS dry runs. Set it to `true` only for an explicitly approved controlled real-submission test or intentional production submissions.

## 4. Supabase production data plane

From authenticated Settings readiness diagnostics, confirm:

- [ ] Supabase server and browser configuration are present.
- [ ] Production database is reachable.
- [ ] Every migration in `supabase/migrations/` is applied in filename order.
- [ ] Critical SaaS tables are present and queryable.
- [ ] `candidate-documents` storage bucket exists and is private.
- [ ] User-owned jobs, candidate data, documents, answers, analyses, materials and applications are isolated by ownership/RLS protections.
- [ ] Application/job and generated-material ownership guards are active.
- [ ] Submission-attempt and verified-receipt integrity guards are active.
- [ ] Verified receipts are immutable/non-deletable and a succeeded attempt cannot point to an invalid receipt.

## 5. Authentication smoke test

Using a test user:

- [ ] Sign up with the enforced password policy.
- [ ] Sign in and confirm authenticated navigation.
- [ ] Request and complete password recovery through `/reset-password`.
- [ ] Sign out and confirm protected routes require authentication.
- [ ] With a second test user, confirm user-owned data cannot be read across accounts.

## 6. Job discovery and saved jobs

- [ ] `/discover` loads for an authenticated user.
- [ ] Public fallback search works without Adzuna credentials.
- [ ] If Adzuna is configured, source status is reported and results are merged without silent duplication.
- [ ] Role/keyword, location, country and remote filters work.
- [ ] A discovered job saves into the user's private workspace.
- [ ] Saved job title/company/location/description/source URL persist.
- [ ] User can replace an aggregator URL with the employer's actual application-form URL.
- [ ] ATS detection recalculates when the application URL changes.

## 7. Candidate data, documents and AI preparation

- [ ] Candidate Profile saves and reloads.
- [ ] Settings/preferences save and reload.
- [ ] Resume uploads to private Documents storage and can be marked default.
- [ ] Saved Answers can be added/edited.
- [ ] Fit analysis persists for an owned job.
- [ ] Tailored resume and cover-letter generation remain grounded in candidate facts.
- [ ] Sensitive or unsupported questions return `Needs your input` instead of guessed answers.
- [ ] Tailored resume and cover letter can be exported as private PDF Documents and selected for an application.

## 8. Application tracker

- [ ] A saved job can be tracked as an application.
- [ ] Application Detail is owner-only.
- [ ] Resume/cover-letter selections persist.
- [ ] Status history and current tracker status remain consistent.
- [ ] A saved job with a tracked application cannot be deleted accidentally.
- [ ] Submission attempts and verified receipts display accurately.

## 9. Browserbase / ATS dry run

With `AUTOMATION_ENABLE_SUBMIT=false`:

- [ ] Settings reports Browserbase configured, executable and health-verified.
- [ ] Controlled dry runs use test-safe application targets.
- [ ] Greenhouse, Lever, Ashby and Workday targets are detected only on trusted supported hosts.
- [ ] Live form inspection detects required fields plus CAPTCHA/authentication blockers.
- [ ] Ordinary text fields fill only from resolved candidate data.
- [ ] Native selects/checkboxes require explicit resolved choices; unsupported/radio choices are not guessed.
- [ ] Private resume/cover-letter files are fetched only for the owning user and transferred server-to-Browserbase via Session Uploads.
- [ ] CAPTCHA, login and anti-bot gates are never bypassed.
- [ ] Dry runs cannot create a verified submission receipt or claim the employer received an application.

## 10. Controlled verified-submission test

Only after sections 1–9 pass and only on a target where a real submission is explicitly appropriate:

- [ ] Temporarily set `AUTOMATION_ENABLE_SUBMIT=true`.
- [ ] Confirm the final-submit server gate sees a healthy executable provider.
- [ ] Run exactly one controlled submission.
- [ ] Record success only after concrete confirmation text/page state is verified.
- [ ] Exactly one verified receipt is created for the correct application.
- [ ] The attempt references that same receipt.
- [ ] Tracker advances from `draft` to `submitted` without regressing later statuses.
- [ ] Retry/idempotency protections prevent an unintended duplicate submission.
- [ ] Return `AUTOMATION_ENABLE_SUBMIT=false` after validation unless live automated submissions are intentionally enabled.

## 11. Lovable connection — deployment only

Lovable receives the finished application. It is not assigned product-development work.

- [ ] Use the exact green release tree as the source of application code and assets.
- [ ] Preserve all `src/`, `public/`, Supabase migrations and production environment names.
- [ ] Use Lovable's managed TanStack/Cloudflare Vite wrapper for hosting; do not rewrite application functionality.
- [ ] Configure the environment values in section 3.
- [ ] Connect/confirm Supabase and ensure migrations/storage are present.
- [ ] Build and preview without an open-ended AI coding prompt.
- [ ] Run sections 5–9 against the deployed preview.
- [ ] Do not change the approved artwork or tagline.

## 12. 357Network.ws cutover

- [ ] Attach `357Network.ws` and intended `www.357network.ws` behavior.
- [ ] Confirm DNS resolves to the production deployment.
- [ ] Confirm HTTPS certificate is valid.
- [ ] Confirm `/357-network-header.jpg` loads unchanged.
- [ ] Confirm official tagline is displayed correctly.
- [ ] Test desktop and narrow/mobile navigation and core forms.
- [ ] Re-run authentication, database, storage, job discovery, AI and Browserbase dry-run checks on the production domain.
- [ ] Confirm security headers are present where supported by the hosting layer.
- [ ] Confirm no server secrets appear in page source, browser bundles, logs or client-visible diagnostics.

## 13. Rollback rule

If a gate fails, keep `AUTOMATION_ENABLE_SUBMIT=false`, leave the last verified deployment intact, fix the repository/configuration rather than delegating an open-ended repair to a hosting AI agent, require a new green verification run, then repeat the affected smoke tests.

## Go-live record

- Deployment date: ____________________
- Release commit SHA: _________________
- GitHub verification run: ____________
- Hosting deployment ID: ______________
- Supabase readiness: PASS / FAIL
- Job discovery smoke test: PASS / FAIL
- AI/document smoke test: PASS / FAIL
- Browserbase dry run: PASS / FAIL
- Controlled verified submission: PASS / NOT YET RUN
- Domain smoke test: PASS / FAIL
- Final status: TESTING / READY / LIVE / ROLLED BACK
