# Supabase Setup Instructions for 357NETWORK

## Overview

These instructions guide you through creating a **completely new and isolated** Supabase project for 357NETWORK. This project will be independent and will not share any resources with existing Supabase projects.

**IMPORTANT:** 357NETWORK must use a dedicated Supabase project. Do not reuse or share databases with other projects.

---

## Prerequisites

- A Supabase account (free or paid tier)
- Access to https://app.supabase.com
- The file `docs/SUPABASE_SCHEMA.sql` from this repository
- Text editor to create `.env.local`

---

## Step 1: Create a New Supabase Project

### 1.1 Log in to Supabase Dashboard

1. Go to https://app.supabase.com
2. Sign in with your Supabase account
3. You should see the Projects page

### 1.2 Create New Project

1. Click **"New Project"** (or **"Create a new project"**)
2. Fill in the project details:

   | Field | Value |
   |-------|-------|
   | **Name** | `357network-production` |
   | **Database Password** | Create a strong password and save it securely |
   | **Region** | Select closest to your users (e.g., `us-east-1` for US) |
   | **Pricing Plan** | Free tier is sufficient for Phase 1 testing |

3. Click **"Create new project"**
4. Wait for the project to initialize (2-3 minutes)

### 1.3 Verify Project Creation

Once initialized, you should see:
- Project name: `357network-production`
- Project status: "Active" (green indicator)
- Your project is now visible in the Projects list

---

## Step 2: Obtain Project Credentials

### 2.1 Get Project URL

1. In your new project, click **"Settings"** (bottom left gear icon)
2. Click **"API"** in the left sidebar
3. Under **"Project URL"**, copy the full URL
4. Example format: `https://xxxxxxxxxxxxx.supabase.co`
5. Save this as `NEXT_PUBLIC_SUPABASE_URL` in your notes

### 2.2 Get Anon Key (Public API Key)

1. Still in Settings → API
2. Under **"Project API keys"**, find the **"anon"** key (labeled as "Public")
3. Click the copy icon to copy the key
4. Example format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
5. Save this as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your notes

### 2.3 Get Service Role Key (Secret Key)

1. Still in Settings → API
2. Under **"Project API keys"**, find the **"service_role"** key (labeled as "Secret")
3. Click the copy icon to copy the key
4. Example format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
5. **IMPORTANT:** This is a secret key. Never commit it to git or share it.
6. Save this as `SUPABASE_SERVICE_ROLE_KEY` in your notes

---

## Step 3: Create Environment Variables File

### 3.1 Create `.env.local`

1. In the root directory of the 357NETWORK project, create a new file: `.env.local`
2. Copy the contents from `.env.example`:

```bash
cp .env.example .env.local
```

### 3.2 Fill in Supabase Credentials

Open `.env.local` in a text editor and fill in:

