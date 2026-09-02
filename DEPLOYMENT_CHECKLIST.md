# 357 Network — Production Deployment Checklist

**Where Opportunity Knocks for You. Automatically.**

This checklist applies to the active production branch `feature/live-supabase-integration` and the TanStack Start application under `src/`. Do not use historical Next.js or `job-platform-rebuild` deployment instructions.

## 1. Release gate

- [ ] Branch is `feature/live-supabase-integration`.
- [ ] Latest **Verify Job Platform** workflow is green for the exact release commit.
- [ ] TypeScript passes.
- [ ] ESLint passes with zero warnings.
- [ ] Full Vitest suite passes.
- [ ] Production SSR build passes.
- [ ] Approved header asset exists at `/public/357-network-header.jpg`.
- [ ] Official tagline remains exactly: `Where Opportunity Knocks for You. Automatically.`
- [ ] Product-surface contract includes Discover, Saved Jobs, AI Preparation, Documents, Applications, Profile, Settings, auth and recovery.

## 2. Runtime and package tooling

- [ ] Node.js 22 or newer is available to the production SSR runtime.
- [ ] pnpm 10.15.0 is used for dependency installation.
- [ ] Build command uses `pnpm run build`.
- [ ] Server-only runtime supports environment secrets, outbound HTTPS, Browserbase CDP connectivity and the Node APIs used by server automation.
- [ ] Client bundles never receive service-role, OpenAI, Browserbase or job-source secrets.

## 3. Production environment configuration

Configure the following in the final host. **Never paste real secret values into this file or commit them to GitHub.**

Required:

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] optional `OPENAI_MODEL`
- [ ] `BROWSERBASE_API_KEY`
- [ ] `BROWSERBASE_PROJECT_ID`
- [ ] `AUTOMATION_ENABLE_SUBMIT=false`

Optional broader job-search source:

- [ ] `ADZUNA_APP_ID`
- [ ] `ADZUNA_APP_KEY`

The public fallback job source remains available without Adzuna credentials.

Keep `AUTOMATION_ENABLE_SUBMIT=false` through deployment, authentication testing, Browserbase connectivity testing, ATS dry runs and all non-submission smoke tests.

## 4. Supabase production data plane

From authenticated Settings readiness diagnostics, confirm:

- [ ] Supabase server configuration is present.
- [ ] Supabase browser configuration is present.
- [ ] Production database is reachable.
- [ ] All migrations are applied through the release commit.
- [ ] All critical SaaS tables are present and queryable.
- [ ] Private `candidate-documents` storage bucket is reachable.
- [ ] Saved jobs are readable only by their owner.
- [ ] Candidate/job/application/document ownership protections are active.
- [ ] Submission receipt and attempt integrity migrations are active.
- [ ] Verified receipts are immutable and non-deletable.
- [ ] A succeeded attempt requires a verified receipt for the same application.

## 5. Authentication smoke test

Using a non-production test user:

- [ ] Sign up with the enforced password policy.
- [ ] Sign in.
- [ ] Confirm authenticated navigation appears.
- [ ] Confirm user-owned data is isolated from another test user.
- [ ] Request a password-reset email.
- [ ] Complete `/reset-password` with a valid recovery session.
- [ ] Sign out and confirm protected routes require authentication.

## 6. Job discovery and saved-job smoke test

- [ ] `/discover` loads for an authenticated user.
- [ ] Public fallback search returns results without an Adzuna key.
- [ ] If Adzuna is configured, both source statuses are displayed.
- [ ] Search filters accept role/keywords, location, country and remote preference.
- [ ] A discovered job can be saved to the user's private workspace.
- [ ] Duplicate source URLs are not silently duplicated.
- [ ] Saved job title/company/location/description/source URL persist correctly.
- [ ] User can replace an aggregator listing URL with the employer's actual application-form URL.
- [ ] ATS detection is recalculated when the application URL changes.

## 7. Candidate data, documents and AI preparation

- [ ] Candidate Profile saves and reloads.
- [ ] Settings/preferences save and reload.
- [ ] Upload a test resume to private Documents storage.
- [ ] Mark a default resume.
- [ ] Add and edit a Saved Answer.
- [ ] Fit analysis completes and persists for an owned job.
- [ ] Resume tailoring stays grounded in candidate facts.
- [ ] Cover-letter generation stays grounded in candidate facts.
- [ ] Sensitive or unsupported questions return `Needs your input` rather than guessed answers.
- [ ] Generated tailored resume can be exported as a private PDF Document.
- [ ] Generated cover letter can be exported as a private PDF Document.
- [ ] Exported PDFs can be selected for the tracked application.

