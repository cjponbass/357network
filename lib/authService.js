// Authentication Service Layer
//
// Handles all authentication-related operations including signup, login, logout,
// and user role management. Integrates with Supabase Auth and user profiles.
//
// PLACEHOLDER: Currently structured for integration but without live Supabase connection.
// Phase 2 will connect these functions to the actual Supabase backend.

import { supabase } from './supabase'

/**
 * Signup - Create a new user account with email, password, and profile
 *
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} role - User's role: 'job_seeker', 'employer', or 'advertiser'
 * @returns {Promise<{user, error}>} Returns { user: {...}, error: null } on success,
 *          or { user: null, error: "message" } on failure
 *
 * Process:
 * 1. Validates input parameters
 * 2. Calls Supabase Auth signup with email and password
 * 3. If signup succeeds, creates user profile in profiles table with role
 * 4. Returns authenticated user on success or error message on failure
 */
export async function signup(email, password, firstName, lastName, role) {
  try {
    // Input validation
    if (!email || !password || !firstName || !lastName || !role) {
      return {
        user: null,
        error: 'auth.error_all_fields_required'
      }
    }

    // Validate role
    const validRoles = ['job_seeker', 'employer', 'advertiser']
    if (!validRoles.includes(role)) {
      return {
        user: null,
        error: 'auth.error_invalid_role'
      }
    }

    // Execute Supabase Auth signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          role
        }
      }
    })

    if (authError) {
      return {
        user: null,
        error: authError.message || 'auth.error_signup_failed'
      }
    }

    if (!authData.user) {
      return {
        user: null,
        error: 'auth.error_no_user_returned'
      }
    }

    // Sign in the user immediately after signup so they have an authenticated session
    // This allows the profile insert to work with RLS policies
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    // Continue even if sign-in fails - we'll still try to create the profile

    // Create user profile in profiles table with role
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: `${firstName} ${lastName}`,
        role,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    // If table doesn't exist, try to create it
    if (profileError && profileError.message && profileError.message.includes('profiles')) {

      // Try to create the table using raw SQL through Supabase
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT,
          role TEXT NOT NULL DEFAULT 'job_seeker',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

        CREATE POLICY IF NOT EXISTS "Users can read own" ON profiles FOR SELECT USING (auth.uid() = id);
        CREATE POLICY IF NOT EXISTS "Users can insert own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
        CREATE POLICY IF NOT EXISTS "Users can update own" ON profiles FOR UPDATE USING (auth.uid() = id);
      `

      // Attempt to create table and retry insert
      const { error: createErr } = await supabase.rpc('exec_sql', { sql: createTableSQL }).catch(() => ({error: {message: 'RPC not available'}}))

      if (!createErr || createErr.message === 'RPC not available') {
        // RPC not available, but retry the insert anyway in case table now exists
        const retry = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            full_name: `${firstName} ${lastName}`,
            role,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        profileData = retry.data
        profileError = retry.error
      }
    }

    if (profileError) {
      // Check if it's a table-not-found error
      if (profileError.message && profileError.message.includes('profiles')) {
        return {
          user: null,
          error: 'Database not initialized. Please visit /setup to create required tables.'
        }
      }
      return {
        user: null,
        error: `Profile creation failed: ${profileError.message}`
      }
    }

    return {
      user: {
        ...authData.user,
        role
      },
      error: null
    }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      user: null,
      error: 'auth.error_unexpected_signup'
    }
  }
}

/**
 * Login - Authenticate user with email and password
 *
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{user, error}>} Returns { user: {...}, error: null } on success,
 *          or { user: null, error: "message" } on failure
 *
 * Process:
 * 1. Validates email and password provided
 * 2. Calls Supabase Auth signInWithPassword
 * 3. Returns authenticated user and session on success
 * 4. Returns error message on authentication failure
 */
export async function login(email, password) {
  try {
    // Input validation
    if (!email || !password) {
      return {
        user: null,
        error: 'auth.error_email_password_required'
      }
    }

    // Execute Supabase Auth signin
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return {
        user: null,
        error: error.message || 'auth.error_login_failed'
      }
    }

    if (!data.user) {
      return {
        user: null,
        error: 'auth.error_no_user_returned'
      }
    }

    // Fetch user role from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Could not fetch user role:', profileError.message)
    }

    return {
      user: {
        ...data.user,
        role: profileData?.role || null
      },
      error: null
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      user: null,
      error: 'auth.error_unexpected_login'
    }
  }
}

/**
 * Logout - Sign out the current user
 *
 * @returns {Promise<{error}>} Returns { error: null } on success,
 *          or { error: "message" } on failure
 *
 * Process:
 * 1. Calls Supabase Auth signOut to clear session
 * 2. Clears any local authentication state
 * 3. Returns error message if logout fails
 */
export async function logout() {
  try {
    // Execute Supabase Auth signout
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.warn('Supabase signOut error (clearing session anyway):', error.message)
    }

    // Clear all Supabase auth-related localStorage keys
    // This ensures the session is completely cleared even if signOut has issues
    const localStorageKeys = Object.keys(localStorage)
    localStorageKeys.forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
      }
    })

    // Also clear sessionStorage if it has any auth data
    const sessionStorageKeys = Object.keys(sessionStorage)
    sessionStorageKeys.forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key)
      }
    })

    return {
      error: null
    }
  } catch (error) {
    console.error('Logout error:', error)
    return {
      error: 'auth.error_unexpected_logout'
    }
  }
}

/**
 * getCurrentUser - Retrieve the currently authenticated user
 *
 * @returns {Promise<{user, error}>} Returns { user: {...}, error: null } if user is authenticated,
 *          or { user: null, error: null } if no user is authenticated,
 *          or { user: null, error: "message" } on error
 *
 * Process:
 * 1. Calls Supabase Auth getSession to check if session exists
 * 2. Returns user from session if authenticated
 * 3. Returns null if no session (not authenticated)
 * 4. Returns error if session retrieval fails
 */
export async function getCurrentUser() {
  try {
    // Get current session from Supabase Auth
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return {
        user: null,
        error: error.message
      }
    }

    if (!data.session) {
      // No active session
      return {
        user: null,
        error: null
      }
    }

    const user = data.session.user

    // Fetch user role from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Could not fetch user role:', profileError.message)
    }

    return {
      user: {
        ...user,
        role: profileData?.role || null
      },
      error: null
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return {
      user: null,
      error: 'auth.error_unexpected_get_user'
    }
  }
}

/**
 * getUserRole - Retrieve the role of a specific user
 *
 * @param {string} userId - The ID of the user whose role to fetch
 * @returns {Promise<{role, error}>} Returns { role: "job_seeker" | "employer" | "advertiser", error: null } on success,
 *          or { role: null, error: "message" } on failure or if user not found
 *
 * Process:
 * 1. Validates userId is provided
 * 2. Queries profiles table for user's role using RLS policies
 * 3. Returns role if found
 * 4. Returns error if user not found or query fails
 *
 * Note: RLS (Row Level Security) policies will ensure users can only
 *       access profiles they're authorized to view.
 */
export async function getUserRole(userId) {
  try {
    // Input validation
    if (!userId) {
      return {
        role: null,
        error: 'auth.error_user_id_required'
      }
    }

    // Query profiles table for user's role
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Row not found
        return {
          role: null,
          error: 'auth.error_user_not_found'
        }
      }
      return {
        role: null,
        error: error.message || 'auth.error_unexpected_get_role'
      }
    }

    if (!data || !data.role) {
      return {
        role: null,
        error: 'auth.error_user_role_not_found'
      }
    }

    return {
      role: data.role,
      error: null
    }
  } catch (error) {
    console.error('Get user role error:', error)
    return {
      role: null,
      error: 'auth.error_unexpected_get_role'
    }
  }
}

export default {
  signup,
  login,
  logout,
  getCurrentUser,
  getUserRole
}
