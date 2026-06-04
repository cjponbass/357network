'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useLanguage } from '@/lib/useLanguage'

/**
 * Main Dashboard Page (app/dashboard/page.js)
 *
 * Purpose: Redirect authenticated users to their role-specific dashboard
 *
 * Flow:
 * 1. Checks if user is authenticated via useAuth()
 * 2. Gets user role from authentication context
 * 3. Redirects to appropriate dashboard based on role:
 *    - job_seeker → /dashboard/job-seeker
 *    - employer → /dashboard/employer
 *    - advertiser → /dashboard/advertiser
 *    - admin → /dashboard/admin
 *    - null (not authenticated) → /signin
 * 4. Shows loading state while determining role
 */

export default function DashboardPage() {
  const router = useRouter()
  const { user, role, loading, isAuthenticated } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    // If still loading, wait for auth state to resolve
    if (loading) {
      return
    }

    // If not authenticated, redirect to signin
    if (!isAuthenticated || !role) {
      router.push('/signin')
      return
    }

    // Redirect to role-specific dashboard
    switch (role) {
      case 'job_seeker':
        router.push('/dashboard/job-seeker')
        break
      case 'employer':
        router.push('/dashboard/employer')
        break
      case 'advertiser':
        router.push('/dashboard/advertiser')
        break
      case 'admin':
        router.push('/dashboard/admin')
        break
      default:
        // Unknown role, redirect to signin
        router.push('/signin')
    }
  }, [isAuthenticated, role, loading, router])

  // Show loading state while determining role
  return (
    <div className="dashboard-loading">
      <div className="loading-container">
        <div className="spinner"></div>
        <h2>{t('dashboard.redirect.loading_dashboard')}</h2>
        <p>{t('dashboard.redirect.determining_role')}</p>
      </div>
      <style jsx>{`
        .dashboard-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .loading-container {
          text-align: center;
          background: white;
          padding: 60px 40px;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          max-width: 400px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 30px;
        }

        h2 {
          color: #333;
          margin: 0 0 10px;
          font-size: 24px;
        }

        p {
          color: #666;
          margin: 5px 0 0;
          font-size: 14px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
