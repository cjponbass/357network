'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useLanguage } from '@/lib/useLanguage'
import { useAuth } from '@/lib/AuthContext'
import LanguageToggle from './LanguageToggle'

export default function Header() {
  const { t } = useLanguage()
  const router = useRouter()
  const { isAuthenticated, user, logout } = useAuth()
  const logoutInProgressRef = useRef(false)

  // Navigate to home when user becomes unauthenticated after logout
  useEffect(() => {
    if (logoutInProgressRef.current && !isAuthenticated) {
      logoutInProgressRef.current = false
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleLogout = async () => {
    logoutInProgressRef.current = true
    await logout()
  }

  // Extract user name from user_metadata or user object
  const userName = user?.user_metadata?.firstName || user?.firstName || null

  return (
    <header className="header">
      <div className="header-container">
        <Link href="/" className="logo-link">
          <div className="logo-section">
            <h1 className="logo">357NETWORK</h1>
            <p className="tagline">Building Careers. Strengthening Brotherhood.</p>
          </div>
        </Link>

        <div className="header-right">
          {isAuthenticated && user ? (
            <div className="user-section">
              <span className="welcome-text">
                {userName ? `${t('component.header.welcome')} ${userName}` : t('component.header.welcome').replace(',', '')}
              </span>
              <button
                onClick={handleLogout}
                className="logout-button"
              >
                {t('component.header.logout')}
              </button>
            </div>
          ) : (
            <LanguageToggle />
          )}
        </div>
      </div>
    </header>
  )
}
