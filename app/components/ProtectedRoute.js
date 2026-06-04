'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/useLanguage';

/**
 * ProtectedRoute Component
 *
 * Higher-order component that protects client-side routes from unauthenticated access.
 *
 * FEATURES:
 * - Checks authentication status via useAuth hook
 * - Shows loading spinner while checking auth state
 * - Redirects to /signin if user is not authenticated
 * - Passes through authenticated users to wrapped component
 * - Handles loading state gracefully during session restoration
 *
 * USAGE:
 * ```
 * function MyDashboard() {
 *   return <h1>Dashboard Content</h1>;
 * }
 *
 * export default ProtectedRoute(MyDashboard);
 * ```
 *
 * NOTE: This component works alongside the middleware in app/middleware.js
 * for comprehensive route protection. The middleware provides server-side protection,
 * while this component provides client-side protection.
 *
 * Phase 2: Will integrate with Supabase auth for real-time session validation.
 */

export default function ProtectedRoute(WrappedComponent) {
  return function ProtectedRouteWrapper(props) {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const { t } = useLanguage();
    const [isMounted, setIsMounted] = useState(false);

    /**
     * Effect: Handle authentication check and redirect
     *
     * 1. Sets isMounted flag to avoid hydration mismatch
     * 2. If loading is complete and user is not authenticated, redirects to /signin
     * 3. This prevents flash of protected content to unauthenticated users
     */
    useEffect(() => {
      setIsMounted(true);
    }, []);

    useEffect(() => {
      // Only check authentication after component is mounted (avoid hydration issues)
      if (!isMounted) return;

      // If loading is complete and user is not authenticated, redirect
      if (!loading && !isAuthenticated) {
        router.push('/signin');
      }
    }, [isAuthenticated, loading, isMounted, router]);

    /**
     * LOADING STATE
     *
     * While the auth system is checking the user's session,
     * show a loading spinner to prevent content flash.
     *
     * This covers:
     * - Session restoration on initial page load
     * - Token validation checks
     * - Role verification
     */
    if (loading) {
      return (
        <div className="protected-route-loading">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>{t('component.protected_route.verifying')}</p>
          </div>
          <style jsx>{`
            .protected-route-loading {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
            }

            .loading-container {
              text-align: center;
            }

            .spinner {
              width: 40px;
              height: 40px;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }

            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }

            p {
              color: #666;
              font-size: 16px;
              margin: 0;
            }
          `}</style>
        </div>
      );
    }

    /**
     * UNAUTHENTICATED STATE
     *
     * If loading is complete but user is not authenticated,
     * show a message while the redirect is processed.
     * This provides feedback that the user is being redirected.
     */
    if (!isAuthenticated) {
      return (
        <div className="protected-route-unauthorized">
          <div className="unauthorized-container">
            <h2>{t('component.protected_route.access_denied')}</h2>
            <p>{t('component.protected_route.signin_required')}</p>
            <p className="redirect-message">{t('component.protected_route.redirecting')}</p>
          </div>
          <style jsx>{`
            .protected-route-unauthorized {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
            }

            .unauthorized-container {
              text-align: center;
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }

            h2 {
              color: #e74c3c;
              margin: 0 0 10px;
            }

            p {
              color: #666;
              margin: 5px 0;
            }

            .redirect-message {
              margin-top: 15px;
              font-style: italic;
              color: #999;
            }
          `}</style>
        </div>
      );
    }

    /**
     * AUTHENTICATED STATE
     *
     * User is authenticated and session is loaded.
     * Render the wrapped component with all original props.
     */
    return <WrappedComponent {...props} />;
  };
}
