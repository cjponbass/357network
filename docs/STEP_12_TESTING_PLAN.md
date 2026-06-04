# Step 12: Testing Plan
## 357NETWORK Phase 1 Testing Strategy and Execution Order

**Project**: 357NETWORK Phase 1  
**Date**: June 2, 2026  
**Status**: Phase 1 Complete - Ready for Testing  
**Prepared for**: Full testing audit before Netlify deployment

---

## Executive Summary

This testing plan categorizes the 56 required tests from TESTING_CHECKLIST.md by their external dependencies. The plan identifies which tests can run locally without external services, which require Supabase credentials, which require Stripe test mode, and which require Netlify deployment. The recommended execution order minimizes time to first successful test run and identifies blockers early.

**Key Finding**: 24 tests (43%) can run locally with zero external dependencies. This provides immediate confidence in basic functionality before adding services.

---

## Test Categories by Dependency

### Category 1: Local Only (No External Services Required)
**Count**: 24 tests | **Execution**: Immediately | **Estimated Time**: 15-20 minutes  
**Blocker Impact**: HIGH — These are prerequisites for all other testing

#### Tests:
1. **Basic Build** (3 tests)
   - `npm install succeeds` — Install dependencies without errors
   - `npm run build succeeds` — Production build completes with no errors
   - `npm run dev starts locally` — Development server starts on port 3000

2. **Public Pages** (7 tests) — Load without authentication required
   - Home loads
   - Find Jobs loads
   - Traveling Man loads
   - Advertising loads (view only, no checkout button functional yet)
   - Post a Job loads (login redirect or form if authenticated)
   - Sign In loads
   - Register loads

3. **English/Spanish Language Support** (3 tests) — Display-only, no backend calls
   - English text displays correctly
   - Spanish text displays correctly
   - Language toggle switches between EN and ES

4. **Phase 2 Lock Verification** (4 tests) — Code review checks
   - No worldwide continent system active in navigation or components
   - No private messaging active in UI or routes
   - No AI matching active in job listing or dashboard
   - No resume upload active in any form or profile page

5. **Netlify Configuration** (4 tests) — File/configuration review
   - `netlify.toml` exists at project root
   - Build command in `netlify.toml` is set to `next build`
   - Publish directory in `netlify.toml` is set to `.next`
   - Environment variables documented in `README.md` (keys: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY)

**Execution Steps for Category 1**:
```bash
# 1. Basic Build
npm install
npm run build
npm run dev  # Verify port 3000, then Ctrl+C

# 2. Public Pages (in browser after npm run dev)
# Navigate to: /, /find-jobs, /traveling-man, /advertising, /post-job, /signin, /register
# Verify each page loads without errors

# 3. Language Toggle
# Click EN/ES buttons in header
# Verify text updates (check at least 3 elements per language)

# 4. Phase 2 Lock (code review)
# grep -r "continent" app/
# grep -r "messaging" app/
# grep -r "AI match" app/
# grep -r "resume upload" app/
# Confirm all return 0 results or only in comments

# 5. Netlify Config
# Verify files exist: netlify.toml, README.md
# Verify build command and publish directory in netlify.toml
# Verify environment variable keys documented in README.md
```

**Success Criteria**: All 24 tests pass with zero external service dependencies. If any test fails here, stop and resolve before proceeding.

---

### Category 2: Supabase Configuration Only
**Count**: 12 tests | **Execution**: After Category 1 passes | **Estimated Time**: 30-45 minutes  
**Dependencies**: Valid Supabase URL, anon key, service role key  
**Blocker Impact**: CRITICAL — Blocks admin and job posting tests

#### Prerequisites Before Starting:
- Supabase project created
- Authentication enabled with email/password provider
- Tables created: `users`, `profiles`, `job_listings`, `approvals`
- Row-Level Security policies configured (from MASTER_BUILD_PACKET.md)
- Environment variables set locally:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### Tests:
1. **Supabase Environment Setup** (1 test)
   - Environment variables are configured in `.env.local`
   - Can verify with: `npm run dev` logs no "undefined" Supabase errors

2. **User Registration** (1 test)
   - Register with email: `testuser+job-seeker@example.com`, password: `TestPass123!`
   - Should succeed and redirect to dashboard or profile creation
   - Verify user record in Supabase `users` table

3. **User Sign In** (1 test)
   - Sign in with registered email and password
   - Should redirect to appropriate dashboard based on role
   - Verify session is active (check AuthContext in React DevTools)

