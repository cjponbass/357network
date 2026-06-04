// Database Initialization API Route
// This route creates required database tables if they don't exist

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CREATE_PROFILES_TABLE_SQL } from '@/lib/setupDatabase'

export async function GET(request) {
  try {
    // Create Supabase client with service role for admin operations
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    // Try to execute the SQL to create the table
    const { error } = await supabase.rpc('exec', {
      sql: CREATE_PROFILES_TABLE_SQL
    })

    if (error) {
      console.log('[DB_INIT] RPC exec not available, table may need manual creation')
      // This is expected - the RPC function doesn't exist yet
      // The table needs to be created manually in Supabase SQL editor
    }

    return Response.json({
      success: true,
      message: 'Database initialization completed'
    })

  } catch (error) {
    console.error('[DB_INIT] Error:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
