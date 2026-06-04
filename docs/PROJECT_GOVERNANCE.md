# 357NETWORK Project Governance

**Last Updated:** June 2, 2026  
**Phase:** 1 (Phase 2 Locked)  
**Status:** In Progress - Step 11 Review Active

---

## Current Project Status

### Completed Steps

1. ✅ **Step 1:** Next.js Project Setup for Netlify
2. ✅ **Step 2:** Environment Variables Setup
3. ✅ **Step 3:** Review Supabase Schema for Safety and Compatibility
4. ✅ **Step 3 Extended:** Schema Replacement and Isolation Documentation
5. ✅ **Step 4:** App Layout and Visual Foundation (Header, Footer, Navigation)
6. ✅ **Step 5:** Public Pages (8 pages: Home, Find Jobs, Traveling Man, Post Job, Advertising, Sign In, Register, Terms, Privacy)
7. ✅ **Step 6:** Supabase Authentication Foundation (authService, AuthContext, ProtectedRoute, RoleGate)
8. ✅ **Step 7:** Dashboard Structure (Job Seeker, Employer, Advertiser, Admin dashboards)
9. ✅ **Step 8:** Job Posting Workflow Foundation (jobPostingService with validation and form integration)
10. ✅ **Step 9:** Stripe Checkout Foundation (stripeConfig, /api/checkout, stripeCheckout integration)
11. ✅ **Step 10:** Admin Approval Workflow Foundation (adminService with read functions, admin dashboard wired)

### Current Step

- **Step 11:** English/Spanish Support Review and Completion
  - Status: Translation audit complete
  - Navigation.js: Fully translated (7 keys, EN/ES)
  - Footer.js: Fully translated (6 keys, EN/ES)
  - Remaining: Component messages, service layer error messages, hard-coded text in pages

---

## Technology Stack (LOCKED)

### Core Framework
- **Next.js 14** with App Router and React 18
- **React Context API** for language management
- **Client Components** for authentication and language-dependent UI

### Backend & Database
- **Supabase** (dedicated 357NETWORK project only)
  - Authentication system (email/password)
  - PostgreSQL database
  - Row Level Security (RLS) policies by role
  - Real-time subscriptions support

### Payments
- **Stripe**
  - Checkout Sessions API
  - Product pricing: $29 (job listing), $79 (featured job), $199 (advertising)
  - Payment processing (placeholder in Phase 1, real in Phase 2)

### Deployment
- **Netlify**
  - Build: `next build`
  - Publish: `.next` directory
  - Node 18 runtime
  - Environment variables per environment

### Styling & UI
- **CSS (app/globals.css)**
  - Dark theme: #0d0d0d background, #1a1a1a containers
  - Gold accent: #d4af37 (WCAG AAA contrast 8.4:1)
  - Responsive: breakpoints at 768px (tablet), 480px (mobile)
  - Sticky header (z-index 100) and navigation (z-index 99)

### **No Replacements Without Explicit Approval**

---

## Geographic Scope

### Phase 1 (CURRENT - LOCKED TO US)
- **United States only**
- US state validation in forms
- US-focused job categories (Skilled Trades, Construction, Technology, Sales, Healthcare)
- All content in English and Spanish (for US Hispanic population)

### Phase 2 (LOCKED - NOT STARTED)
- Worldwide expansion
- International payment methods
- Multi-country support
- Additional language support

---

## Languages

### Phase 1 (CURRENT)
- **English** (primary)
- **Spanish** (Mexican Spanish dialect)

### Implementation
- Centralized translation dictionary: `lib/useLanguage.js`
- Language toggle in Header (EN/ES)
- Translation function: `const { t } = useLanguage()`
- Fallback strategy: translation key → English → key itself
- **All 357NETWORK branding preserved in both languages**
- **Exact tagline preserved:** "Building Careers. Strengthening Brotherhood." / "Construyendo Carreras. Fortaleciendo la Hermandad."

---

## User Roles

### job_seeker
- Access: /dashboard/job-seeker
- Features: Browse jobs, save jobs, apply, view recommendations
- Permissions: Read jobs, create applications, manage own profile

### employer
- Access: /dashboard/employer
- Features: Post jobs, view applications, manage company profile
- Permissions: Create/edit/delete own jobs, view applicants, manage billing
- Mason attestation required to post jobs

