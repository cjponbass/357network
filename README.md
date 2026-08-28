# 357 Network

**Where Opportunity Knocks for You. Automatically.**

357 Network is being rebuilt as a job-application SaaS that helps authenticated users save jobs, prepare application materials, manage private candidate data, track applications, and safely automate supported ATS workflows.

The approved brand header is the user-supplied black-and-white panoramic 357 Network artwork. The application expects that exact asset at `/357-network-header.jpg`. Do not substitute generated artwork if the binary asset is absent.

## Current stack

- TanStack Start + React + TypeScript
- Supabase PostgreSQL, Auth, RLS, and private Storage
- Netlify via the official TanStack Start Netlify adapter
- OpenAI for fact-grounded application preparation
- Browserbase + Playwright for server-side browser automation
- Vitest + ESLint + TypeScript + production-build verification in GitHub Actions
- Node.js 22+ with pnpm 10.15.0

## Current product surface

- Authentication and authenticated navigation
- Dashboard
- Saved Jobs with ATS detection and job-description storage
- AI Preparation: fit analysis, tailored resume text, cover letters, and safe answer suggestions
- Saved Answers
- Applications and application-detail workflow
- Private Documents / resume management
- Candidate Profile
- Settings and deployment-readiness diagnostics
- Submission attempts, status history, and verified receipt display

## ATS architecture

Adapters are implemented for:

- Greenhouse
- Lever
- Ashby
- Workday

Automation is deliberately conservative. CAPTCHA/bot checks, authentication walls, unsupported widgets, and unresolved required questions stop the workflow for user action. Sensitive answers are never guessed. A submission is not considered successful without concrete confirmation evidence.

## Safety boundary

Final automated submission is controlled by:

```bash
AUTOMATION_ENABLE_SUBMIT=false
```

Keep this `false` until controlled end-to-end testing is complete. Browser automation may inspect/fill supported forms in dry-run mode, but it must not send an application while the boundary is disabled.

## Environment

Copy `.env.example` to your local environment and provide the required values there. The main production groups are:

- Supabase server credentials
- Supabase browser credentials
- OpenAI provider configuration
- Browserbase API key and project ID
- automation submit safety switch

Do not commit secrets. The Settings page reports safe readiness booleans and missing configuration names without returning secret values to the browser.

## Production readiness gates

Before deployment/cutover, verify all of the following:

1. GitHub verification is green: TypeScript, zero-warning lint, tests, and Netlify production build.
2. Supabase server and browser configuration are present.
3. The production database is reachable and all critical SaaS tables are queryable.
4. The private `candidate-documents` bucket is reachable.
5. AI preparation is configured and tested with an authenticated user.
6. Browserbase is configured and dry-run automation works without bypassing CAPTCHA/auth controls.
7. Controlled ATS tests produce correct blockers and do not claim success without evidence.
8. Only after controlled validation, explicitly enable the final-submit boundary for a verified test.
9. Confirm verified submission receipts are created only from concrete confirmation evidence.
10. Deploy the validated build to `357Network.ws` and re-run authenticated smoke tests.

See `DEPLOYMENT_CHECKLIST.md` for the current end-to-end production rollout procedure.

## Development

```bash
corepack enable
pnpm install
pnpm run dev
```

## Verification

```bash
pnpm run verify
```

Use the repository scripts and GitHub workflow as the release gate. A change is not considered verified until the workflow completes successfully.

## Deployment

The rebuild targets Netlify using the TanStack Start adapter. Production environment variables must be configured in Netlify; repository examples are documentation only and must never contain real credentials.

## Legacy code

The repository contains earlier 357 Network / Job Applicant Shell code and infrastructure. The active rebuild is the `job-platform-rebuild` branch. Legacy Next.js/Freemason-job-board documentation should not be treated as the current architecture or product specification.
