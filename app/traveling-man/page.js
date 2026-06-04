'use client'

import { useLanguage } from '@/lib/useLanguage'

export default function TravelingManPage() {
  const { t } = useLanguage()

  return (
    <div className="page-container">
      <section className="page-header">
        <h1 className="page-title">{t('page.traveling_man.title')}</h1>
        <p className="page-subtitle">{t('page.traveling_man.subtitle')}</p>
        <p className="page-description">{t('page.traveling_man.description')}</p>
      </section>

      <section className="info-section">
        <h2 className="section-title">{t('page.traveling_man.section_about_title')}</h2>
        <p>{t('page.traveling_man.section_about_description')}</p>
      </section>

      <section className="jobs-section">
        <h2 className="section-title">{t('page.traveling_man.opportunities_title')}</h2>
        <div className="jobs-grid">
          <div className="job-card traveling-man">
            <div className="traveling-badge">{t('page.traveling_man.badge_text')}</div>
            <h3>{t('page.traveling_man.project_title')}</h3>
            <p className="company">{t('page.find_jobs.company_name')}</p>
            <div className="job-details">
              <span className="detail">{t('page.traveling_man.location')}: City, State</span>
              <span className="detail">{t('page.traveling_man.type')}: {t('page.traveling_man.duration_3_6')}</span>
            </div>
            <p className="description">{t('page.traveling_man.relocation_support')}</p>
            <button className="btn btn-secondary" disabled>{t('page.traveling_man.view_details')}</button>
          </div>

          <div className="job-card traveling-man">
            <div className="traveling-badge">{t('page.traveling_man.badge_text')}</div>
            <h3>{t('page.traveling_man.consulting_title')}</h3>
            <p className="company">{t('page.find_jobs.company_name')}</p>
            <div className="job-details">
              <span className="detail">{t('page.traveling_man.location')}: {t('page.traveling_man.multiple_states')}</span>
              <span className="detail">{t('page.traveling_man.type')}: {t('page.traveling_man.duration_flexible')}</span>
            </div>
            <p className="description">{t('page.traveling_man.consulting_description')}</p>
            <button className="btn btn-secondary" disabled>{t('page.traveling_man.view_details')}</button>
          </div>

          <div className="job-card traveling-man">
            <div className="traveling-badge">{t('page.traveling_man.badge_text')}</div>
            <h3>{t('page.traveling_man.seasonal_title')}</h3>
            <p className="company">{t('page.find_jobs.company_name')}</p>
            <div className="job-details">
              <span className="detail">{t('page.traveling_man.location')}: {t('page.traveling_man.seasonal_rotation')}</span>
              <span className="detail">{t('page.traveling_man.type')}: {t('page.traveling_man.duration_seasonal')}</span>
            </div>
            <p className="description">{t('page.traveling_man.seasonal_description')}</p>
            <button className="btn btn-secondary" disabled>{t('page.traveling_man.view_details')}</button>
          </div>
        </div>
      </section>
    </div>
  )
}
