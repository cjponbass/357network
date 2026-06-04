'use client'

import { useLanguage } from '@/lib/useLanguage'

export default function PrivacyPage() {
  const { t } = useLanguage()

  return (
    <div className="page-container">
      <section className="page-header">
        <h1 className="page-title">{t('page.privacy.title')}</h1>
        <p className="page-subtitle">{t('page.privacy.subtitle')}</p>
      </section>

      <section className="legal-content">
        <div className="legal-section">
          <h2>{t('page.privacy.section1_title')}</h2>
          <p>{t('page.privacy.section1_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.privacy.section2_title')}</h2>
          <p>{t('page.privacy.section2_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.privacy.section3_title')}</h2>
          <p>{t('page.privacy.section3_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.privacy.section4_title')}</h2>
          <p>{t('page.privacy.section4_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.privacy.section5_title')}</h2>
          <p>{t('page.privacy.section5_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.privacy.section6_title')}</h2>
          <p>{t('page.privacy.section6_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.privacy.section7_title')}</h2>
          <p>{t('page.privacy.section7_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.privacy.section8_title')}</h2>
          <p>{t('page.privacy.section8_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.privacy.contact_title')}</h2>
          <p>{t('page.privacy.contact_content')}</p>
          <p>Email: privacy@357network.us</p>
        </div>
      </section>
    </div>
  )
}
