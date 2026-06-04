'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/useLanguage'

export default function Footer() {
  const { t } = useLanguage()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">357NETWORK</h3>
            <p className="footer-subtitle">Building Careers. Strengthening Brotherhood.</p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">{t('footer.quick_links') || 'Quick Links'}</h4>
            <ul className="footer-links">
              <li>
                <Link href="/">{t('nav.home') || 'Home'}</Link>
              </li>
              <li>
                <Link href="/find-jobs">{t('nav.find_jobs') || 'Find Jobs'}</Link>
              </li>
              <li>
                <Link href="/post-job">{t('nav.post_job') || 'Post a Job'}</Link>
              </li>
              <li>
                <Link href="/advertising">{t('nav.advertising') || 'Advertising'}</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">{t('footer.legal') || 'Legal'}</h4>
            <ul className="footer-links">
              <li>
                <Link href="/terms">{t('footer.terms') || 'Terms of Service'}</Link>
              </li>
              <li>
                <Link href="/privacy">{t('footer.privacy') || 'Privacy Policy'}</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} 357NETWORK. {t('footer.all_rights') || 'All rights reserved.'}
          </p>
          <p className="footer-tagline">
            {t('footer.tagline') || 'Building Careers. Strengthening Brotherhood.'}
          </p>
        </div>
      </div>
    </footer>
  )
}
