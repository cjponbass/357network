# 357 Network

**Where Opportunity Knocks for You. Automatically.**

357 Network is a private job-application SaaS for discovering and saving opportunities, preparing application materials, managing candidate data, tracking applications, and safely automating supported ATS workflows.

The approved brand header is the user-supplied black-and-white panoramic 357 Network artwork at `/357-network-header.jpg`.

## Production stack

- TanStack Start + React + TypeScript
- Supabase PostgreSQL, Auth, RLS, and private Storage
- OpenAI for fact-grounded application preparation
- Browserbase + Playwright for server-side browser automation
- Adzuna plus a public fallback source for job discovery
- Vitest + ESLint + TypeScript + production-build verification in GitHub Actions
- Node.js 22+ with pnpm 10.15.0

## Product surface

- Authentication, account creation, and password recovery
- Dashboard
- Multi-source job discovery by role, location, country, and remote preference
- Private Saved Jobs with ATS detection, editable employer application URLs, and full job-description storage
- AI Preparation: fit analysis, tailored resume text, cover letters, and safe answer suggestions
- Private PDF export of AI-tailored resumes and cover letters for real application attachment
- Saved Answers
- Applications and application-detail workflow
- Private Documents / resume management
- Candidate Profile
- Settings and deployment-readiness diagnostics
- Submission attempts, status history, and verified receipt display

## ATS architecture

Adapters are implemented for Greenhouse, Lever, Ashby, and Workday.

Automation is deliberately conservative. CAPTCHA/bot checks, authentication walls, unsupported widgets, and unresolved required questions stop the workflow for user action. Sensitive answers are never guessed. Native text fields, select controls, explicit yes/no checkboxes, and document uploads are handled by the browser provider; unsupported choices are blocked rather than invented. A submission is not considered successful without concrete confirmation evidence.

## Safety boundary

Final automated submission is controlled by:

```bash
AUTOMATION_ENABLE_SUBMIT=false
```

Keep this `false` until controlled end-to-end testing is complete. Browser automation may inspect/fill supported forms in dry-run mode, but it must not send an application while the boundary is disabled.

## Environment

Copy `.env.example` to your local environment and provide the required values there. Production requires Supabase server/browser credentials, OpenAI provider configuration, Browserbase API key/project ID, and the automation submit safety switch. Adzuna credentials are optional; when absent, the public fallback job source remains available. Do not commit secrets.

## Release gate

The repository release gate is:

```bash
pnpm run verify
```

That command runs TypeScript, zero-warning ESLint, the full Vitest suite, and the production build. GitHub Actions runs the same gate on the release branch. A release is not accepted unless every step is green.

The product-surface contract verifies required routes, job discovery, private generated-document export, approved artwork/tagline, password recovery, authenticated navigation, and visible submission-safety language. Additional tests enforce database ownership/integrity and ATS/browser-automation safety behavior.

## Deployment contract

The production application requires an SSR-capable Node.js 22 environment with its server-only secrets available at runtime. The repository currently includes the official TanStack Start Netlify adapter as a known-good production build target. Any final host must preserve the same server-runtime contract for Supabase service operations, OpenAI calls, Browserbase/Playwright CDP connections, temporary document handling, and environment-secret isolation.

`DEPLOYMENT_CHECKLIST.md` is the cutover procedure. Production secrets must be configured in the hosting environment and must never be committed to GitHub.

## Legacy material

Historical Next.js/Freemason-job-board files and documentation remain in repository history for auditability. The production application is the TanStack Start implementation under `src/`; TypeScript and the build include the active production surface rather than the historical `app/` implementation.