### advertiser
- Access: /dashboard/advertiser
- Features: Create ads, track campaigns, manage billing
- Permissions: Create/manage ads, view analytics, manage subscriptions

### admin
- Access: /dashboard/admin
- Features: Approve jobs, approve advertising orders, system management
- Permissions: Review pending content, approve/reject items, manage users
- Phase 1: Read-only with disabled action buttons
- Phase 2: Full approval workflow

---

## Branding (LOCKED)

### Name
- **357NETWORK**
- No name changes
- Consistent capitalization across all platforms

### Tagline (REQUIRED IN ALL CONTEXTS)
- **English:** "Building Careers. Strengthening Brotherhood."
- **Spanish:** "Construyendo Carreras. Fortaleciendo la Hermandad."
- Must appear in:
  - Header (every page)
  - Footer (every page)
  - Home page
  - All translation keys

### Color Scheme
- Primary dark: #0d0d0d (header/footer), #1a1a1a (containers)
- Accent gold: #d4af37 (buttons, links, highlights)
- Text light: #ffffff (primary), #e0e0e0 (secondary)
- Masonic symbolism preserved in design language

### No Rebranding Without Approval

---

## Development Constraints (ONE-AGENT RULE)

### Mandatory Standards

1. **One Agent Only**
   - No parallel agents
   - No multitasking
   - No task decomposition without user approval

2. **No Autonomous Decomposition**
   - Do not break work into subtasks automatically
   - Wait for explicit user instruction
   - Do not create TaskCreate entries without user request

3. **No Background Tasks**
   - No scheduled work creation
   - No autonomous scheduling
   - No background processing during main flow

4. **Step-by-Step Execution**
   - Complete one approved task
   - Report results explicitly
   - Wait for approval before next task
   - Never assume continuation

5. **Confirmation Before Change**
   - Report what will be modified
   - Wait for approval
   - Never apply changes without explicit consent

6. **No Scope Expansion**
   - Stay within assigned task boundaries
   - Do not extend to related features
   - Do not proceed to next phase automatically
   - Do not modify unapproved areas

---

## Supabase Rules (LOCKED)

### Project Isolation
- **Dedicated 357NETWORK Supabase project only**
- No shared databases with other projects
- No shared authentication systems
- No shared RLS policies with other projects
- No shared data across projects

### Credentials Management
- Placeholder credentials until production approval
- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for client
- SUPABASE_SERVICE_ROLE_KEY for server only (never exposed)
- Environment variables in .env.local.example only

### Schema Status
- **Phase 1:** Placeholder schema documented in docs/PROJECT_ISOLATION_RULES.md
- **Authentication:** Email/password with three roles
- **RLS Policies:** By role (job_seeker, employer, advertiser, admin)
- **No production schema without approval**

### Connection Rules
- No live database connection until Phase 1 complete and tested
- No production data until user explicitly approves
- All services degrade gracefully to mock data when credentials missing
- TODO comments mark Phase 2 integration points

---

## Stripe Rules (LOCKED)

### Production Status
- **No live Stripe products without approval**
- **No production Stripe keys without approval**
- Phase 1 uses placeholder configuration

### Configuration
- Products defined in lib/stripeConfig.js:
  - job-listing: $29 (standard)
  - featured-job: $79 (premium)
  - advertising: $199 (all tiers)
- Checkout Sessions API only (no direct charges)
- /api/checkout endpoint routes to Stripe
- STRIPE_SECRET_KEY server-side only (never exposed)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for client

### Testing
- Stripe checkout buttons functional
- Redirects work correctly
- Error handling in place
- "Stripe is not configured" message when keys missing

### No Production Use Without Approval

---

## Netlify Deployment Rules (LOCKED)

### Build Configuration
- Build command: `next build`
- Publish directory: `.next`
- Node version: 18
- No custom server functions

### Environment Variables
- Supabase credentials (placeholder format)
- Stripe keys (placeholder format)
- Language settings
- Deployment URL configuration

### Approval Gates
- **No staging deployment without approval**
- **No production deployment without approval**
- **No domain changes without approval**
- All deployments via Netlify dashboard or CLI with user confirmation

---

