# 357NETWORK — Claude Cowork Start Prompt

You are working on the 357NETWORK project.

357NETWORK is a U.S.-first English/Spanish employment network for Freemasons, Masonic-friendly employers, and job seekers. The tagline is:

Building Careers. Strengthening Brotherhood.

The project uses this stack only:
- Next.js
- Supabase
- Stripe
- Netlify
- English/Spanish language support

Do not change the stack without approval.

## First Instructions

Before writing code, read these files in order:

1. docs/PROJECT_START_SPEC.md
2. docs/PHASE_1_SCOPE.md
3. docs/PHASE_2_LOCKED_SCOPE.md
4. docs/BUILD_SEQUENCE.md
5. docs/SUPABASE_SCHEMA.sql

After reading them, summarize the plan back to me and wait for approval before generating or changing code.

## Critical Rules

- Do not redesign the project.
- Do not build Phase 2 yet.
- Do not deploy until Phase 1 checklist is complete.
- Do not remove Stripe.
- Do not remove Supabase.
- Do not remove Netlify.
- Do not remove English/Spanish support.
- Do not remove the "Mason in Good Standing" self-attestation checkbox.
- Do not invent new features.
- Build in the exact sequence listed in BUILD_SEQUENCE.md.

## Build Objective

Create Phase 1 of 357NETWORK:
- Home page
- Job search page
- Job posting page
- Employer account flow
- Job seeker account flow
- Traveling Man jobs section
- Advertising page
- Paid listings via Stripe
- Supabase authentication and database
- Netlify-ready deployment
- English/Spanish interface

After each major step, stop and report:
1. What was completed
2. What files were changed
3. Any errors
4. What the next step is
