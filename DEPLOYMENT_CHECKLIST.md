# 357 Network — Production Deployment Checklist

**Where Opportunity Knocks for You. Automatically.**

This checklist applies to the active `job-platform-rebuild` branch and the TanStack Start + Netlify rebuild. Do not use the legacy Next.js deployment instructions elsewhere in the repository.

## 1. Release gate

- [ ] Branch is `job-platform-rebuild`.
- [ ] Latest **Verify Job Platform** workflow is green.
- [ ] TypeScript passes.
- [ ] ESLint passes with zero warnings.
- [ ] Vitest passes.
- [ ] Netlify production build passes.
- [ ] Approved header asset exists at `/public/357-network-header.jpg`.
- [ ] Official tagline remains exactly: `Where Opportunity Knocks for You. Automatically.`

## 2. Runtime and package tooling

- [ ] Node.js 22 or newer is selected in Netlify.
- [ ] pnpm 10.15.0 is used for dependency installation.
- [ ] Build command uses the repository build script: `pnpm run build`.
- [ ] Netlify uses the official TanStack Start Vite adapter configured by the repository.
- [ ] Do not restore the obsolete Next.js `.next` publish configuration.

## 3. Production environment configuration

Configure values in Netlify environment settings. **Never paste real secret values into this file or commit them to GitHub.**

Required application configuration:

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] server-side Supabase URL/key variables required by the current server helpers
- [ ] `OPENAI_API_KEY`
- [ ] optional OpenAI model override, if intentionally used
- [ ] `BROWSERBASE_API_KEY`
- [ ] `BROWSERBASE_PROJECT_ID`
- [ ] `AUTOMATION_ENABLE_SUBMIT=false`

Keep `AUTOMATION_ENABLE_SUBMIT=false` through deployment, authentication testing, Browserbase connectivity testing, and ATS dry runs. Enable it only for an explicitly controlled verified-submission test after all prior gates pass.

## 4. Supabase production data plane

From the authenticated Settings readiness diagnostic, confirm:

- [ ] Supabase server configuration is present.
- [ ] Supabase browser configuration is present.
- [ ] Production database is reachable.
- [ ] All critical SaaS tables are present and queryable.
- [ ] Private `candidate-documents` storage bucket is reachable.
- [ ] Candidate/job/application/document ownership protections are active.
- [ ] Submission receipt and attempt integrity migrations are applied.
- [ ] Verified receipts are immutable and non-deletable.
- [ ] A succeeded attempt requires a verified receipt for the same application.

Do not bypass failed readiness checks. Correct the production configuration or migration state first.

## 5. Authentication smoke test

Using a non-production test user:

- [ ] Sign up with the enforced minimum password policy.
- [ ] Sign in.
- [ ] Confirm authenticated navigation appears.
- [ ] Confirm user-owned data is isolated from other users.
- [ ] Request password reset email.
- [ ] Complete `/reset-password` with a valid recovery session.
- [ ] Sign out and confirm protected routes require authentication.

## 6. Core SaaS smoke test

- [ ] Dashboard loads.
- [ ] Save a job with title, company, location, URL, and full job description.
- [ ] ATS detection correctly identifies supported trusted hosts only.
- [ ] Track the saved job as an application.
- [ ] Candidate Profile saves and reloads.
- [ ] Settings/preferences save and reload.
- [ ] Upload a test resume to private Documents storage.
- [ ] Mark a default resume.
- [ ] Add and edit a Saved Answer.
- [ ] Application Detail loads the correct owned application.
- [ ] Status history remains consistent with the application tracker.

## 7. AI preparation smoke test

- [ ] Authenticated user opens AI Preparation for a specific owned job.
- [ ] Fit analysis completes and persists.
- [ ] Resume tailoring stays grounded in candidate facts.
- [ ] Cover-letter generation stays grounded in candidate facts.
- [ ] Sensitive or unsupported questions return `Needs your input` rather than guessed answers.
- [ ] Generated application materials reload from private persisted records.

## 8. Browserbase / ATS dry-run validation

With `AUTOMATION_ENABLE_SUBMIT=false`:

- [ ] Settings reports Browserbase configuration present and executable.
- [ ] Start only a controlled dry-run against a test-safe application target.
- [ ] Greenhouse adapter maps expected fields and stops on unresolved required questions.
- [ ] Lever adapter maps expected fields and stops on unresolved required questions.
- [ ] Ashby adapter maps expected fields and stops on unresolved required questions.
- [ ] Workday adapter stops on login walls, CAPTCHA/bot checks, unsupported widgets, or unresolved tenant-specific fields.
- [ ] No CAPTCHA, login, or anti-bot control is bypassed.
- [ ] Private resume/cover-letter files remain server-controlled.
- [ ] Dry runs never create a verified submission receipt.
- [ ] UI never claims an employer submission occurred without concrete confirmation evidence.

## 9. Controlled verified-submission test

Only after sections 1–8 pass:

- [ ] Use an explicitly approved test target where a real submission is appropriate.
- [ ] Temporarily set `AUTOMATION_ENABLE_SUBMIT=true`.
- [ ] Confirm the server-side final-submit gate also sees an executable browser provider.
- [ ] Run one controlled submission.
- [ ] Verify concrete ATS/employer confirmation evidence exists before success is recorded.
- [ ] Confirm exactly one verified receipt is created for the application.
- [ ] Confirm the submission attempt references that same verified receipt.
- [ ] Confirm the tracked application advances from `draft` to `submitted` without regressing later statuses.
- [ ] Confirm duplicate retry/idempotency protections prevent an unintended second submission.
- [ ] Return `AUTOMATION_ENABLE_SUBMIT=false` immediately after validation unless production submission has been explicitly approved.

## 10. Domain cutover to 357Network.ws

- [ ] Deploy the validated `job-platform-rebuild` build to the production Netlify site.
- [ ] Attach/confirm `357Network.ws` and intended `www` behavior in Netlify.
- [ ] Confirm DNS resolves to the intended Netlify site.
- [ ] Confirm HTTPS certificate is valid.
- [ ] Confirm the approved panoramic header artwork loads from `/357-network-header.jpg`.
- [ ] Confirm the official tagline is displayed correctly where a tagline is appropriate.
- [ ] Re-run authentication, database, storage, AI, and dry-run readiness checks on the production domain.
- [ ] Confirm baseline security headers are present.
- [ ] Confirm no secrets are exposed in page source, browser bundles, logs, or client-visible readiness responses.

## 11. Rollback rule

If any release gate fails:

1. Keep `AUTOMATION_ENABLE_SUBMIT=false`.
2. Do not claim the application workflow is production-ready.
3. Roll back the Netlify deployment to the last verified build if the live site is affected.
4. Fix the failing configuration/code/migration on `job-platform-rebuild`.
5. Require a new green GitHub verification run and repeat the affected smoke tests before redeploying.

## Go-live record

- Deployment date: ____________________
- Commit SHA: _________________________
- GitHub verification run: ____________
- Netlify deploy ID: ___________________
- Supabase readiness: PASS / FAIL
- Browserbase dry run: PASS / FAIL
- Controlled verified submission: PASS / NOT YET RUN
- Domain smoke test: PASS / FAIL
- Final status: TESTING / READY / LIVE / ROLLED BACK
