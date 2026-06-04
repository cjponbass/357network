'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/lib/useLanguage'
import { useAuth } from '@/lib/AuthContext'

export default function Navigation() {
  const { t } = useLanguage()
  const router = useRouter()
  const { isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const logoutInProgressRef = useRef(false)

  // Navigate to home when user becomes unauthenticated after logout
  useEffect(() => {
    if (logoutInProgressRef.current && !isAuthenticated) {
      logoutInProgressRef.current = false
      router.push('/')
    }
  }, [isAuthenticated, router])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    closeMobileMenu()
    logoutInProgressRef.current = true
    await logout()
  }

  // Build nav links based on auth state
  const baseLinks = [
    { href: '/', label: t('nav.home') || 'Home' },
    { href: '/find-jobs', label: t('nav.find_jobs') || 'Find Jobs' },
    { href: '/traveling-man', label: t('nav.traveling_man') || 'Traveling Man' },
    { href: '/post-job', label: t('nav.post_job') || 'Post a Job' },
    { href: '/advertising', label: t('nav.advertising') || 'Advertising' },
  ]

  const authLinks = isAuthenticated
    ? [] // No Sign In/Register when authenticated
    : [
        { href: '/signin', label: t('nav.signin') || 'Sign In' },
        { href: '/register', label: t('nav.register') || 'Register' },
      ]

  const navLinks = [...baseLinks, ...authLinks]

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Desktop Navigation */}
        <div className="nav-desktop">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="nav-link nav-logout-button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '15px 20px', textAlign: 'left' }}
            >
              {t('component.header.logout') || 'Logout'}
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="nav-mobile-button"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="nav-mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-mobile-link"
                onClick={closeMobileMenu}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="nav-mobile-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: '15px 20px' }}
              >
                {t('component.header.logout') || 'Logout'}
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