4. **User Profile Creation** (1 test)
   - Job seeker profile: Create profile after registration
   - Verify `profiles` table has new record with `role='job_seeker'`
   - Verify profile appears on dashboard

5. **Employer Profile Creation** (1 test)
   - Register with email: `testuser+employer@example.com`, password: `TestPass123!`
   - Select "employer" role during registration or profile creation
   - Verify `profiles` table has `role='employer'`

6. **Job Listing Save** (1 test)
   - As employer, navigate to `/post-job`
   - Fill form: Title, Company, Location, Description, Salary
   - Submit form
   - Verify record in `job_listings` table with `approved=false` (critical for admin workflow)

7. **Admin Dashboard Access** (1 test)
   - Register with email: `testuser+admin@example.com`, password: `TestPass123!`
   - Use Supabase dashboard to manually set `role='admin'` in profiles table
   - Sign out and back in
   - Verify redirect to `/dashboard/admin` works

8. **Admin Approval Workflow - Default State** (1 test)
   - As admin, navigate to `/dashboard/admin`
   - Pending Job Approvals section should show the job created in test #6
   - Verify job has `approved=false` status

9. **Admin Approval Workflow - Approve Job** (1 test)
   - In admin dashboard, click "Approve" on pending job
   - Verify job record in Supabase has `approved=true`
   - Verify job disappears from pending list (refreshes)

10. **Admin Approval Workflow - Approved Job Visibility** (1 test)
    - As job seeker, navigate to `/find-jobs`
    - Verify approved job appears in listing
    - Verify job details match what was posted

11. **Admin Approval Workflow - Unapproved Job Hidden** (1 test)
    - Employer posts second job but don't approve it
    - As job seeker on `/find-jobs`, verify unapproved job does NOT appear
    - Verify only approved jobs visible to public

12. **Job Listing Data Integrity** (1 test)
    - Verify job listing contains all fields: title, company, location, description, salary, posted_by (user_id), created_at, approved, featured (boolean)
    - Verify data matches what was submitted in form

**Execution Steps for Category 2**:
```bash
# 1. Start dev server
npm run dev

# 2. Test registration (first job seeker)
# Navigate to /register
# Email: testuser+job-seeker@example.com
# Password: TestPass123!
# Submit and verify no errors

# 3. Test sign in
# Navigate to /signin
# Use same credentials
# Verify redirects to dashboard

# 4. Check Supabase dashboard
# Go to Supabase console → Tables → users/profiles
# Verify records created with correct data

# 5. Test job posting (as employer)
# Register new employer: testuser+employer@example.com
# Set role to employer during registration
# Navigate to /post-job
# Fill: Title="QA Engineer", Company="Test Corp", Location="USA", etc.
# Submit and verify no errors
# Check job_listings table in Supabase (should have approved=false)

# 6. Test admin role
# Register: testuser+admin@example.com
# Go to Supabase dashboard
# In profiles table, manually set this user's role to 'admin'
# Sign out and back in
# Verify redirects to /dashboard/admin

# 7. Test approval workflow
# In admin dashboard, find pending job
# Click approve
# Verify job_listings.approved = true

# 8. Test visibility
# Sign in as job seeker
# Go to /find-jobs
# Verify approved job appears, unapproved does not
```

**Success Criteria**: All 12 tests pass. If any fails, note which test and check Supabase dashboard for data integrity.

---

### Category 3: Stripe Test Mode (Requires Valid Stripe Account)
**Count**: 5 tests | **Execution**: After Category 2 passes | **Estimated Time**: 25-35 minutes  
**Dependencies**: 
- Stripe account in test mode
- Stripe publishable key and secret key
- Webhook endpoint configured (for Netlify: will be set up during deployment)
- Environment variables: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`

#### Prerequisites Before Starting:
- Stripe dashboard open and in test mode
- Test credit card ready: `4242 4242 4242 4242`, exp: any future date, CVC: any 3 digits
- Environment variables set locally:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`

#### Tests:
1. **Stripe Checkout Button Presence** (1 test)
   - Navigate to `/advertising` page
   - Verify "Checkout" or "Buy" button exists for each tier (Standard, Featured, Banner)
   - Verify buttons are clickable (no 404 or missing handler errors)

