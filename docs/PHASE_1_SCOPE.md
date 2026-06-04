# Phase 1 Scope — Build This First

## Phase 1 Goal
Create a working U.S.-focused English/Spanish job board for 357NETWORK with Supabase, Stripe, and Netlify.

## Required Pages

### Public Pages
1. Home
2. Find Jobs
3. Traveling Man Jobs
4. Post a Job
5. Advertising
6. Sign In
7. Register
8. Terms placeholder
9. Privacy placeholder

### Authenticated Pages
1. Job Seeker Dashboard
2. Employer Dashboard
3. Submit Job Posting
4. Manage My Jobs
5. Admin Review Page

## Required User Roles
- job_seeker
- employer
- advertiser
- admin

## Job Seeker Profile Fields
- full_name
- email
- city
- state
- profession
- desired_work_type
- remote_available
- traveling_man_available
- mason_good_standing_self_attested
- bio

## Employer Profile Fields
- company_name
- contact_name
- email
- city
- state
- industry
- website
- masonic_friendly_employer
- mason_good_standing_self_attested

## Job Posting Fields
- title
- company_name
- category
- city
- state
- remote
- traveling_man
- description
- requirements
- compensation_range
- contact_email
- paid_status
- featured
- approved
- created_at

## Job Categories
- Skilled Trades
- Construction
- Technology
- Sales
- Healthcare
- Transportation
- Management
- Hospitality
- Remote Work
- Other

## Filters
- keyword
- category
- state
- remote
- traveling_man
- featured

## Stripe Products
1. Standard Job Listing
2. Featured Job Listing
3. Advertising Placement

## Admin Controls
- Approve job listing
- Remove job listing
- Mark listing as featured
- View self-attestation status

## Phase 1 Completion Definition
Phase 1 is complete only when:
- Users can register and sign in
- Employers can submit jobs
- Stripe checkout can be triggered
- Jobs can be stored in Supabase
- Approved jobs display publicly
- English/Spanish UI exists
- Netlify deployment works
- No Phase 2 features are active
