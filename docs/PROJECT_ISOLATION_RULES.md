# 357NETWORK Project Isolation Rules

## Core Principle

**357NETWORK is a completely isolated, standalone project. It does not share any resources, databases, credentials, or infrastructure with any other project.**

---

## Isolation Requirements

### 1. Database Isolation — REQUIRED

**Rule:** 357NETWORK must use its own dedicated Supabase database instance.

- ✅ **DO:** Create a new Supabase project named `357network-production`
- ❌ **DO NOT:** Share a database with another project
- ❌ **DO NOT:** Use existing tables from other projects
- ❌ **DO NOT:** Reference external databases or schemas
- ❌ **DO NOT:** Migrate data from other projects into 357NETWORK tables

**Why:** 
- Ensures data privacy and security
- Prevents accidental data leaks between projects
- Simplifies compliance and audit trails
- Allows independent scaling and backups

**Implementation:**
```
357NETWORK Database: 357network-production (Supabase)
├── public.profiles (357NETWORK only)
├── public.employers (357NETWORK only)
├── public.jobs (357NETWORK only)
└── public.advertising_orders (357NETWORK only)
```

---

### 2. Authentication Isolation — REQUIRED

**Rule:** 357NETWORK must use its own Supabase authentication system.

- ✅ **DO:** Use Supabase Auth within the `357network-production` project
- ❌ **DO NOT:** Share Supabase Auth with another project
- ❌ **DO NOT:** Link to external authentication providers without explicit approval
- ❌ **DO NOT:** Reuse user accounts from other projects
- ❌ **DO NOT:** Mirror auth tables from other systems

**Why:**
- User accounts are project-specific
- Passwords and sessions are isolated
- Audit logs are separate
- Role-based access control is unique to 357NETWORK

**Implementation:**
```
357NETWORK Auth: Supabase Auth (357network-production)
├── Users (job seekers, employers, admins)
├── Sessions (login tokens)
└── Roles (job_seeker, employer, advertiser, admin)
```

---

### 3. Payment Processing Isolation — REQUIRED

**Rule:** 357NETWORK must use its own Stripe account and products.

- ✅ **DO:** Create Stripe products specifically for 357NETWORK
  - Standard Job Listing
  - Featured Job Listing
  - Advertising Placement
- ❌ **DO NOT:** Share a Stripe account with another project
- ❌ **DO NOT:** Reuse Stripe product IDs from other projects
- ❌ **DO NOT:** Link to external payment processors
- ❌ **DO NOT:** Use test keys from other environments

**Why:**
- Financial records are separate
- Tax reporting is simplified
- Payment disputes are isolated
- Refund policies apply only to 357NETWORK transactions

**Implementation:**
```
357NETWORK Payments: Stripe (357network project)
├── Stripe Account: Dedicated to 357NETWORK only
├── Products:
│   ├── Standard Job Listing
│   ├── Featured Job Listing
│   └── Advertising Placement
├── Webhooks: 357NETWORK endpoints only
└── Test Mode: Uses separate test keys
```

---

### 4. Deployment Isolation — REQUIRED

**Rule:** 357NETWORK must use its own Netlify deployment.

- ✅ **DO:** Deploy 357NETWORK to a Netlify site named `357network-production` (or similar)
- ❌ **DO NOT:** Deploy to a site shared with another project
- ❌ **DO NOT:** Share environment variables with other projects
- ❌ **DO NOT:** Reuse build configuration from other projects
- ❌ **DO NOT:** Deploy to a subdomain of another project

**Why:**
- Deployment workflows are independent
- Environment variables are isolated
- Build logs are separate
- Uptime and performance are independent
- DNS records are unique to 357NETWORK

**Implementation:**
```
357NETWORK Deployment: Netlify
├── Site Name: 357network-production
├── Domain: 357network.com or similar
├── Environment Variables: 357NETWORK only
├── Build Command: npm run build (357NETWORK)
├── Deploy Logs: 357NETWORK-specific
└── Previews: 357NETWORK branches only
```

---

### 5. Environment Variables Isolation — REQUIRED

**Rule:** 357NETWORK environment variables must be completely separate.