2. **Standard Job Listing Checkout** (1 test)
   - As employer on `/post-job`, fill form and submit
   - On success page, click "Upgrade to Featured" or payment button
   - Stripe checkout modal/form appears
   - Enter test card: `4242 4242 4242 4242`
   - Verify payment succeeds (no error message)
   - Verify redirect to success page

3. **Featured Job Listing Checkout** (1 test)
   - Repeat test #2 but select "Featured" tier
   - Verify featured job creation succeeds and appears on public listing with badge

4. **Advertising Page Checkout** (1 test)
   - Navigate to `/advertising`
   - Click checkout on any tier (e.g., Featured Package $199)
   - Stripe checkout appears
   - Complete payment with test card
   - Verify success message (no errors)

5. **Stripe Secret Key Not Exposed** (1 test)
   - Open browser DevTools → Network tab
   - Trigger a checkout action
   - Review all requests to backend API
   - Verify no request body or response contains `STRIPE_SECRET_KEY`
   - Verify key only used server-side in `/app/api/checkout` route

**Execution Steps for Category 3**:
```bash
# 1. Add Stripe keys to .env.local
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_...

# 2. Restart dev server
npm run dev

# 3. Test advertising page
# Navigate to /advertising
# Click any checkout button
# Verify Stripe form appears

# 4. Test checkout flow
# Enter test card: 4242 4242 4242 4242
# Exp: 12/25 (or any future date)
# CVC: 123
# Complete payment

# 5. Verify secret key not exposed
# Open DevTools → Network tab
# Repeat checkout and inspect all requests
# Confirm sk_test_* NOT in any frontend request
```

**Success Criteria**: All 5 tests pass. Stripe secret key must not appear in any frontend network request.

---

### Category 4: Netlify Deployment (Requires Netlify Account)
**Count**: 5 tests | **Execution**: After all local tests pass | **Estimated Time**: 15-25 minutes  
**Dependencies**: 
- Netlify account and site created
- Git repository connected (GitHub/GitLab)
- Environment variables configured in Netlify dashboard
- Build triggers configured

#### Prerequisites Before Starting:
- Netlify site created and linked to GitHub repo
- All environment variables configured in Netlify site settings:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`

#### Tests:
1. **Netlify Build Succeeds** (1 test)
   - Push code to GitHub
   - Netlify build triggers automatically
   - Verify build succeeds in Netlify dashboard (no errors)
   - Verify `.next` directory contains built files

2. **Netlify Deployment Succeeds** (1 test)
   - Verify site deploys to `https://<site-name>.netlify.app`
   - Click "Preview" link in Netlify dashboard
   - Verify site loads without 404 or server errors

3. **Public Pages Load on Netlify** (1 test)
   - Navigate to each public page on deployed site:
     - `/`
     - `/find-jobs`
     - `/advertising`
     - `/signin`
     - `/register`
   - Verify each page loads and displays correctly

4. **Authentication Works on Netlify** (1 test)
   - On deployed site, navigate to `/signin`
   - Sign in with test account from Category 2
   - Verify redirect to dashboard works
   - Verify dashboard displays correctly (images, styling, translations)

5. **Stripe Checkout Works on Netlify** (1 test)
   - On deployed site, navigate to `/advertising`
   - Click checkout button
   - Complete test payment
   - Verify success (no Stripe key exposure)

**Execution Steps for Category 4**:
```bash
# 1. Ensure all code is committed and pushed
git add -A
git commit -m "Phase 1 ready for Netlify testing"
git push origin main

# 2. Monitor Netlify build
# Go to Netlify dashboard
# Wait for build to complete
# Check for errors in build log

# 3. Test deployed site
# Click preview link or visit https://<site>.netlify.app
# Test public pages
# Test sign in
# Test checkout

# 4. Verify performance
# Check Netlify Analytics (if enabled)
# Verify no 404 errors in logs
```

**Success Criteria**: All 5 tests pass. Site must be fully functional on Netlify with all services working.

---

## Recommended Test Execution Order

### Phase 1: Foundation (15-20 minutes)
**Goal**: Verify basic build and local functionality  
**Tests**: All Category 1 tests (24 tests)  
**Stop-if**: Any test fails → debug and fix before proceeding

**Checklist**:
- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts
- [ ] All 7 public pages load
- [ ] Language toggle works EN/ES
- [ ] Phase 2 features locked
- [ ] Netlify config files present

**Success**: Proceed to Phase 2

---

