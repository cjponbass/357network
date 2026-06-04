'use client'

import { useLanguage } from '@/lib/useLanguage'

export default function TermsPage() {
  const { t } = useLanguage()

  return (
    <div className="page-container">
      <section className="page-header">
        <h1 className="page-title">{t('page.terms.title')}</h1>
        <p className="page-subtitle">{t('page.terms.subtitle')}</p>
      </section>

      <section className="legal-content">
        <div className="legal-section">
          <h2>{t('page.terms.section1_title')}</h2>
          <p>{t('page.terms.section1_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.terms.section2_title')}</h2>
          <p>{t('page.terms.section2_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.terms.section3_title')}</h2>
          <p>{t('page.terms.section3_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.terms.section4_title')}</h2>
          <p>{t('page.terms.section4_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.terms.section5_title')}</h2>
          <p>{t('page.terms.section5_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.terms.section6_title')}</h2>
          <p>{t('page.terms.section6_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.terms.section7_title')}</h2>
          <p>{t('page.terms.section7_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.terms.section8_title')}</h2>
          <p>{t('page.terms.section8_content')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('page.terms.contact_title')}</h2>
          <p>{t('page.terms.contact_content')}</p>
          <p>Email: support@357network.us</p>
        </div>
      </section>
    </div>
  )
}