## Phase 1 Approved Features

### Authentication System
✅ Sign Up with role selection (job_seeker, employer, advertiser)  
✅ Sign In with email/password  
✅ Session management  
✅ Logout functionality  
✅ ProtectedRoute wrapper for authenticated pages  
✅ RoleGate component for role-based access control  

### Public Pages
✅ Home page with hero and info sections  
✅ Find Jobs page with filters (disabled in Phase 1)  
✅ Traveling Man page with opportunity cards  
✅ Post Job page with form and payment options  
✅ Advertising page with three tiers ($199 each)  
✅ Sign In page with form and benefits  
✅ Register page with role selection and validation  
✅ Terms of Service page  
✅ Privacy Policy page  

### Dashboard Pages
✅ Job Seeker Dashboard with profile, saved jobs, applications history, recommendations  
✅ Employer Dashboard with company profile, posted jobs, applications, billing  
✅ Advertiser Dashboard with active ads, campaign performance, billing, settings  
✅ Admin Dashboard with pending job approvals and advertising order approvals (read-only)  

### Job Posting System
✅ Job posting form with 10 fields + 4 checkboxes  
✅ Form validation (title min 3 chars, description min 20 chars, email format, state validation, Mason attestation required)  
✅ Mason attestation requirement  
✅ Payment options (Standard $29, Featured $79)  
✅ Success/error messaging  
✅ Integration with jobPostingService  

### Admin Workflow
✅ Admin dashboard with read-only job approvals table  
✅ Admin dashboard with read-only advertising orders table  
✅ getPendingJobs() function  
✅ getPendingAdvertisingOrders() function  
✅ Action buttons disabled with tooltip "Coming in Phase 2"  

### Stripe Integration
✅ Stripe configuration (lib/stripeConfig.js)  
✅ Checkout endpoint (/api/checkout)  
✅ Checkout button integration (post-job, advertising pages)  
✅ Payment error handling  
✅ "Stripe is not configured" fallback message  

### Internationalization
✅ Centralized translation system (lib/useLanguage.js)  
✅ Language toggle in header (EN/ES)  
✅ Navigation translations (7 keys)  
✅ Footer translations (6 keys)  
✅ All page content with translation keys  
✅ Fallback English text  
✅ Spanish translations for all keys  

### Layout & Components
✅ Sticky header with 357NETWORK branding and tagline  
✅ Navigation with mobile hamburger menu  
✅ Footer with quick links and legal links  
✅ Language toggle component  
✅ Responsive design (desktop, tablet, mobile)  
✅ Dark theme with gold accents  
✅ Form components with validation feedback  

---

## Phase 2 Locked Features

### Phase 2 Development (NOT STARTED - LOCKED UNTIL PHASE 1 COMPLETE AND APPROVED)

❌ **Not In Phase 1:**
- Live Supabase database connection
- Live Stripe payment processing
- Job search and filtering (database-backed)
- Job applications system
- Saved jobs functionality
- Admin approval actions (currently disabled)
- Email notifications
- Job recommendation engine
- User profile completion workflows
- Analytics and reporting
- Worldwide expansion
- Additional language support
- Advanced payment methods
- Subscription management
- Real-time messaging
- Call scheduling integration
- Video interviews
- Background checks
- Advanced admin controls
- API endpoints for third-party integration
- Mobile app
- Browser extensions

### Phase 2 Starts Only When
1. Phase 1 fully tested and approved
2. All Phase 1 checklist items passing
3. User explicitly approves Phase 2 initiation
4. Scope document provided for Phase 2

---

## Development Process (MANDATORY)

### For Every Step

1. **Receive Approval**
   - User explicitly approves next step
   - No autonomous progression

2. **Complete Assigned Task**
   - Work on ONLY the approved task
   - Do not expand scope
   - Do not add related features

3. **Report Results**
   - What was completed
   - What files were changed
   - Whether there were errors
   - What the next step is

4. **Wait for Approval**
   - Stop after reporting
   - Do not continue automatically
   - Do not create next tasks
   - Do not assume continuation

### Never
- ❌ Proceed to next step without approval
- ❌ Expand work beyond assigned task
- ❌ Create multiple tasks automatically
- ❌ Run parallel agents
- ❌ Skip steps in BUILD_SEQUENCE.md
- ❌ Modify architecture without approval
- ❌ Deploy without approval
- ❌ Change constraints or rules

