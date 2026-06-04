'use client'

import { useLanguage } from '@/lib/useLanguage'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { signup } = useAuth()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  // UI state
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [registrationMethod, setRegistrationMethod] = useState(null) // 'auth' or 'pending'

  const validateForm = () => {
    setError('')

    // Check all fields are filled
    if (!email || !password || !confirmPassword || !firstName || !lastName || !selectedRole || !agreeTerms) {
      setError(t('page.register.error_all_fields_required') || 'All fields are required')
      return false
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(t('page.register.error_invalid_email') || 'Please enter a valid email address')
      return false
    }

    // Validate password length
    if (password.length < 8) {
      setError(t('page.register.error_password_length') || 'Password must be at least 8 characters')
      return false
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError(t('page.register.error_password_mismatch') || 'Passwords do not match')
      return false
    }

    // Validate role selected
    if (!['job_seeker', 'employer', 'advertiser'].includes(selectedRole)) {
      setError(t('page.register.error_role_required') || 'Please select an account type')
      return false
    }

    // Validate terms agreed
    if (!agreeTerms) {
      setError(t('page.register.error_terms_required') || 'You must agree to the terms and conditions')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError('')
    setSuccessMessage('')
    setRegistrationMethod(null)

    try {
      // Try primary auth signup path
      const result = await signup(email, password, firstName, lastName, selectedRole)

      if (result.error) {
        // Auth signup failed (likely due to rate limit) - fall back to pending registration
        console.log('Auth signup blocked, attempting fallback registration:', result.error)

        const fallbackResult = await savePendingRegistration(email, firstName, lastName, selectedRole)

        if (fallbackResult.success) {
          setSuccessMessage('page.register.pending_intake_success')
          setRegistrationMethod('pending')
          // Reset form
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setFirstName('')
          setLastName('')
          setSelectedRole('')
          setAgreeTerms(false)
          setIsLoading(false)
          return
        } else {
          setError(fallbackResult.error || 'Registration failed. Please try again.')
          setIsLoading(false)
          return
        }
      }

      // Auth signup succeeded
      setRegistrationMethod('auth')
      setIsLoading(false)
      router.push('/dashboard')
    } catch (err) {
      // Catch-all error handler - also try fallback
      console.log('Signup error, attempting fallback:', err.message)

      const fallbackResult = await savePendingRegistration(email, firstName, lastName, selectedRole)

      if (fallbackResult.success) {
        setSuccessMessage('page.register.pending_intake_success')
        setRegistrationMethod('pending')
        // Reset form
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setFirstName('')
        setLastName('')
        setSelectedRole('')
        setAgreeTerms(false)
      } else {
        setError(fallbackResult.error || err.message || t('page.register.error_signup_failed') || 'Sign up failed. Please try again.')
      }
      setIsLoading(false)
    }
  }

  const savePendingRegistration = async (email, firstName, lastName, role) => {
    try {
      const { error } = await supabase
        .from('pending_registrations')
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          status: 'pending'
        })

      if (error) {
        // Check if it's a duplicate email error
        if (error.message && error.message.includes('duplicate') || error.message.includes('unique')) {
          return { success: false, error: 'An account with this email already exists' }
        }
        return { success: false, error: error.message || 'Failed to save registration request' }
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  return (
    <div className="page-container">
      <section className="page-header">
        <h1 className="page-title">{t('page.register.title')}</h1>
        <p className="page-subtitle">{t('page.register.subtitle')}</p>
      </section>

      <section className="form-section auth-form">
        <h2 className="section-title">{t('page.register.form_title') || 'Account Information'}</h2>

        {successMessage && (
          <div style={{ color: '#388e3c', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f1f8e9', borderRadius: '4px', borderLeft: '4px solid #4caf50' }}>
            <strong>{t(successMessage) || successMessage}</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#2e7d32', fontSize: '0.9rem' }}>
              {registrationMethod === 'pending' ? 'We will review your application and contact you shortly.' : 'You can now access your dashboard.'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="form-error">
              {t(error) || error}
            </div>
          )}

          <div className="form-group">
            <label>{t('page.register.account_type') || 'I am a:'}</label>
            <div className="role-selection">
              <div className="role-option">
                <input
                  type="radio"
                  id="job_seeker"
                  name="role"
                  value="job_seeker"
                  checked={selectedRole === 'job_seeker'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isLoading}
                />
                <label htmlFor="job_seeker">
                  <strong>{t('page.register.job_seeker')}</strong>
                  <p>{t('page.register.job_seeker_description')}</p>
                </label>
              </div>

              <div className="role-option">
                <input
                  type="radio"
                  id="employer"
                  name="role"
                  value="employer"
                  checked={selectedRole === 'employer'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isLoading}
                />
                <label htmlFor="employer">
                  <strong>{t('page.register.employer')}</strong>
                  <p>{t('page.register.employer_description')}</p>
                </label>
              </div>

              <div className="role-option">
                <input
                  type="radio"
                  id="advertiser"
                  name="role"
                  value="advertiser"
                  checked={selectedRole === 'advertiser'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isLoading}
                />
                <label htmlFor="advertiser">
                  <strong>{t('page.register.advertiser')}</strong>
                  <p>{t('page.register.advertiser_description')}</p>
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="first-name">{t('page.register.first_name') || 'First Name'}</label>
            <input
              id="first-name"
              type="text"
              placeholder={t('page.register.first_name') || 'First Name'}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="last-name">{t('page.register.last_name') || 'Last Name'}</label>
            <input
              id="last-name"
              type="text"
              placeholder={t('page.register.last_name') || 'Last Name'}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('page.register.email') || 'Email Address'}</label>
            <input
              id="email"
              type="email"
              placeholder={t('page.register.email_placeholder') || 'your@email.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('page.register.password') || 'Password'}</label>
            <input
              id="password"
              type="password"
              placeholder={t('page.register.password_placeholder') || 'At least 8 characters'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">{t('page.register.confirm_password') || 'Confirm Password'}</label>
            <input
              id="confirm-password"
              type="password"
              placeholder={t('page.register.confirm_password_placeholder') || 'Re-enter your password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group checkbox">
            <input
              id="terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="terms">
              {t('page.register.agree_terms')} <a href="/terms">{t('page.register.terms_link')}</a>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? t('page.register.submitting') || 'Submitting...' : t('page.register.submit_button')}
          </button>
        </form>

        <div className="auth-links">
          <p>{t('page.register.have_account')} <a href="/signin">{t('page.register.signin_link')}</a></p>
        </div>
      </section>
    </div>
  )
}
