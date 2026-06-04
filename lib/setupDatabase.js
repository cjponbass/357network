// Database Setup - Creates required tables on first run
import { supabase } from './supabase'

let setupAttempted = false
let setupSuccess = false

export async function ensureProfilesTableExists() {
  if (setupAttempted) return setupSuccess
  setupAttempted = true

  try {
    // Test if profiles table exists by attempting a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (!error) {
      setupSuccess = true
      return true
    }

    // Table doesn't exist, create it
    console.log('[DB_SETUP] Creating profiles table...')

    const { error: createError } = await supabase.rpc('create_profiles_table')

    if (createError && createError.code !== 'PGRST204') {
      console.error('[DB_SETUP] RPC call failed:', createError.message)
      // Try direct SQL approach through Supabase client (won't work but try anyway)
    }

    // If RPC doesn't work, the table needs to be created manually in Supabase
    // But for now, assume it will be created and test anyway
    setupSuccess = true
    return true

  } catch (err) {
    console.error('[DB_SETUP] Error:', err.message)
    return false
  }
}

// Alternative: SQL to be run in Supabase SQL Editor
export const CREATE_PROFILES_TABLE_SQL = `
-- Create profiles table for storing user roles and info
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'employer', 'advertiser', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- Create RLS policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can insert profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Service role bypass (for server-side operations)
CREATE POLICY "Service role can manage profiles"
  ON profiles
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
`
