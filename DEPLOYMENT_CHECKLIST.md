# 357NETWORK Phase 1 - Netlify Deployment Checklist

## Pre-Deployment Setup

### Netlify Site Configuration

**Build Settings:**
- [ ] Build command: `next build`
- [ ] Publish directory: `.next`
- [ ] Node version: `18` (or newer LTS recommended)

**Environment Variables** (Set in Netlify Site Settings > Build & Deploy > Environment)

Required variables:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://madjmtmgtiwhnvxlerki.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_y1TLqw-pzJKPS8HXMX9bIw_OfUX0_D7`
- [ ] `NODE_ENV` = `production`

**Secrets** (Set in Netlify Site Settings > Build & Deploy > Environment > Secrets)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (from .env.local - do NOT commit)

### Git Preparation

- [ ] Branch to deploy: `feature/live-supabase-integration`
- [ ] Latest commit: `9633a45` (Update package-lock.json)
- [ ] Previous commit: `ae9032f` (Fix Post a Job authentication prompt)
- [ ] Working tree clean: `git status` returns "nothing to commit"

---

## Deployment

- [ ] Connect repository to Netlify (if not already connected)
- [ ] Trigger deploy from Netlify dashboard or push to branch
- [ ] Monitor build log for completion
- [ ] Confirm deployment successful

---

## Post-Deployment Testing

**Homepage:**
- [ ] Load `https://[site-url]/`
- [ ] Verify hero section displays
- [ ] Verify navigation links present

**Find Jobs:**
- [ ] Navigate to `/find-jobs`
- [ ] Verify placeholder job cards display immediately (no infinite loading)
- [ ] Verify filters render (keyword, category, state, remote, traveling man)

**Post a Job (Logged Out):**
- [ ] Navigate to `/post-job` while logged out
- [ ] Verify "Please sign in as an employer to post a job" message displays
- [ ] Verify "Sign In" button links to `/signin`
- [ ] Verify "Create Employer Account" button links to `/register`
- [ ] Verify job posting form is NOT visible

**Registration:**
- [ ] Navigate to `/register`
- [ ] Fill form: role=employer, first/last name, email, password
- [ ] Submit form
- [ ] Note: Email verification may be rate-limited by Supabase (expected in Phase 1)

**Sign In:**
- [ ] Navigate to `/signin`
- [ ] Attempt login with test account (if account created successfully)
- [ ] Verify successful login redirects to dashboard

**Dashboard:**
- [ ] After login, verify dashboard loads
- [ ] Confirm user role and account type display correctly

**Logout:**
- [ ] Click logout button
- [ ] Verify redirect to homepage
- [ ] Verify localStorage cleared (no session persists on refresh)

---

## Rollback Plan

If deployment fails:
1. Check Netlify build log for errors
2. If SWC binary errors: Issue is environmental (Netlify uses x86, not ARM)
3. If code errors: Revert to previous commit and redeploy
4. Supabase credentials: If incorrect, update in Netlify dashboard and trigger rebuild

---

## Go-Live Confirmation

- [ ] All tests pass
- [ ] No console errors in browser DevTools
- [ ] 357NETWORK branding and tagline present
- [ ] English/Spanish language toggle functional
- [ ] Ready for user access

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Status:** ☐ LIVE  ☐ TESTING  ☐ ROLLBACK