---

## Current Technical Status

### Authentication
- **Status:** ✅ Complete
- **Implementation:** authService.js, AuthContext.js, ProtectedRoute.js, RoleGate.js
- **Functionality:** Signup, login, logout, session management
- **Integration:** Sign In and Register pages wired
- **Supabase:** Placeholder credentials (no live connection)
- **Remaining:** Phase 2 - Supabase live connection

### Dashboards
- **Status:** ✅ Complete
- **Pages:** Job Seeker, Employer, Advertiser, Admin
- **Admin Features:** Read-only job and advertising order tables
- **Remaining:** Phase 2 - Admin approval actions, profile completion forms

### Job Posting
- **Status:** ✅ Complete
- **Service Layer:** jobPostingService.js with validation
- **Form:** 10 fields + 4 checkboxes
- **Validation:** Title, description, email, state, Mason attestation
- **Payment:** Integrated with Stripe checkout flow
- **Remaining:** Phase 2 - Supabase job storage and database queries

### Stripe Payment
- **Status:** ✅ Configuration Complete
- **Implementation:** stripeConfig.js, /api/checkout, stripeCheckout.js
- **Products:** Job listing ($29), Featured job ($79), Advertising ($199)
- **Integration:** Post Job and Advertising pages have payment buttons
- **Fallback:** "Stripe is not configured" message when keys missing
- **Remaining:** Phase 2 - Live Stripe account and payment processing

### Admin Workflow
- **Status:** ✅ Read-Only Foundation Complete
- **Service:** adminService.js with getPendingJobs() and getPendingAdvertisingOrders()
- **Dashboard:** Tables for job and advertising order approvals
- **Admin Actions:** Buttons disabled with "Coming in Phase 2" tooltip
- **Remaining:** Phase 2 - Implement approval actions (approveJob, approveAdvertisingOrder)

### Translation System
- **Status:** ✅ Audit Complete
- **Framework:** lib/useLanguage.js with centralized dictionary
- **Languages:** English, Spanish
- **Coverage:**
  - Fully translated: Home, Find Jobs, Traveling Man (3 pages)
  - Partially translated: Sign In, Register, Post Job, Advertising, Terms, Privacy, Admin, Dashboards (9 pages)
  - Service layers: authService, jobPostingService, adminService, stripeCheckout (need error messages)
- **Remaining:** Phase 2 - Complete translations for all error messages and component text

### Remaining Phase 1 Tasks

**Step 11 (In Progress):** English/Spanish Support Review and Completion
- Audit complete: Navigation and Footer already fully translated
- Next operation: Update Header component for "Logout" and "Welcome" messages
- Then: Update service layer error messages
- Then: Update component messages (ProtectedRoute, RoleGate, Dashboard redirect)
- Then: Update hard-coded text in dashboard pages
- Then: Verify all translations in lib/useLanguage.js are EN/ES pairs

**Step 12 (Pending):** Full Phase 1 Testing Checklist
- Run TESTING_CHECKLIST.md
- Verify all forms work
- Verify navigation works
- Verify responsive design
- Verify English/Spanish switching
- Verify error messages appear in both languages
- Verify layout integrity

**Step 13 (Pending):** Phase 1 Final Review and Approval
- Code review of all Phase 1 changes
- Security review
- Deployment readiness
- User approval for Phase 2 handoff

---

## Approval Requirements

All future work requires explicit user approval before proceeding:

- ✅ Before starting any step
- ✅ Before modifying any file
- ✅ Before creating translations
- ✅ Before deploying
- ✅ Before moving to Phase 2

**No autonomous work is permitted.**

---

## Document Control

- **Last Updated:** June 2, 2026
- **Phase:** 1
- **Status:** Active (Step 11 in progress)
- **Owner:** Charlie Peck (cp@webserious.ws)
- **Repository:** /Users/charlespeck/Documents/Claude/Projects/357 Network Project/
- **Git Repository:** None (local development)

---

*This document is the governing standard for all 357NETWORK Phase 1 development. All work must comply with these rules and constraints. No exceptions without explicit approval documented in conversation history.*
