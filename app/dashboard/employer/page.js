'use client'

import ProtectedRoute from '@/app/components/ProtectedRoute'
import RoleGate from '@/app/components/RoleGate'
import { useAuth } from '@/lib/AuthContext'
import { useLanguage } from '@/lib/useLanguage'

/**
 * Employer Dashboard (app/dashboard/employer/page.js)
 *
 * Purpose: Display dashboard for employers
 * Protection: ProtectedRoute wrapper ensures only authenticated users can access
 * Role Check: RoleGate restricts access to employer role
 *
 * Placeholder Sections:
 * - Company Profile Summary (with company name placeholder)
 * - Posted Jobs (empty list)
 * - Job Applications (empty list)
 * - Billing & Subscriptions (placeholder)
 *
 * NOTE: All content is disabled placeholder - no real functionality in Phase 1
 */

function EmployerDashboardContent() {
  const { user, role } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="page-container">
      {/* Page Header */}
      <section className="page-header">
        <h1 className="page-title">{t('dashboard.employer.title')}</h1>
        <p className="page-subtitle">{t('dashboard.employer.subtitle')}</p>
        {user && (
          <p className="user-role">
            {t('component.dashboard.account_type')}: <strong>{role}</strong>
          </p>
        )}
      </section>

      {/* Company Profile Summary Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.employer.company_profile')}</h2>
        <div className="company-profile">
          <div className="profile-card">
            <h3>{t('dashboard.employer.company_info')}</h3>
            <p>
              {t('dashboard.employer.company_info_help')}
            </p>
            <div className="profile-fields">
              <div className="field">
                <label>{t('dashboard.employer.company_name')}</label>
                <input type="text" placeholder={t('dashboard.employer.company_name_placeholder')} disabled />
              </div>
              <div className="field">
                <label>{t('dashboard.employer.company_website')}</label>
                <input type="text" placeholder={t('dashboard.employer.company_website_placeholder')} disabled />
              </div>
              <div className="field">
                <label>{t('dashboard.employer.location')}</label>
                <input type="text" placeholder={t('dashboard.employer.location_placeholder')} disabled />
              </div>
              <div className="field">
                <label>{t('dashboard.employer.company_description')}</label>
                <textarea placeholder={t('dashboard.employer.company_description_placeholder')} disabled></textarea>
              </div>
              <div className="field">
                <label>{t('dashboard.employer.masonic_status')}</label>
                <select disabled>
                  <option>{t('dashboard.employer.masonic_select')}</option>
                  <option>{t('dashboard.employer.masonic_yes')}</option>
                  <option>{t('dashboard.employer.masonic_no')}</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" disabled>{t('dashboard.employer.button_update_company')}</button>
          </div>
        </div>
      </section>

      {/* Posted Jobs Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.employer.posted_jobs')}</h2>
        <div className="posted-jobs-header">
          <button className="btn btn-success" disabled>{t('dashboard.employer.button_post_new_job')}</button>
        </div>
        <div className="posted-jobs">
          <div className="empty-state">
            <h3>{t('dashboard.employer.no_posted_jobs')}</h3>
            <p>
              {t('dashboard.employer.posted_jobs_help')}
            </p>
            <button className="btn btn-secondary" disabled>{t('dashboard.employer.button_create_job')}</button>
          </div>
        </div>
      </section>

      {/* Job Applications Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.employer.job_applications')}</h2>
        <div className="job-applications">
          <div className="empty-state">
            <h3>{t('dashboard.employer.no_applications')}</h3>
            <p>
              {t('dashboard.employer.applications_help')}
            </p>
            <button className="btn btn-secondary" disabled>{t('dashboard.employer.button_view_applications')}</button>
          </div>
        </div>
      </section>

      {/* Billing & Subscriptions Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.employer.billing_subscriptions')}</h2>
        <div className="billing-section">
          <div className="billing-card">
            <h3>{t('dashboard.employer.subscription_status')}</h3>
            <div className="billing-info">
              <p className="placeholder-text">{t('dashboard.employer.billing_help1')}</p>
              <p className="placeholder-text">{t('dashboard.employer.billing_help2')}</p>
            </div>
            <button className="btn btn-primary" disabled>{t('dashboard.employer.button_manage_subscription')}</button>
            <button className="btn btn-secondary" disabled style={{ marginLeft: '10px' }}>
              {t('dashboard.employer.button_view_invoices')}
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .company-profile {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }

        .profile-card {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .profile-card h3 {
          color: #333;
          margin: 0 0 15px;
          font-size: 20px;
        }

        .profile-card > p {
          color: #666;
          margin: 0 0 20px;
          line-height: 1.6;
        }

        .profile-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
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
          min-height: 100px;
          grid-column: 1 / -1;
        }

        .field select {
          grid-column: 1 / -1;
        }

        .posted-jobs-header {
          margin-bottom: 20px;
        }

        .posted-jobs,
        .job-applications {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
          .profile-fields {
            grid-template-columns: 1fr;
          }

          .field textarea,
          .field select {
            grid-column: 1;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Wrapped component with protection and role gating
 */
function EmployerDashboardPage() {
  return (
    <RoleGate role="employer">
      <EmployerDashboardContent />
    </RoleGate>
  )
}

export default ProtectedRoute(EmployerDashboardPage)
