// Supabase Client Configuration (Client-Side)
//
// PLACEHOLDER: This configuration file will be connected to a live Supabase project
// in production. For development, these environment variables are placeholders only.
//
// To configure:
// 1. Create a Supabase project at https://supabase.com
// 2. Copy your project URL and anon key from project settings
// 3. Add to .env.local:
//    NEXT_PUBLIC_SUPABASE_URL=your_project_url
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Initialize Supabase client for client-side operations
// This client uses the anon key and is safe to use in the browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
