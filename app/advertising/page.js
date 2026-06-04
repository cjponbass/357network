'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/useLanguage'
import { useAuth } from '@/lib/AuthContext'
import { initiateCheckout, isStripeConfigured } from '@/lib/stripeCheckout'

export default function AdvertisingPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Handle payment initiation for advertising
  const handleAdvertisingPayment = async (productType, orderId) => {
    if (!user || !user.id) {
      setPaymentError('page.advertising.must_be_logged_in')
      setSelectedOrder(null)
      return
    }

    setIsProcessingPayment(true)
    setPaymentError(null)
    setSelectedOrder(orderId)

    const result = await initiateCheckout(productType, user.id, orderId)

    if (!result.success) {
      setPaymentError(result.error)
      setIsProcessingPayment(false)
      setSelectedOrder(null)
    }
    // If successful, initiateCheckout will redirect to Stripe Checkout
  }

  return (
    <div className="page-container">
      <section className="page-header">
        <h1 className="page-title">{t('page.advertising.title')}</h1>
        <p className="page-subtitle">{t('page.advertising.subtitle')}</p>
        <p className="page-description">{t('page.advertising.description')}</p>
      </section>

      <section className="advertising-options">
        <h2 className="section-title">{t('page.advertising.choose_option')}</h2>

        {paymentError && (
          <div className="error-message" style={{ color: '#d32f2f', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
            {t(paymentError) || paymentError}
          </div>
        )}

        {!isStripeConfigured() && (
          <div style={{ color: '#f57c00', padding: '1rem', backgroundColor: '#fff3e0', borderRadius: '4px', marginBottom: '1rem' }}>
            {t('page.post_job.stripe_not_configured')}
          </div>
        )}

        <div className="advertising-grid">
          {/* Standard Advertising Card */}
          <div className="advertising-card">
            <div className="card-header">
              <h3>{t('page.advertising.standard.title')}</h3>
              <p className="price">{t('page.advertising.price')}</p>
              <p className="duration">{t('page.advertising.standard.duration')}</p>
            </div>
            <ul className="features-list">
              <li>{t('page.advertising.standard.feature1')}</li>
              <li>{t('page.advertising.standard.feature2')}</li>
              <li>{t('page.advertising.standard.feature3')}</li>
              <li>{t('page.advertising.standard.feature4')}</li>
            </ul>
            <button
              className="btn btn-secondary"
              onClick={() => handleAdvertisingPayment('advertising', 'standard-ad-order')}
              disabled={isProcessingPayment || !isStripeConfigured() || !user}
            >
              {isProcessingPayment && selectedOrder === 'standard-ad-order' ? t('page.advertising.processing_button') : t('page.advertising.choose_button')}
            </button>
          </div>

          {/* Featured Advertising Card */}
          <div className="advertising-card featured">
            <div className="card-header">
              <span className="featured-badge">{t('page.advertising.featured_badge')}</span>
              <h3>{t('page.advertising.featured.title')}</h3>
              <p className="price">{t('page.advertising.price')}</p>
              <p className="duration">{t('page.advertising.featured.duration')}</p>
            </div>
            <ul className="features-list">
              <li>{t('page.advertising.featured.feature1')}</li>
              <li>{t('page.advertising.featured.feature2')}</li>
              <li>{t('page.advertising.featured.feature3')}</li>
              <li>{t('page.advertising.featured.feature4')}</li>
              <li>{t('page.advertising.featured.feature5')}</li>
            </ul>
            <button
              className="btn btn-primary"
              onClick={() => handleAdvertisingPayment('advertising', 'featured-ad-order')}
              disabled={isProcessingPayment || !isStripeConfigured() || !user}
            >
              {isProcessingPayment && selectedOrder === 'featured-ad-order' ? t('page.advertising.processing_button') : t('page.advertising.choose_button')}
            </button>
          </div>

          {/* Placement Advertising Card */}
          <div className="advertising-card">
            <div className="card-header">
              <h3>{t('page.advertising.placement.title')}</h3>
              <p className="price">{t('page.advertising.price')}</p>
              <p className="duration">{t('page.advertising.placement.duration')}</p>
            </div>
            <ul className="features-list">
              <li>{t('page.advertising.placement.feature1')}</li>
              <li>{t('page.advertising.placement.feature2')}</li>
              <li>{t('page.advertising.placement.feature3')}</li>
              <li>{t('page.advertising.placement.feature4')}</li>
            </ul>
            <button
              className="btn btn-secondary"
              onClick={() => handleAdvertisingPayment('advertising', 'placement-ad-order')}
              disabled={isProcessingPayment || !isStripeConfigured() || !user}
            >
              {isProcessingPayment && selectedOrder === 'placement-ad-order' ? t('page.advertising.processing_button') : t('page.advertising.choose_button')}
            </button>
          </div>
        </div>
      </section>

      <section className="info-section">
        <h2 className="section-title">{t('page.advertising.how_it_works')}</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <h3>{t('page.advertising.step1.title')}</h3>
            <p>{t('page.advertising.step1.description')}</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>{t('page.advertising.step2.title')}</h3>
            <p>{t('page.advertising.step2.description')}</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>{t('page.advertising.step3.title')}</h3>
            <p>{t('page.advertising.step3.description')}</p>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <h3>{t('page.advertising.step4.title')}</h3>
            <p>{t('page.advertising.step4.description')}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
