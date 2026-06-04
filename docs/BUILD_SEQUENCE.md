# 357NETWORK Build Sequence

Follow this exact order.

## Step 1 — Project Setup
Create a Next.js project configured for Netlify deployment.

## Step 2 — Environment Variables
Create .env.example with:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_SITE_URL=

## Step 3 — Supabase Setup
Use docs/SUPABASE_SCHEMA.sql as the initial database schema.

## Step 4 — App Layout
Create:
- Header
- Footer
- Language toggle
- Main navigation
- 357NETWORK branding
- Tagline: Building Careers. Strengthening Brotherhood.

## Step 5 — Public Pages
Build Home, Find Jobs, Traveling Man Jobs, Post a Job, Advertising, Sign In, Register.

## Step 6 — Authentication
Connect Supabase Auth.

## Step 7 — Dashboards
Create Job Seeker Dashboard and Employer Dashboard.

## Step 8 — Job Posting Flow
Employers submit jobs. Jobs default to approved=false until admin approval.

## Step 9 — Stripe Checkout
Create checkout flow for:
- Standard Job Listing
- Featured Job Listing
- Advertising Placement

## Step 10 — Admin Review
Admin can approve listings and mark featured listings.

## Step 11 — English/Spanish Support
Add translation file structure:
- locales/en.json
- locales/es.json

## Step 12 — Netlify Deployment
Add netlify.toml and verify build command.

## Step 13 — Testing
Run the testing checklist before deployment.
