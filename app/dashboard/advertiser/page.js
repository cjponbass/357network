'use client'

import ProtectedRoute from '@/app/components/ProtectedRoute'
import RoleGate from '@/app/components/RoleGate'
import { useAuth } from '@/lib/AuthContext'
import { useLanguage } from '@/lib/useLanguage'

/**
 * Advertiser Dashboard (app/dashboard/advertiser/page.js)
 *
 * Purpose: Display dashboard for advertisers
 * Protection: ProtectedRoute wrapper ensures only authenticated users can access
 * Role Check: RoleGate restricts access to advertiser role
 *
 * Placeholder Sections:
 * - Active Advertisements (empty list)
 * - Campaign Performance (placeholder)
 * - Billing & Subscriptions (placeholder)
 * - Ad Settings (placeholder)
 *
 * NOTE: All content is disabled placeholder - no real functionality in Phase 1
 */

function AdvertiserDashboardContent() {
  const { user, role } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="page-container">
      {/* Page Header */}
      <section className="page-header">
        <h1 className="page-title">{t('dashboard.advertiser.title')}</h1>
        <p className="page-subtitle">{t('dashboard.advertiser.subtitle')}</p>
        {user && (
          <p className="user-role">
            {t('component.dashboard.account_type')}: <strong>{role}</strong>
          </p>
        )}
      </section>

      {/* Active Advertisements Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.advertiser.active_ads')}</h2>
        <div className="ads-header">
          <button className="btn btn-success" disabled>{t('dashboard.advertiser.button_create_ad')}</button>
        </div>
        <div className="active-ads">
          <div className="empty-state">
            <h3>{t('dashboard.advertiser.no_active_ads')}</h3>
            <p>
              {t('dashboard.advertiser.ads_help')}
            </p>
            <button className="btn btn-secondary" disabled>{t('dashboard.advertiser.button_create_ad')}</button>
          </div>
        </div>
      </section>

      {/* Campaign Performance Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.advertiser.campaign_performance')}</h2>
        <div className="campaign-performance">
          <div className="performance-placeholder">
            <h3>{t('dashboard.advertiser.performance_metrics')}</h3>
            <p>{t('dashboard.advertiser.metrics_help')}</p>
            <div className="metrics-grid">
              <div className="metric-card">
                <p className="metric-label">{t('dashboard.advertiser.total_impressions')}</p>
                <p className="metric-value">—</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">{t('dashboard.advertiser.total_clicks')}</p>
                <p className="metric-value">—</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">{t('dashboard.advertiser.click_through_rate')}</p>
                <p className="metric-value">—</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">{t('dashboard.advertiser.conversion_rate')}</p>
                <p className="metric-value">—</p>
              </div>
            </div>
            <button className="btn btn-primary" disabled>{t('dashboard.advertiser.button_detailed_analytics')}</button>
          </div>
        </div>
      </section>

      {/* Billing & Subscriptions Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.advertiser.billing_subscriptions')}</h2>
        <div className="billing-section">
          <div className="billing-card">
            <h3>{t('dashboard.advertiser.advertising_account')}</h3>
            <div className="billing-info">
              <p className="placeholder-text">
                {t('dashboard.advertiser.billing_help1')}
              </p>
              <p className="placeholder-text">
                {t('dashboard.advertiser.billing_help2')}
              </p>
            </div>
            <button className="btn btn-primary" disabled>{t('dashboard.advertiser.button_manage_billing')}</button>
            <button className="btn btn-secondary" disabled style={{ marginLeft: '10px' }}>
              {t('dashboard.advertiser.button_view_invoices')}
            </button>
          </div>
        </div>
      </section>

      {/* Ad Settings Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.advertiser.ad_settings')}</h2>
        <div className="ad-settings">
          <div className="settings-card">
            <h3>{t('dashboard.advertiser.ad_preferences')}</h3>
            <div className="settings-form">
              <div className="field">
                <label>{t('dashboard.advertiser.business_name')}</label>
                <input type="text" placeholder={t('dashboard.advertiser.business_name_placeholder')} disabled />
              </div>
              <div className="field">
                <label>{t('dashboard.advertiser.business_website')}</label>
                <input type="text" placeholder={t('dashboard.advertiser.business_website_placeholder')} disabled />
              </div>
              <div className="field">
                <label>{t('dashboard.advertiser.ad_category')}</label>
                <select disabled>
                  <option>{t('dashboard.advertiser.category_select')}</option>
                  <option>{t('dashboard.advertiser.category_products')}</option>
                  <option>{t('dashboard.advertiser.category_professional')}</option>
                  <option>{t('dashboard.advertiser.category_events')}</option>
                  <option>{t('dashboard.advertiser.category_other')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('dashboard.advertiser.business_description')}</label>
                <textarea placeholder={t('dashboard.advertiser.business_description_placeholder')} disabled></textarea>
              </div>
              <div className="field checkbox">
                <input type="checkbox" id="masonic" disabled />
                <label htmlFor="masonic">{t('dashboard.advertiser.masonic_friendly')}</label>
              </div>
            </div>
            <button className="btn btn-primary" disabled>{t('dashboard.advertiser.button_save_settings')}</button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .ads-header {
          margin-bottom: 20px;
        }

        .active-ads {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .campaign-performance {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .performance-placeholder h3 {
          color: #333;
          margin: 0 0 15px;
          font-size: 20px;
        }

        .performance-placeholder > p {
          color: #666;
          margin: 0 0 20px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .metric-card {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 4px;
          text-align: center;
          border: 1px solid #e0e0e0;
        }

        .metric-label {
          color: #666;
          font-size: 14px;
          margin: 0 0 10px;
          font-weight: 500;
        }

        .metric-value {
          color: #333;
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }

        .billing-section {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .billing-card h3 {
          color: #333;
          margin: 0 0 20px;
          font-size: 20px;
        }

        .billing-info {
          margin-bottom: 20px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 4px;
          border-left: 4px solid #667eea;
        }

        .placeholder-text {
          color: #999;
          margin: 10px 0;
          font-size: 14px;
        }

        .placeholder-text:first-child {
          margin-top: 0;
        }

        .ad-settings {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .settings-card h3 {
          color: #333;
          margin: 0 0 20px;
          font-size: 20px;
        }

        .settings-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        .field label {
          color: #333;
          font-weight: 500;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .field input,
        .field select,
        .field textarea {
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 14px;
          background-color: #f9f9f9;
          color: #999;
        }

        .field textarea {
          resize: vertical;
          min-height: 80px;
          grid-column: 1 / -1;
        }

        .field select {
          grid-column: 1 / -1;
        }

        .field.checkbox {
          flex-direction: row;
          align-items: center;
          margin-top: 10px;
          grid-column: 1 / -1;
        }

        .field.checkbox input {
          width: 18px;
          height: 18px;
          margin: 0 10px 0 0;
        }

        .field.checkbox label {
          margin-bottom: 0;
          cursor: pointer;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-state h3 {
          color: #333;
          margin: 0 0 10px;
          font-size: 18px;
        }

        .empty-state p {
          color: #666;
          margin: 0 0 20px;
          line-height: 1.6;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (max-width: 768px) {
          .settings-form {
            grid-template-columns: 1fr;
          }

          .field textarea,
          .field select {
            grid-column: 1;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Wrapped component with protection and role gating
 */
function AdvertiserDashboardPage() {
  return (
    <RoleGate role="advertiser">
      <AdvertiserDashboardContent />
    </RoleGate>
  )
}

export default ProtectedRoute(AdvertiserDashboardPage)
