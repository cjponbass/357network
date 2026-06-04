'use client'

import { useState, useMemo } from 'react'
import { useLanguage } from '@/lib/useLanguage'
import JobCard from '@/app/components/JobCard'

// Demo jobs for Phase 1
const DEMO_JOBS = []

export default function FindJobsPage() {
  const { t } = useLanguage()

  // Initialize with demo jobs - no loading state
  const [jobs] = useState(DEMO_JOBS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [travelingManOnly, setTravelingManOnly] = useState(false)

  // Filter jobs using useMemo to avoid recalculating on every render
  const filteredJobs = useMemo(() => {
    let filtered = jobs

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (selectedCategory && selectedCategory !== '') {
      filtered = filtered.filter(job => job.category === selectedCategory)
    }

    if (selectedState && selectedState !== '') {
      filtered = filtered.filter(job => job.state === selectedState)
    }

    if (remoteOnly) {
      filtered = filtered.filter(job => job.remote === true)
    }

    if (travelingManOnly) {
      filtered = filtered.filter(job => job.traveling_man === true)
    }

    return filtered
  }, [jobs, searchTerm, selectedCategory, selectedState, remoteOnly, travelingManOnly])

  const handleSearch = (e) => {
    e.preventDefault()
    // Filters are applied automatically via useEffect
  }

  // Get unique states from jobs for filter dropdown
  const uniqueStates = Array.from(new Set(jobs.map(job => job.state))).sort()

  const categories = [
    { value: '', label: t('page.find_jobs.all_categories') },
    { value: 'skilled-trades', label: t('page.find_jobs.category_skilled_trades') },
    { value: 'construction', label: t('page.find_jobs.category_construction') },
    { value: 'technology', label: t('page.find_jobs.category_technology') },
    { value: 'sales', label: t('page.find_jobs.category_sales') },
    { value: 'healthcare', label: t('page.find_jobs.category_healthcare') }
  ]

  return (
    <div className="page-container">
      <section className="page-header">
        <h1 className="page-title">{t('page.find_jobs.title')}</h1>
        <p className="page-subtitle">{t('page.find_jobs.subtitle')}</p>
        <p className="page-description">{t('page.find_jobs.description')}</p>
      </section>

      <section className="filter-section">
        <h2 className="section-title">{t('page.find_jobs.search_title')}</h2>
        <form onSubmit={handleSearch}>
          <div className="filters-grid">
            <div className="filter-input">
              <label>{t('page.find_jobs.filter.keyword')}</label>
              <input
                type="text"
                placeholder={t('page.find_jobs.filter.keyword')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-input">
              <label>{t('page.find_jobs.filter.category')}</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-input">
              <label>{t('page.find_jobs.filter.state')}</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="">{t('page.find_jobs.all_states')}</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div className="filter-input checkbox">
              <input
                type="checkbox"
                id="remote"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
              />
              <label htmlFor="remote">{t('page.find_jobs.filter.remote')}</label>
            </div>
            <div className="filter-input checkbox">
              <input
                type="checkbox"
                id="traveling-man"
                checked={travelingManOnly}
                onChange={(e) => setTravelingManOnly(e.target.checked)}
              />
              <label htmlFor="traveling-man">{t('page.find_jobs.filter.traveling_man')}</label>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">{t('page.find_jobs.search_button')}</button>
        </form>
      </section>

      <section className="jobs-section">
        <h2 className="section-title">{t('page.find_jobs.available_jobs')}</h2>

        {filteredJobs.length > 0 ? (
          // Show filtered job cards
          <div className="jobs-grid">
            {filteredJobs.map(job => (
              <JobCard
                key={job.id}
                id={job.id}
                title={job.title}
                company={job.company_name}
                location={`${job.city}, ${job.state}`}
                description={job.description}
                isTravelingMan={job.traveling_man}
                badge={job.traveling_man ? t('page.traveling_man.badge_text') : null}
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          // No jobs in system - show placeholder cards for Phase 1
          <div className="jobs-grid">
            <JobCard
              title={t('page.find_jobs.job_title_placeholder')}
              company={t('page.find_jobs.company_name')}
              location={t('page.find_jobs.city_state')}
              description={t('page.find_jobs.job_description_placeholder')}
              isPlaceholder={true}
            />
            <JobCard
              title={t('page.find_jobs.job_title_placeholder')}
              company={t('page.find_jobs.company_name')}
              location={t('page.find_jobs.city_state')}
              description={t('page.find_jobs.job_description_placeholder')}
              isPlaceholder={true}
            />
            <JobCard
              title={t('page.find_jobs.job_title_placeholder')}
              company={t('page.find_jobs.company_name')}
              location={t('page.find_jobs.city_state')}
              description={t('page.find_jobs.job_description_placeholder')}
              isPlaceholder={true}
            />
          </div>
        ) : (
          // Jobs exist but filters eliminated all - show empty state
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h2>{t('page.find_jobs.no_jobs')}</h2>
            <p>{t('page.find_jobs.no_jobs_description')}</p>
          </div>
        )}
      </section>
    </div>
  )
}