## 8. Application tracker smoke test

- [ ] Track a saved job as an application.
- [ ] Application Detail loads only for the owning user.
- [ ] Resume and cover-letter document selections persist.
- [ ] Status history remains consistent with the tracker.
- [ ] Deleting a saved job with an attached tracked application is prevented.
- [ ] Submission attempts and verified receipts display correctly.

## 9. Browserbase / ATS dry-run validation

With `AUTOMATION_ENABLE_SUBMIT=false`:

- [ ] Settings reports Browserbase configuration present and executable.
- [ ] Start controlled dry runs only against test-safe application targets.
- [ ] Greenhouse adapter maps expected fields and stops on unresolved required questions.
- [ ] Lever adapter maps expected fields and stops on unresolved required questions.
- [ ] Ashby adapter maps expected fields and stops on unresolved required questions.
- [ ] Workday adapter stops on login walls, CAPTCHA/bot checks, unsupported widgets or unresolved tenant-specific fields.
- [ ] Native text fields fill correctly.
- [ ] Native select controls use explicit matching choices.
- [ ] Native yes/no checkboxes require explicit candidate values.
- [ ] Radio/unsupported choices are never guessed.
- [ ] Resume/cover-letter file uploads remain server-controlled.
- [ ] No CAPTCHA, login or anti-bot mechanism is bypassed.
- [ ] Dry runs never create a verified submission receipt.
- [ ] UI never claims an employer submission occurred without concrete confirmation evidence.

## 10. Controlled verified-submission test

Only after sections 1–9 pass and only on an explicitly approved target where a real submission is appropriate:

- [ ] Temporarily set `AUTOMATION_ENABLE_SUBMIT=true`.
- [ ] Confirm the server-side final-submit gate sees an executable browser provider.
- [ ] Run one controlled submission.
- [ ] Verify concrete ATS/employer confirmation evidence before recording success.
- [ ] Confirm exactly one verified receipt is created for the application.
- [ ] Confirm the submission attempt references that same verified receipt.
- [ ] Confirm the application advances from `draft` to `submitted` without regressing later statuses.
- [ ] Confirm retry/idempotency protections prevent an unintended second submission.
- [ ] Return `AUTOMATION_ENABLE_SUBMIT=false` after validation unless production automated submission has been explicitly approved.

## 11. Final host / Lovable connection

The final deployment service must deploy the already-complete repository; it must not be used to invent missing product functionality.

- [ ] Connect the final hosting project to the exact verified release commit/tree.
- [ ] Configure every required environment value from section 3.
- [ ] Apply/confirm all Supabase migrations before traffic cutover.
- [ ] Build and deploy without source-code changes by the hosting AI agent.
- [ ] Confirm the production server runtime satisfies section 2.
- [ ] Run sections 5–9 on the deployed preview before domain cutover.

## 12. Domain cutover to 357Network.ws

- [ ] Attach `357Network.ws` and the intended `www.357network.ws` behavior to the final production deployment.
- [ ] Confirm DNS resolves to that deployment.
- [ ] Confirm HTTPS certificate is valid.
- [ ] Confirm `/357-network-header.jpg` loads and the approved artwork is unchanged.
- [ ] Confirm official tagline is displayed correctly.
- [ ] Test desktop and narrow/mobile viewport navigation and core forms.
- [ ] Re-run authentication, database, storage, job discovery, AI and Browserbase dry-run readiness checks on the production domain.
- [ ] Confirm baseline security headers are present.
- [ ] Confirm no server secrets appear in page source, browser bundles, logs or client-visible readiness responses.

## 13. Rollback rule

If any release or production smoke-test gate fails:

1. Keep `AUTOMATION_ENABLE_SUBMIT=false`.
2. Do not claim the workflow is production-ready.
3. Keep or restore the last verified deployment.
4. Fix the failing code/configuration/migration in the repository—not through an open-ended hosting-agent prompt.
5. Require a new green GitHub verification run and repeat the affected smoke tests before redeploying.

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