**357NETWORK Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co (357NETWORK only)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (357NETWORK only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (357NETWORK only)
STRIPE_SECRET_KEY=sk_... (357NETWORK only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_... (357NETWORK only)
STRIPE_WEBHOOK_SECRET=whsec_... (357NETWORK only)
NEXT_PUBLIC_SITE_URL=https://357network.com (357NETWORK only)
```

- ✅ **DO:** Use `.env.local` for development (not committed to git)
- ✅ **DO:** Use Netlify environment variables for production
- ❌ **DO NOT:** Share credentials with other projects
- ❌ **DO NOT:** Store credentials in `.env.example` (only placeholders)
- ❌ **DO NOT:** Reuse keys from other projects

**Why:**
- Prevents credential leaks
- Ensures each project uses its own services
- Simplifies key rotation
- Maintains security best practices

---

### 6. Code Repository Isolation — RECOMMENDED

**Rule:** 357NETWORK code and configuration are maintained in a dedicated repository.

- ✅ **DO:** Maintain a Git repository at `/Users/charlespeck/Documents/Claude/Projects/357 Network Project/`
- ✅ **DO:** Use `.gitignore` to prevent credential leaks
- ❌ **DO NOT:** Share repository with another project
- ❌ **DO NOT:** Commit `.env.local` or secrets to git
- ❌ **DO NOT:** Include other project code in this repository

**Why:**
- Version control is isolated
- Deployment history is clear
- Code reviews are project-specific
- CI/CD pipelines are independent

---

### 7. Documentation Isolation — REQUIRED

**Rule:** 357NETWORK documentation must be complete and self-contained.

Current documentation:
- ✅ `docs/COWORK_PROMPT.md` — 357NETWORK project instructions
- ✅ `docs/PROJECT_START_SPEC.md` — Feature specifications
- ✅ `docs/PHASE_1_SCOPE.md` — Phase 1 requirements
- ✅ `docs/PHASE_2_LOCKED_SCOPE.md` — Locked Phase 2 features
- ✅ `docs/BUILD_SEQUENCE.md` — Build order
- ✅ `docs/SUPABASE_SCHEMA.sql` — Database schema
- ✅ `docs/SUPABASE_SCHEMA_IMPROVED.sql` — Enhanced schema (backup)
- ✅ `docs/SUPABASE_SETUP_INSTRUCTIONS.md` — Setup guide
- ✅ `docs/TESTING_CHECKLIST.md` — QA checklist
- ✅ `docs/PROJECT_ISOLATION_RULES.md` — This document

- ❌ **DO NOT:** Reference external project documentation
- ❌ **DO NOT:** Assume knowledge of other projects
- ❌ **DO NOT:** Create dependencies on other project docs

**Why:**
- New team members can onboard independently
- Project is self-documenting
- No external dependencies on other projects
- Audit trail is complete

---

## Isolation Verification Checklist

Before Phase 1 deployment, verify:

### Database
- [ ] Supabase project name is `357network-production`
- [ ] Database contains only 357NETWORK tables
- [ ] No references to external databases
- [ ] RLS policies are 357NETWORK-specific
- [ ] Backups are isolated to this project

### Authentication
- [ ] Supabase Auth is within `357network-production` project
- [ ] Users belong to 357NETWORK only
- [ ] Roles are 357NETWORK-specific
- [ ] Auth logs show no external connections

### Payments
- [ ] Stripe account is dedicated to 357NETWORK
- [ ] Products are 357NETWORK-only (Standard, Featured, Advertising)
- [ ] Webhook endpoints are 357NETWORK URLs
- [ ] Test mode is separate from production

### Deployment
- [ ] Netlify site is dedicated to 357NETWORK
- [ ] Environment variables are 357NETWORK-only
- [ ] Build logs reference 357NETWORK only
- [ ] DNS points to 357NETWORK deployment only

### Code & Credentials
- [ ] `.env.local` is in `.gitignore`
- [ ] No credentials in repository
- [ ] No shared build scripts or configs
- [ ] No imports from other projects

### Documentation
- [ ] All docs are in `docs/` directory
- [ ] Docs reference 357NETWORK requirements only
- [ ] Setup instructions are self-contained
- [ ] No external dependencies listed

---

## Isolation Exceptions — NOT ALLOWED

The following sharing is **strictly prohibited** unless explicitly approved by project owner:

- ❌ Sharing Supabase projects with other software
- ❌ Sharing Stripe accounts with other products
- ❌ Sharing Netlify deployments with other sites
- ❌ Sharing databases with other applications
- ❌ Sharing authentication systems with other services
- ❌ Sharing environment variables with other projects
- ❌ Importing code from other projects without modification

---

## Why This Matters for 357NETWORK

1. **Security:** Sensitive Mason community data is protected
2. **Compliance:** Audit trails are clear and separate
3. **Scalability:** 357NETWORK can scale independently
4. **Reliability:** No impact from other projects' issues
5. **Privacy:** User data is not mixed with other systems
6. **Maintenance:** Updates don't affect other projects

---

## Migration Path (If Shared Resources Exist)

If 357NETWORK was started from another project, complete isolation requires:

1. **Create new Supabase project:** `357network-production`
2. **Export 357NETWORK data** from shared database (if any)
3. **Import into new project** using schema and data migration
4. **Create new Stripe account** for 357NETWORK payments
5. **Create new Netlify site** for 357NETWORK deployment
6. **Update environment variables** to point to new services
7. **Decommission shared resources** (after testing)
8. **Document cutover** in version control

---

## Questions?

If you're unsure whether a change violates isolation rules:

1. **Ask before implementing**
2. **Document the exception** if approved
3. **Ensure it doesn't impact 357NETWORK security**

---

## Document History

- **Created:** 2026-06-02
- **Purpose:** Enforce complete project isolation for 357NETWORK
- **Scope:** All infrastructure, code, and credentials
- **Status:** Active — Required for all development
