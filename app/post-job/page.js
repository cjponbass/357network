'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/useLanguage'
import { useAuth } from '@/lib/AuthContext'
import { submitJobPosting } from '@/lib/jobPostingService'
import { initiateCheckout, isStripeConfigured } from '@/lib/stripeCheckout'

export default function PostJobPage() {
  const { t } = useLanguage()
  const { user } = useAuth()

  // Check if user is authenticated and has employer/admin role
  const isAuthenticated = !!user && !!user.id
  const isEmployer = isAuthenticated && (user.role === 'employer' || user.role === 'admin')
  const isNonEmployer = isAuthenticated && !isEmployer

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    category: '',
    city: '',
    state: '',
    description: '',
    requirements: '',
    compensation_range: '',
    contact_email: '',
    remote: false,
    traveling_man: false,
    mason_friendly: false,
    mason_attestation: false
  })

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [jobId, setJobId] = useState(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState(null)

  // Handle input changes
  const handleInputChange = (e) => {
    const { id, type, value, checked } = e.target
    const fieldName = id
      .replace(/-/g, '_')

    setFormData(prev => ({
      ...prev,
      [fieldName]: type === 'checkbox' ? checked : value
    }))

    // Clear validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const updated = { ...prev }
        delete updated[fieldName]
        return updated
      })
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})
    setSuccessMessage(null)

    // Ensure user is authenticated
    if (!user || !user.id) {
      setError('page.post_job.must_be_logged_in')
      return
    }

    // Submit job posting
    setIsLoading(true)
    const result = await submitJobPosting(formData, user.id)

    if (result.success) {
      setSuccessMessage('page.post_job.job_posted_success')
      setJobId(result.jobId) // Store the job ID for payment
      // Clear form
      setFormData({
        title: '',
        company_name: '',
        category: '',
        city: '',
        state: '',
        description: '',
        requirements: '',
        compensation_range: '',
        contact_email: '',
        remote: false,
        traveling_man: false,
        mason_friendly: false,
        mason_attestation: false
      })
    } else {
      // Translate error keys if available, otherwise use raw error string
      if (result.errorKeys && Array.isArray(result.errorKeys)) {
        const translatedErrors = result.errorKeys.map(key => t(key)).join('; ')
        setError(translatedErrors)
      } else {
        setError(result.error)
      }
    }

    setIsLoading(false)
  }

  // Handle payment initiation
  const handlePayment = async (productType) => {
    if (!user || !user.id || !jobId) {
      setPaymentError('page.post_job.missing_user_or_job_id')
      return
    }

    setIsProcessingPayment(true)
    setPaymentError(null)

    const result = await initiateCheckout(productType, user.id, jobId)

    if (!result.success) {
      setPaymentError(result.error)
      setIsProcessingPayment(false)
    }
    // If successful, initiateCheckout will redirect to Stripe Checkout
  }

  // Render login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <section className="page-header">
          <h1 className="page-title">{t('page.post_job.title')}</h1>
          <p className="page-subtitle">{t('page.post_job.subtitle')}</p>
        </section>

        <section className="form-section" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2>{t('page.post_job.must_be_logged_in') || 'Please sign in as an employer to post a job.'}</h2>
            <p style={{ marginTop: '1rem', color: '#666' }}>
              {t('page.post_job.login_prompt_description') || 'To post job openings and connect with qualified candidates in the Masonic community, you need to create an employer account or sign in.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/signin" className="btn btn-primary">
              {t('page.post_job.sign_in_button') || 'Sign In'}
            </a>
            <a href="/register" className="btn btn-secondary">
              {t('page.post_job.create_account_button') || 'Create Employer Account'}
            </a>
          </div>
        </section>
      </div>
    )
  }

  // Render access denied if logged in but not employer
  if (isNonEmployer) {
    return (
      <div className="page-container">
        <section className="page-header">
          <h1 className="page-title">{t('page.post_job.title')}</h1>
          <p className="page-subtitle">{t('page.post_job.subtitle')}</p>
        </section>

        <section className="form-section" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#d32f2f' }}>
              {t('page.post_job.access_denied') || 'Access Denied'}
            </h2>
            <p style={{ marginTop: '1rem', color: '#666' }}>
              {t('page.post_job.employer_only') || 'This page is for employers only. Please sign in with an employer account or create a new employer account.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/dashboard" className="btn btn-secondary">
              {t('page.post_job.return_dashboard') || 'Return to Dashboard'}
            </a>
          </div>
        </section>
      </div>
    )
  }

  // User is authenticated and is employer/admin - show form
  return (
    <div className="page-container">
      <section className="page-header">
        <h1 className="page-title">{t('page.post_job.title')}</h1>
        <p className="page-subtitle">{t('page.post_job.subtitle')}</p>
        <p className="page-description">{t('page.post_job.description')}</p>
      </section>

      <section className="form-section">
        <h2 className="section-title">{t('page.post_job.form_title') || 'Job Posting Form'}</h2>

        {error && (
          <div className="error-message" style={{ color: '#d32f2f', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
            {t(error) || error}
          </div>
        )}

        {successMessage && (
          <div className="success-message" style={{ color: '#388e3c', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f1f8e9', borderRadius: '4px' }}>
            {t(successMessage) || successMessage}
          </div>
        )}

        <form className="job-form" onSubmit={handleSubmit}>
          {/* Job Title */}
          <div className="form-group">
            <label htmlFor="title">{t('page.post_job.job_title') || 'Job Title'}</label>
            <input
              id="title"
              type="text"
              placeholder={t('page.post_job.job_title') || 'Job Title'}
              value={formData.title}
              onChange={handleInputChange}
            />
            {validationErrors.title && (
              <span className="validation-error" style={{ color: '#d32f2f', fontSize: '0.875rem' }}>
                {validationErrors.title}
              </span>
            )}
          </div>

          {/* Company Name */}
          <div className="form-group">
            <label htmlFor="company_name">{t('page.post_job.company_name') || 'Company Name'}</label>
            <input
              id="company_name"
              type="text"
              placeholder={t('page.post_job.company_name') || 'Company Name'}
              value={formData.company_name}
              onChange={handleInputChange}
            />
            {validationErrors.company_name && (
              <span className="validation-error" style={{ color: '#d32f2f', fontSize: '0.875rem' }}>
                {validationErrors.company_name}
              </span>
            )}
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">{t('page.post_job.category') || 'Category'}</label>
            <select id="category" value={formData.category} onChange={handleInputChange}>
              <option value="">{t('page.post_job.select_category')}</option>
              <option value="Skilled Trades">{t('page.find_jobs.category_skilled_trades')}</option>
              <option value="Construction">{t('page.find_jobs.category_construction')}</option>
              <option value="Technology">{t('page.find_jobs.category_technology')}</option>
              <option value="Sales">{t('page.find_jobs.category_sales')}</option>
              <option value="Healthcare">{t('page.find_jobs.category_healthcare')}</option>
            </select>
            {validationErrors.category && (
              <span className="validation-error" style={{ color: '#d32f2f', fontSize: '0.875rem' }}>
                {validationErrors.category}
              </span>
            )}
          </div>

          {/* Location (City and State) */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">{t('page.post_job.location') || 'Location'}</label>
              <input
                id="city"
                type="text"
                placeholder={t('page.post_job.city_placeholder') || 'City'}
                value={formData.city}
                onChange={handleInputChange}
              />
              {validationErrors.city && (
                <span className="validation-error" style={{ color: '#d32f2f', fontSize: '0.875rem' }}>
                  {validationErrors.city}
                </span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="state">{t('page.find_jobs.filter.state')}</label>
              <input
                id="state"
                type="text"
                placeholder={t('page.post_job.state_placeholder')}
                value={formData.state}
                onChange={handleInputChange}
                maxLength="2"
              />
              {validationErrors.state && (
                <span className="validation-error" style={{ color: '#d32f2f', fontSize: '0.875rem' }}>
                  {validationErrors.state}
                </span>
              )}
            </div>
          </div>

          {/* Compensation Range */}
          <div className="form-group">
            <label htmlFor="compensation_range">{t('page.post_job.salary') || 'Compensation Range'}</label>
            <input
              id="compensation_range"
              type="text"
              placeholder={t('page.post_job.salary_placeholder')}
              value={formData.compensation_range}
              onChange={handleInputChange}
            />
            {validationErrors.compensation_range && (
              <span className="validation-error" style={{ color: '#d32f2f', fontSize: '0.875rem' }}>
                {validationErrors.compensation_range}
              </span>
            )}
          </div>

          {/* Job Description */}
          <div className="form-group">
            <label htmlFor="description">{t('page.post_job.job_description') || 'Job Description'}</label>
            <textarea
              id="description"
              placeholder={t('page.post_job.job_description') || 'Job Description'}
              rows="6"
              value={formData.description}
              onChange={handleInputChange}
            ></textarea>
            {validationErrors.description && (
              <span className="validation-error" style={{ color: '#d32f2f', fontSize: '0.875rem' }}>
                {validationErrors.description}
              </span>
            )}
          </div>

          {/* Requirements */}
          <div className="form-group">
            <label htmlFor="requirements">{t('page.post_job.requirements') || 'Requirements'}</label>
            <textarea
              id="requirements"
              placeholder={t('page.post_job.requirements_placeholder')}
              rows="4"
              value={formData.requirements}
              onChange={handleInputChange}
            ></textarea>
          </div>

          {/* Contact Email */}
          <div className="form-group">
            <label htmlFor="contact_email">{t('page.post_job.contact_email') || 'Contact Email'}</label>
            <input
              id="contact_email"
              type="email"
              placeholder={t('page.post_job.email_placeholder')}
              value={formData.contact_email}
              onChange={handleInputChange}
            />
            {validationErrors.contact_email && (
              <span className="validation-error" style={{ color: '#d32f2f', fontSize: '0.875rem' }}>
                {validationErrors.contact_email}
              </span>
            )}
          </div>

          {/* Remote Checkbox */}
          <div className="form-group checkbox">
            <input
              id="remote"
              type="checkbox"
              checked={formData.remote}
              onChange={handleInputChange}
            />
            <label htmlFor="remote">{t('page.post_job.remote_position')}</label>
          </div>

          {/* Traveling Man Checkbox */}
          <div className="form-group checkbox">
            <input
              id="traveling_man"
              type="checkbox"
              checked={formData.traveling_man}
              onChange={handleInputChange}
            />
            <label htmlFor="traveling_man">{t('page.post_job.traveling_man_eligible')}</label>
          </div>

          {/* Mason Friendly Checkbox */}
          <div className="form-group checkbox">
            <input
              id="mason_friendly"
              type="checkbox"
              checked={formData.mason_friendly}
              onChange={handleInputChange}
            />
            <label htmlFor="mason_friendly">{t('page.post_job.form.masonic_friendly') || 'Mason-Friendly Employer'}</label>
          </div>

          {/* Mason Attestation Checkbox (Required) */}
          <div className="form-group checkbox">
            <input
              id="mason_attestation"
              type="checkbox"
              checked={formData.mason_attestation}
              onChange={handleInputChange}
            />
            <label htmlFor="mason_attestation">
              {t('page.post_job.form.self_attested') || 'I attest that I am a Mason in Good Standing'}
            </label>
            {validationErrors.mason_attestation && (
              <span className="validation-error" style={{ color: '#d32f2f', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                {validationErrors.mason_attestation}
              </span>
            )}
          </div>

          <div className="attestation-notice" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107', borderRadius: '4px' }}>
            <strong>{t('page.post_job.attestation_required')}</strong>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ marginTop: '1.5rem' }}
          >
            {isLoading ? t('page.post_job.posting_button') : t('page.post_job.submit_button')}
          </button>
        </form>
      </section>

      {/* Payment Options Section */}
      {jobId && (
        <section className="payment-options-section" style={{ marginTop: '2rem' }}>
          <h2 className="section-title">{t('page.post_job.payment_section_title')}</h2>

          {paymentError && (
            <div className="error-message" style={{ color: '#d32f2f', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
              {t(paymentError) || paymentError}
            </div>
          )}

          {!isStripeConfigured() ? (
            <div style={{ color: '#f57c00', padding: '1rem', backgroundColor: '#fff3e0', borderRadius: '4px', marginBottom: '1rem' }}>
              {t('page.post_job.stripe_not_configured')}
            </div>
          ) : null}

          <div className="payment-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Standard Job Listing */}
            <div className="payment-card" style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0 }}>{t('page.post_job.payment_card_standard')}</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2', margin: '0.5rem 0' }}>{t('page.post_job.payment_price_standard')}</p>
              <p style={{ color: '#666', marginBottom: '1rem' }}>{t('page.post_job.payment_duration')}</p>
              <button
                className="btn btn-primary"
                onClick={() => handlePayment('job-listing')}
                disabled={isProcessingPayment || !isStripeConfigured() || !user}
                style={{ width: '100%' }}
              >
                {isProcessingPayment ? t('page.post_job.payment_processing') : t('page.post_job.payment_button')}
              </button>
            </div>

            {/* Featured Job Listing */}
            <div className="payment-card" style={{ border: '2px solid #1976d2', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 8px rgba(25, 118, 210, 0.2)', backgroundColor: '#f5f9ff' }}>
              <span style={{ display: 'inline-block', backgroundColor: '#1976d2', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t('page.post_job.featured_badge')}</span>
              <h3 style={{ marginTop: '0.5rem' }}>{t('page.post_job.payment_card_featured')}</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2', margin: '0.5rem 0' }}>{t('page.post_job.payment_price_featured')}</p>
              <p style={{ color: '#666', marginBottom: '1rem' }}>{t('page.post_job.payment_duration')}</p>
              <button
                className="btn btn-primary"
                onClick={() => handlePayment('featured-job')}
                disabled={isProcessingPayment || !isStripeConfigured() || !user}
                style={{ width: '100%' }}
              >
                {isProcessingPayment ? t('page.post_job.payment_processing') : t('page.post_job.payment_button')}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="info-section">
        <h2 className="section-title">{t('page.post_job.section_pricing')}</h2>
        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>{t('page.post_job.pricing_standard')}</h3>
            <p className="price">{t('page.post_job.duration')}</p>
            <p className="description">{t('page.post_job.pricing_standard_desc')}</p>
          </div>
          <div className="pricing-card">
            <h3>{t('page.post_job.pricing_featured')}</h3>
            <p className="price">{t('page.post_job.duration')}</p>
            <p className="description">{t('page.post_job.pricing_featured_desc')}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
