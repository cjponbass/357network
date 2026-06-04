'use client'

import { useLanguage } from '@/lib/useLanguage'

export default function Home() {
  const { t } = useLanguage()

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container">
          <div className="hero-layout">
            <div className="hero-left">
              <h2>{t('page.home.welcome_title')}</h2>
              <p className="tagline-secondary">{t('page.home.tagline_secondary')}</p>
              <p className="lead">{t('page.home.welcome_description')}</p>

              <div className="hero-buttons">
                <button className="btn btn-primary">{t('page.home.button_find_jobs')}</button>
                <button className="btn btn-secondary">{t('page.home.button_post_job')}</button>
              </div>
            </div>

            <div className="hero-right">
              <img src="/masonic-emblem.svg" alt="357 Network Masonic Emblem" className="hero-emblem" />
            </div>
          </div>
        </div>
      </section>

      <div className="checkerboard-divider"></div>

      <section className="info">
        <div className="container">
          <div className="info-grid">
            <div className="info-card">
              <span className="card-badge">01</span>
              <h3>{t('page.home.card_job_seekers_title')}</h3>
              <p>{t('page.home.card_job_seekers_description')}</p>
            </div>
            <div className="info-card">
              <span className="card-badge">02</span>
              <h3>{t('page.home.card_employers_title')}</h3>
              <p>{t('page.home.card_employers_description')}</p>
            </div>
            <div className="info-card">
              <span className="card-badge">03</span>
              <h3>{t('page.home.card_traveling_title')}</h3>
              <p>{t('page.home.card_traveling_description')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
