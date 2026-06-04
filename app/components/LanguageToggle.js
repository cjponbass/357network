'use client'

import { useLanguage } from '@/lib/useLanguage'

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="language-toggle">
      <button
        className={`lang-button ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
        aria-label="English"
      >
        EN
      </button>
      <span className="lang-separator">/</span>
      <button
        className={`lang-button ${language === 'es' ? 'active' : ''}`}
        onClick={() => setLanguage('es')}
        aria-label="Español"
      >
        ES
      </button>
    </div>
  )
}
