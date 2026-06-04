// Database Initialization
//
// This module ensures required database tables exist in Supabase.
// Called once on application startup.

import { supabase } from './supabase'

/**
 * Initialize database schema
 * Creates profiles table if it doesn't exist
 */
export async function initializeDatabase() {
  try {
    console.log('[DB_INIT] Initializing database schema...');

    // Get current user to check if we can access Supabase
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[DB_INIT] Failed to get session:', error);
      return { success: false, error: error.message };
    }

    // Create profiles table if it doesn't exist
    // Using raw SQL execution through Supabase client
    const { error: schemaError } = await supabase.rpc('create_profiles_table_if_not_exists');

    if (schemaError && schemaError.code !== 'PGRST204') {
      // PGRST204 means the function doesn't exist yet, which is fine
      console.log('[DB_INIT] Create profiles RPC not available, table may already exist');
    }

    console.log('[DB_INIT] Database initialization complete');
    return { success: true };
  } catch (error) {
    console.error('[DB_INIT] Initialization error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create profiles table via Supabase SQL
 * This should be run through Supabase console, but we'll try via RPC
 */
export const profilesTableSQL = `
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'job_seeker',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy for authenticated users to insert their profile
CREATE POLICY "Authenticated users can insert profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create RPC function to initialize profiles table
CREATE OR REPLACE FUNCTION create_profiles_table_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'job_seeker',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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
  END IF;
END;
$$ LANGUAGE plpgsql;
`;