```env
# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================

# Your Supabase project URL (from Step 2.1)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Your Supabase anonymous (public) API key (from Step 2.2)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your Supabase service role key (from Step 2.3) — KEEP SECRET
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# STRIPE CONFIGURATION (Configure in Step 4)
# ============================================================================

# Your Stripe secret API key (to be added later)
STRIPE_SECRET_KEY=

# Your Stripe publishable API key (to be added later)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Your Stripe webhook signing secret (to be added later)
STRIPE_WEBHOOK_SECRET=

# ============================================================================
# SITE CONFIGURATION
# ============================================================================

# The full URL of your site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3.3 Verify `.env.local` Is Not Committed

Make sure `.env.local` is listed in `.gitignore`:

```bash
grep -n "\.env\.local" .gitignore
```

You should see `.env.local` listed. If not, add it:

```
.env.local
```

---

## Step 4: Run the Database Schema

### 4.1 Open Supabase SQL Editor

1. In your 357network-production project, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**

### 4.2 Copy and Paste the Schema

1. Open the file `docs/SUPABASE_SCHEMA.sql` from this repository
2. Copy the **entire contents**
3. Paste into the Supabase SQL Editor text area
4. **Do NOT modify the SQL** — it is designed to be safe and idempotent

### 4.3 Execute the Schema

1. Click the **"RUN"** button (or press `Ctrl+Enter`)
2. You should see a success message: **"Success. No rows returned"**
3. If you see an error, check that:
   - The SQL is complete (all code pasted)
   - You're in the correct project
   - The project is fully initialized

### 4.4 Handle Errors

If you see an error like:

```
relation "public.profiles" already exists
```

This is **normal** if you've run the schema before. The schema uses `if not exists` clauses, so it won't error on re-runs. Ignore this message.

---

## Step 5: Verify Table Creation

### 5.1 View Tables in Supabase

1. Click **"Table Editor"** (left sidebar)
2. You should see four tables listed under `public`:
   - `profiles`
   - `employers`
   - `jobs`
   - `advertising_orders`

### 5.2 Inspect a Table

1. Click on the `profiles` table
2. You should see columns:
   - `id` (uuid, primary key)
   - `role` (text)
   - `full_name` (text)
   - `email` (text)
   - `city` (text)
   - `state` (text)
   - `profession` (text)
   - `desired_work_type` (text)
   - `remote_available` (boolean)
   - `traveling_man_available` (boolean)
   - `mason_good_standing_self_attested` (boolean)
   - `bio` (text)
   - `created_at` (timestamptz)

3. If all columns are present, the schema was applied correctly ✓

---

## Step 6: Verify Row Level Security Policies

### 6.1 View RLS Policies

1. In the Table Editor, click on the `jobs` table
2. Click the **"RLS"** tab (or look for security settings)
3. You should see a list of policies:
   - "Public can view approved jobs"
   - "Admin can view all jobs"
   - "Employers can view approved jobs"
   - "Employers can insert own jobs"
   - "Employers can update own jobs"
   - "Employers can delete own jobs"
   - "Admin can manage all jobs"

### 6.2 Verify RLS Is Enabled

1. Still in the `jobs` table, look for an **"RLS"** toggle or indicator
2. It should show **"RLS is ON"** or similar
3. If it shows **"RLS is OFF"**, the schema failed. Re-run the schema SQL.

### 6.3 Check Other Tables

Repeat steps 6.1-6.2 for:
- `profiles`
- `employers`
- `advertising_orders`

All should have RLS enabled with appropriate policies.

---

## Step 7: Create the First Admin Account

### 7.1 Create a User via Supabase Auth

1. In your project, click **"Authentication"** (left sidebar)
2. Click **"Users"**
3. Click **"Create new user"** or **"Add user"**
4. Fill in:
   - **Email:** Your admin email (e.g., `admin@357network.local`)
   - **Password:** Create a secure admin password
5. Click **"Create user"**

### 7.2 Set the Admin Role

1. Click **"Table Editor"** (left sidebar)
2. Click on the `profiles` table
3. Look for the row with your admin email (it may not be there yet)
4. If the row doesn't exist, click **"Insert Row"** and fill in:
   - `id` — Copy the user ID from the user you just created (from Authentication → Users)
   - `role` — Type `admin`
   - `full_name` — Your name (optional)
   - `email` — Same as the user email
   - Other fields — Leave blank (optional)
5. Click **"Save"**

### 7.3 Verify Admin Role

1. In Table Editor → `profiles`, find your admin row
2. Confirm the `role` column shows `admin`
3. The admin account is now ready ✓

---

## Step 8: Test the Setup (Optional)

### 8.1 Test Backend Connection

Run your Next.js application locally:

```bash
npm run dev
```

Open http://localhost:3000 in your browser. The homepage should load without errors.

### 8.2 Test Supabase Connection (In Next.js Code)

Once you build the authentication flow (Step 6 in BUILD_SEQUENCE.md), you can test:
- User registration → New row in `profiles` table ✓
- User sign-in → Supabase auth validates ✓
- Profile access → RLS policies enforce access ✓

---

## Troubleshooting

### Issue: "Project URL not found" or credential errors

**Solution:**
1. Verify you copied the correct URL and keys from Settings → API
2. Check that there are no extra spaces or line breaks in `.env.local`
3. Restart your Next.js development server after updating `.env.local`

### Issue: "RLS is OFF" or "RLS policies not found"

**Solution:**
1. Re-run the schema SQL in the SQL Editor
2. Verify there were no error messages during execution
3. Check that the policies were created by viewing individual tables in Table Editor

### Issue: "User insertion failed" or "Auth error"

**Solution:**
1. Confirm the user was created in Authentication → Users
2. Verify the `profiles` row has the correct `id` (must match the auth user's ID)
3. Check that the `role` column is set to `admin`

### Issue: "403 Forbidden" or "Permission denied"

**Solution:**
1. Verify the `.env.local` keys are correct
2. Ensure RLS is enabled and policies exist
3. If testing as admin, confirm the user's profile has `role = 'admin'`

---

## Next Steps

1. ✅ You have a standalone 357NETWORK Supabase project
2. ✅ Database schema is installed with admin approval workflows
3. ✅ RLS policies protect data access
4. ✅ First admin account is ready

**Proceed to Step 4 of BUILD_SEQUENCE.md: App Layout**

---

## Security Reminders

- **Never commit `.env.local` to git**
- **Never share the `SUPABASE_SERVICE_ROLE_KEY`**
- **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend**
- **Always keep your Supabase database password secure**
- **Rotate credentials regularly in production**

---

## Additional Resources

- Supabase Documentation: https://supabase.com/docs
- Supabase Dashboard: https://app.supabase.com
- Next.js Environment Variables: https://nextjs.org/docs/basic-features/environment-variables

