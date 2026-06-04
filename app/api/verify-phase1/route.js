// Phase 1 Verification Endpoint
import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const results = {
    registration: 'PENDING',
    auth_user_created: 'PENDING',
    profile_row_created: 'PENDING',
    login: 'PENDING',
    dashboard_render: 'PENDING',
    session_persistence: 'PENDING',
    logout: 'PENDING',
    protected_route_redirect: 'PENDING'
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Check if test user exists in auth.users
    console.log('[VERIFY] Checking for test user in auth.users...')
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    let testUser = null
    if (users && users.users) {
      testUser = users.users.find(u => u.email && u.email.includes('phase1user'))
    }

    if (testUser) {
      results.auth_user_created = 'PASS'
      console.log('[VERIFY] ✅ Auth user found:', testUser.id)
    } else {
      results.auth_user_created = 'FAIL'
      console.log('[VERIFY] ❌ Auth user NOT found')
    }

    // 2. Check if profile row exists in public.profiles
    if (testUser) {
      console.log('[VERIFY] Checking for profile row...')
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', testUser.id)
        .single()

      if (profile) {
        results.profile_row_created = 'PASS'
        console.log('[VERIFY] ✅ Profile row found:', profile.id)
      } else {
        results.profile_row_created = 'FAIL'
        console.log('[VERIFY] ❌ Profile row NOT found', profileError?.message)
      }
    }

    // 3. Test login (client-side would do this, but we can't from API)
    // For now, mark as testable
    results.login = 'TESTABLE'
    results.dashboard_render = 'TESTABLE'
    results.session_persistence = 'TESTABLE'
    results.logout = 'TESTABLE'
    results.protected_route_redirect = 'TESTABLE'

    // Mark registration infrastructure as PASS if auth user was created
    if (results.auth_user_created === 'PASS') {
      results.registration = 'PASS'
    }

    return Response.json({
      success: true,
      results,
      testUser: testUser ? {
        id: testUser.id,
        email: testUser.email,
        created_at: testUser.created_at
      } : null,
      message: 'Verification check complete'
    })

  } catch (err) {
    console.error('[VERIFY] Exception:', err)
    return Response.json({
      success: false,
      error: err.message,
      results
    }, { status: 500 })
  }
}
