'use client'

import ProtectedRoute from '@/app/components/ProtectedRoute'
import RoleGate from '@/app/components/RoleGate'
import { useAuth } from '@/lib/AuthContext'
import { useLanguage } from '@/lib/useLanguage'

/**
 * Job Seeker Dashboard (app/dashboard/job-seeker/page.js)
 *
 * Purpose: Display dashboard for job seekers
 * Protection: ProtectedRoute wrapper ensures only authenticated users can access
 * Role Check: RoleGate restricts access to job_seeker role
 *
 * Placeholder Sections:
 * - Profile Summary (with welcome message)
 * - Saved Jobs (empty list)
 * - Applications History (empty list)
 * - Job Recommendations (empty list)
 *
 * NOTE: All content is disabled placeholder - no real functionality in Phase 1
 */

function JobSeekerDashboardContent() {
  const { user, role } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="page-container">
      {/* Page Header */}
      <section className="page-header">
        <h1 className="page-title">{t('dashboard.job_seeker.title')}</h1>
        <p className="page-subtitle">{t('dashboard.job_seeker.subtitle')}</p>
        {user && (
          <p className="user-role">
            {t('component.dashboard.account_type')}: <strong>{role}</strong>
          </p>
        )}
      </section>

      {/* Profile Summary Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.job_seeker.profile_summary')}</h2>
        <div className="profile-summary">
          <div className="summary-card">
            <h3>{t('dashboard.job_seeker.welcome_message')}</h3>
            <p>
              {t('dashboard.job_seeker.profile_help')}
            </p>
            <div className="profile-fields">
              <div className="field">
                <label>{t('dashboard.job_seeker.full_name')}</label>
                <input type="text" placeholder={t('dashboard.job_seeker.full_name_placeholder')} disabled />
              </div>
              <div className="field">
                <label>{t('dashboard.job_seeker.professional_title')}</label>
                <input type="text" placeholder={t('dashboard.job_seeker.professional_title_placeholder')} disabled />
              </div>
              <div className="field">
                <label>{t('dashboard.job_seeker.location')}</label>
                <input type="text" placeholder={t('dashboard.job_seeker.location_placeholder')} disabled />
              </div>
              <div className="field">
                <label>{t('dashboard.job_seeker.bio')}</label>
                <textarea placeholder={t('dashboard.job_seeker.bio_placeholder')} disabled></textarea>
              </div>
            </div>
            <button className="btn btn-primary" disabled>{t('dashboard.job_seeker.button_update_profile')}</button>
          </div>
        </div>
      </section>

      {/* Saved Jobs Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.job_seeker.saved_jobs')}</h2>
        <div className="saved-jobs">
          <div className="empty-state">
            <h3>{t('dashboard.job_seeker.no_saved_jobs')}</h3>
            <p>
              {t('dashboard.job_seeker.saved_jobs_help')}
            </p>
            <button className="btn btn-secondary" disabled>{t('dashboard.job_seeker.button_browse_jobs')}</button>
          </div>
        </div>
      </section>

      {/* Applications History Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.job_seeker.applications_history')}</h2>
        <div className="applications-history">
          <div className="empty-state">
            <h3>{t('dashboard.job_seeker.no_applications')}</h3>
            <p>
              {t('dashboard.job_seeker.applications_help')}
            </p>
            <button className="btn btn-secondary" disabled>{t('dashboard.job_seeker.button_view_jobs')}</button>
          </div>
        </div>
      </section>

      {/* Job Recommendations Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.job_seeker.recommended_jobs')}</h2>
        <div className="recommendations">
          <div className="empty-state">
            <h3>{t('dashboard.job_seeker.no_recommendations')}</h3>
            <p>
              {t('dashboard.job_seeker.recommendations_help')}
            </p>
            <button className="btn btn-secondary" disabled>{t('dashboard.job_seeker.button_complete_profile')}</button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .profile-summary {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }

        .summary-card {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .summary-card h3 {
          color: #333;
          margin: 0 0 15px;
          font-size: 20px;
        }

        .summary-card > p {
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

        .saved-jobs,
        .applications-history,
        .recommendations {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

          .field textarea {
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
function JobSeekerDashboardPage() {
  return (
    <RoleGate role="job_seeker">
      <JobSeekerDashboardContent />
    </RoleGate>
  )
}

export default ProtectedRoute(JobSeekerDashboardPage)
