import { NextResponse } from 'next/server';

/**
 * Next.js Middleware for Route Protection
 *
 * This middleware handles authentication and authorization checks for protected routes.
 *
 * PROTECTED ROUTES (Phase 2):
 * - /dashboard/* - all dashboard routes (job seekers)
 * - /employer-dashboard/* - employer-specific dashboard
 * - /advertiser-dashboard/* - advertiser-specific dashboard
 *
 * BEHAVIOR:
 * - Unauthenticated users are redirected to /signin
 * - Authenticated users can access their role-appropriate dashboards
 *
 * NOTE: This is a placeholder implementation for Phase 2.
 * Full Supabase session validation will be integrated in Phase 2.
 * Currently, middleware structure is in place and ready for authentication integration.
 */

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/employer-dashboard',
    '/advertiser-dashboard',
  ];

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Skip middleware for non-protected routes
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  /**
   * PHASE 2: Authentication Check
   *
   * This section will be updated in Phase 2 to:
   * 1. Extract session token from request cookies
   * 2. Validate token with Supabase
   * 3. Check user role against required role for route
   * 4. Handle token refresh if expired
   * 5. Log authentication events
   *
   * Current placeholder returns NextResponse.next() to allow access.
   * This will be replaced with actual session validation.
   */

  // TODO: Phase 2 - Uncomment and implement when Supabase auth is ready
  /*
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('sb-access-token')?.value;

    if (!sessionToken) {
      // No session token - redirect to signin
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Validate token with Supabase Admin SDK
    const { data, error } = await supabaseAdmin.auth.getUser(sessionToken);

    if (error || !data.user) {
      // Invalid token - redirect to signin
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // TODO: Add role-based route validation
    // Check if user's role can access this route

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware authentication error:', error);
    // On error, redirect to signin for security
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }
  */

  // Placeholder: Allow access (Phase 2 will add actual auth checks)
  return NextResponse.next();
}

/**
 * Matcher Configuration
 *
 * Specifies which routes should be processed by this middleware.
 * Using explicit path matching to avoid processing static files and API routes.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
