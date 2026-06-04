# 357NETWORK Phase 1 Testing Checklist

Do not deploy until all required items pass.

## Basic Build
- npm install succeeds
- npm run build succeeds
- npm run dev starts locally

## Public Pages
- Home loads
- Find Jobs loads
- Traveling Man loads
- Advertising loads
- Post a Job loads
- Sign In loads
- Register loads

## Supabase
- Environment variables are configured
- User can register
- User can sign in
- User profile can be created
- Employer profile can be created
- Job listing can be saved

## Stripe
- Stripe checkout button exists
- Standard job listing checkout works in test mode
- Featured job listing checkout works in test mode
- Advertising checkout works in test mode
- Stripe secret keys are not exposed to frontend

## Admin
- Jobs default to approved=false
- Admin can approve job
- Approved job appears publicly
- Unapproved job does not appear publicly

## English/Spanish
- English text displays
- Spanish text displays
- Language toggle works

## Netlify
- netlify.toml exists
- Build command works
- Publish directory is correct
- Environment variables are listed in README

## Phase 2 Lock
- No worldwide continent system active
- No private messaging active
- No AI matching active
- No resume upload active
