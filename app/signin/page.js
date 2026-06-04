'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/useLanguage'
import { useAuth } from '@/lib/AuthContext'

export default function SignInPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { login, error: authError } = useAuth()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!email || !password) {
      setError(t('page.signin.error_required_fields'))
      return
    }

    try {
      setIsLoading(true)
      await login(email, password)
      // Redirect to dashboard on successful login
      router.push('/dashboard')
    } catch (err) {
      setError(err.message || t('page.signin.error_login_failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container">
      <section className="page-header">
        <h1 className="page-title">{t('page.signin.title')}</h1>
        <p className="page-subtitle">{t('page.signin.subtitle')}</p>
      </section>

      <section className="form-section auth-form">
        <h2 className="section-title">{t('page.signin.form_title') || 'Enter Your Credentials'}</h2>

        {(error || authError) && (
          <div className="alert alert-error">
            {error ? t(error) : authError ? t(authError) : ''}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t('page.signin.email') || 'Email Address'}</label>
            <input
              id="email"
              type="email"
              placeholder={t('page.signin.email_placeholder') || 'your@email.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('page.signin.password') || 'Password'}</label>
            <input
              id="password"
              type="password"
              placeholder={t('page.signin.password_placeholder') || 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group checkbox">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="remember">{t('page.signin.remember_me')}</label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? `${t('page.signin.submit_button')}...` : t('page.signin.submit_button')}
          </button>
        </form>

        <div className="auth-links">
          <p>{t('page.signin.forgot_password')} <a href="/reset-password">{t('page.signin.reset_link')}</a></p>
          <p>{t('page.signin.no_account')} <a href="/register">{t('page.signin.signup_link')}</a></p>
        </div>
      </section>

      <section className="info-section">
        <h2 className="section-title">{t('page.signin.benefits_title') || 'Benefits of 357NETWORK'}</h2>
        <div className="benefits-list">
          <div className="benefit-item">
            <h3>{t('page.signin.benefit1_title')}</h3>
            <p>{t('page.signin.benefit1_description')}</p>
          </div>
          <div className="benefit-item">
            <h3>{t('page.signin.benefit2_title')}</h3>
            <p>{t('page.signin.benefit2_description')}</p>
          </div>
          <div className="benefit-item">
            <h3>{t('page.signin.benefit3_title')}</h3>
            <p>{t('page.signin.benefit3_description')}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
