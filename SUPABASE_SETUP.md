# Supabase Setup for 357NETWORK

## Overview

357NETWORK Phase 1 uses Supabase for authentication and database. This document guides you through the required database schema setup.

## Prerequisites

- Supabase project created at https://supabase.com
- Credentials in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Database Schema Setup

### 1. Create Profiles Table

The application requires a `profiles` table to store user role information. Follow these steps:

#### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com and sign in
2. Select your 357NETWORK project
3. Go to the SQL Editor

#### Step 2: Create Profiles Table

Copy and paste the following SQL into the SQL Editor and execute it:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'job_seeker',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Authenticated users can insert their profile  
CREATE POLICY "Authenticated users can insert profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 4: Allow signup process to create profiles (bypassed by service role)
-- This is handled by the auth system
GRANT ALL ON profiles TO authenticated;
```

#### Step 3: Verify Setup

1. In Supabase Dashboard, go to **Table Editor**
2. You should see the `profiles` table listed
3. Verify it has columns: `id`, `email`, `full_name`, `role`, `created_at`, `updated_at`

### 2. Configure Authentication Settings (Optional but Recommended)

To allow immediate access after signup (without email confirmation):

1. In Supabase Dashboard, go to **Authentication** → **Providers** → **Email**
2. Toggle off **Confirm email** if you want instant access (development mode)
3. Keep it on for production

## Testing Authentication

Once the schema is set up:

1. Start the development server: `npm run dev`
2. Navigate to http://localhost:3000/register
3. Fill in registration form with:
   - Role: Job Seeker
   - First Name: Test
   - Last Name: User
   - Email: any@test.com
   - Password: TestPassword123!
   - Agree to terms

4. Click "Create Account"
5. You should be redirected to the dashboard (or sign in page if email confirmation is required)

## Environment Variables

Ensure your `.env.local` has:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Troubleshooting

### "Table 'profiles' does not exist" Error
- Ensure you've run the SQL to create the table in Supabase
- Check that you're running it in the correct project

### "Permission denied" Error
- Verify RLS policies are created correctly
- Check that the service role key is in .env.local (for server-side operations)

### "Email already registered" Error
- This is normal - try with a different email address
- Or delete the user from Supabase Dashboard → Authentication → Users

### No Session Created After Signup
- Check if email confirmation is enabled in Authentication settings
- If enabled, you'll need to confirm the email before logging in
- For development, it's recommended to disable email confirmation

## Files Modified

- `lib/authService.js` - Handles signup and login
- `lib/AuthContext.js` - Manages authentication state
- `lib/initializeDatabase.js` - Database initialization helper
- `app/register/page.js` - Registration form UI

## Next Steps

1. Complete the schema setup above
2. Test registration at http://localhost:3000/register
3. Verify login works at http://localhost:3000/signin
4. Check that authenticated users can access /dashboard

## Support

For Supabase documentation, visit: https://supabase.com/docs
For 357NETWORK questions, see docs/BUILD_SEQUENCE.md