### Phase 2: Supabase (30-45 minutes)
**Goal**: Verify database integration and user workflows  
**Tests**: All Category 2 tests (12 tests)  
**Prerequisite**: Supabase project fully configured  
**Stop-if**: Any test fails → check Supabase schema and RLS policies

**Checklist**:
- [ ] Env variables configured
- [ ] User registration works
- [ ] User sign in works
- [ ] Profiles created correctly
- [ ] Job posting works (approved=false by default)
- [ ] Admin role accessible
- [ ] Job approval workflow works
- [ ] Public job visibility correct (approved only)

**Success**: Proceed to Phase 3

---

### Phase 3: Stripe (25-35 minutes)
**Goal**: Verify payment processing and checkout flow  
**Tests**: All Category 3 tests (5 tests)  
**Prerequisite**: Stripe account in test mode with keys configured  
**Stop-if**: Stripe secret key exposed in frontend → security issue

**Checklist**:
- [ ] Checkout buttons present
- [ ] Standard job checkout works
- [ ] Featured job checkout works
- [ ] Advertising checkout works
- [ ] Secret key not exposed

**Success**: Proceed to Phase 4

---

### Phase 4: Netlify (15-25 minutes)
**Goal**: Verify production deployment  
**Tests**: All Category 4 tests (5 tests)  
**Prerequisite**: Netlify site created and env vars configured  
**Stop-if**: Build fails or Netlify deployment fails

**Checklist**:
- [ ] Build succeeds on Netlify
- [ ] Site deploys successfully
- [ ] Public pages load on deployed site
- [ ] Auth works on deployed site
- [ ] Stripe works on deployed site

**Success**: Phase 1 ready for production

---

## Likely Blockers and How to Resolve

### Blocker 1: Supabase Connection Error
**Symptom**: "Cannot connect to Supabase" or undefined auth errors  
**Cause**: Missing or incorrect environment variables  
**Resolution**:
1. Verify `.env.local` contains:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Copy from Supabase dashboard → Settings → API
3. Restart dev server: `npm run dev`

### Blocker 2: Job Listing Not Appearing in Admin Dashboard
**Symptom**: Employer posts job, but admin dashboard shows no pending jobs  
**Cause**: Job not being saved to database or query not filtering correctly  
**Resolution**:
1. Check `job_listings` table in Supabase directly
2. Verify job record exists with `approved=false`
3. Check admin dashboard query: should filter `WHERE approved=false`
4. If record missing, check job posting form for validation errors
5. Review browser console for JavaScript errors during submission

### Blocker 3: Approved Job Not Appearing on /find-jobs
**Symptom**: Admin approves job (approved=true in DB), but public listing shows nothing  
**Cause**: Find Jobs page query not filtering correctly or RLS policy blocking read  
**Resolution**:
1. Verify job record in Supabase: `approved=true`
2. Check Find Jobs page query: should filter `WHERE approved=true`
3. Check Supabase RLS policy on `job_listings`: should allow public read for approved jobs
4. Clear browser cache and refresh page
5. Sign out and view as anonymous to verify public access

### Blocker 4: Stripe Checkout Button Not Appearing
**Symptom**: Advertising page loads but no checkout buttons visible  
**Cause**: Missing Stripe publishable key or component not rendering  
**Resolution**:
1. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`
2. Restart dev server: `npm run dev`
3. Check browser console for JavaScript errors
4. Verify checkout button component is rendered in `/advertising` page
5. Look for any conditional logic hiding buttons

### Blocker 5: Stripe Payment Fails
**Symptom**: Checkout completes but payment declined or timeout  
**Cause**: Stripe API key mismatch or webhook not configured  
**Resolution**:
1. Verify Stripe account is in test mode
2. Check keys match Stripe dashboard:
   - Publishable key starts with `pk_test_`
   - Secret key starts with `sk_test_`
3. Verify test card used: `4242 4242 4242 4242`
4. Check Stripe API logs for error details
5. For Netlify: webhook endpoint will be configured after deployment

### Blocker 6: Netlify Build Fails
**Symptom**: Build error in Netlify dashboard logs  
**Cause**: Missing dependencies, TypeScript errors, or environment variables  
**Resolution**:
1. Check Netlify build log for specific error message
2. Run locally: `npm run build` to reproduce
3. Verify all environment variables set in Netlify dashboard
4. Check `next.config.js` for build configuration issues
5. Review recent code changes for breaking changes

### Blocker 7: "Cannot POST /api/checkout" Error
**Symptom**: Stripe checkout button appears but payment fails with 404  
**Cause**: API route not created or path incorrect  
**Resolution**:
1. Verify `/app/api/checkout` directory exists
2. Verify route file exists: `/app/api/checkout/route.js` (Next.js 13+ App Router)
3. Verify route handles POST requests
4. Check browser console network tab for actual request URL and response
5. Restart dev server after creating/modifying route

### Blocker 8: Language Toggle Not Working
**Symptom**: Buttons appear but text doesn't change when clicked  
**Cause**: Translation context not working or keys missing  
**Resolution**:
1. Check `lib/useLanguage.js` exists and imports correctly
2. Verify `LanguageProvider` wraps entire app in `app/layout.js`
3. Check browser console for errors: "useLanguage is not defined"
4. Verify translation keys in dictionary for test language
5. Check if component is using `t()` function correctly

### Blocker 9: Phase 2 Features Accidentally Active
**Symptom**: Continent selector appears in navigation or messaging feature shows up  
**Cause**: Phase 2 code merged into Phase 1 branch  
**Resolution**:
1. Review recent commits: `git log --oneline -10`
2. Search for Phase 2 keywords: `continent`, `messaging`, `AI match`, `resume`
3. If found, remove or comment out Phase 2 code
4. Create new test branch to isolate Phase 1 code
5. Verify with: `grep -r "continent" app/ | grep -v "node_modules" | grep -v ".next"`

---

## Testing Checklist Template

Copy and use this for tracking test execution:

```markdown
## Phase 1: Foundation Tests ✓/24 PASS
- [ ] npm install succeeds
- [ ] npm run build succeeds  
- [ ] npm run dev starts locally
- [ ] Home page loads
- [ ] Find Jobs page loads
- [ ] Traveling Man page loads
- [ ] Advertising page loads
- [ ] Post a Job page loads
- [ ] Sign In page loads
- [ ] Register page loads
- [ ] English text displays
- [ ] Spanish text displays
- [ ] Language toggle works
- [ ] No continent system active
- [ ] No messaging active
- [ ] No AI matching active
- [ ] No resume upload active
- [ ] netlify.toml exists
- [ ] Build command correct
- [ ] Publish directory correct
- [ ] Environment variables documented

## Phase 2: Supabase Tests ✓/12 PASS
- [ ] Environment variables configured
- [ ] User registration works
- [ ] User sign in works
- [ ] Job seeker profile created
- [ ] Employer profile created
- [ ] Job listing saved (approved=false)
- [ ] Admin dashboard accessible
- [ ] Jobs default to approved=false
- [ ] Admin can approve job
- [ ] Approved job appears publicly
- [ ] Unapproved job hidden from public
- [ ] Job data integrity verified

## Phase 3: Stripe Tests ✓/5 PASS
- [ ] Stripe checkout buttons present
- [ ] Standard job checkout works
- [ ] Featured job checkout works
- [ ] Advertising checkout works
- [ ] Stripe secret key not exposed

## Phase 4: Netlify Tests ✓/5 PASS
- [ ] Netlify build succeeds
- [ ] Netlify deployment succeeds
- [ ] Public pages load on Netlify
- [ ] Authentication works on Netlify
- [ ] Stripe checkout works on Netlify

## Summary
Total Tests: 56  
Phase 1 Foundation: 24 ✓  
Phase 2 Supabase: 12 ✓  
Phase 3 Stripe: 5 ✓  
Phase 4 Netlify: 5 ✓  

**Status**: READY FOR PRODUCTION ✓
```

---

## Next Steps After Testing

1. **All Tests Pass**: Proceed to Phase 2 implementation
2. **Some Tests Fail**: Document in issue tracker and assign to development
3. **Critical Blockers**: Resolve before moving to next phase
4. **Performance Issues**: Note and schedule optimization after Phase 2

---

## Summary

| Category | Tests | Execution Time | Blocker Impact |
|----------|-------|---------------|----|
| Local Only | 24 | 15-20 min | HIGH |
| Supabase | 12 | 30-45 min | CRITICAL |
| Stripe | 5 | 25-35 min | HIGH |
| Netlify | 5 | 15-25 min | HIGH |
| **TOTAL** | **56** | **85-125 min** | **All required** |

**Estimated Total Time**: 1.5 to 2 hours for full Phase 1 testing  
**Recommended Timeline**: Complete within one session  
**Approval Gate**: All 56 tests must pass before production deployment
