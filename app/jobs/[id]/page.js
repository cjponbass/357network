'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/useLanguage'

export default function JobDetailPage({ params }) {
  const { id } = params
  const { t } = useLanguage()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true)
        setError(null)
        // TODO: Replace with actual Supabase query when integrated
        // const { data, error: queryError } = await supabase
        //   .from('jobs')
        //   .select('*')
        //   .eq('id', id)
        //   .eq('approved', true)
        //   .single()

        setJob(null)
        setError('Job loading not yet implemented. This will be connected to Supabase in Phase 1.')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadJob()
    }
  }, [id])

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">{t('page.find_jobs.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">{error}</div>
        <Link href="/find-jobs">
          <button className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Jobs
          </button>
        </Link>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h2>Job Not Found</h2>
          <p>The job you're looking for doesn't exist or has been removed.</p>
          <Link href="/find-jobs">
            <button className="btn btn-primary" style={{ marginTop: '20px' }}>
              Back to Jobs
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <Link href="/find-jobs" style={{ marginBottom: '20px', display: 'inline-block' }}>
        <button className="btn btn-secondary">← Back to Jobs</button>
      </Link>

      <div style={{
        backgroundColor: '#2d2d2d',
        border: '1px solid #444',
        borderRadius: '8px',
        padding: '40px',
        marginBottom: '40px'
      }}>
        <h1 style={{ color: '#d4af37', marginBottom: '10px' }}>{job.title}</h1>
        <p style={{ color: '#b0b0b0', fontSize: '18px', marginBottom: '20px' }}>
          {job.company_name}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
          padding: '20px 0',
          borderTop: '1px solid #444',
          borderBottom: '1px solid #444'
        }}>
          <div>
            <p style={{ color: '#888', fontSize: '12px' }}>LOCATION</p>
            <p style={{ color: '#e0e0e0', fontWeight: '600' }}>
              {job.city}, {job.state}
            </p>
          </div>
          <div>
            <p style={{ color: '#888', fontSize: '12px' }}>CATEGORY</p>
            <p style={{ color: '#e0e0e0', fontWeight: '600' }}>{job.category}</p>
          </div>
          {job.compensation_range && (
            <div>
              <p style={{ color: '#888', fontSize: '12px' }}>COMPENSATION</p>
              <p style={{ color: '#e0e0e0', fontWeight: '600' }}>{job.compensation_range}</p>
            </div>
          )}
          {job.remote && (
            <div>
              <p style={{ color: '#888', fontSize: '12px' }}>WORK TYPE</p>
              <p style={{ color: '#e0e0e0', fontWeight: '600' }}>Remote Available</p>
            </div>
          )}
        </div>

        <h2 style={{ color: '#d4af37', fontSize: '24px', marginBottom: '15px' }}>Description</h2>
        <p style={{
          color: '#b0b0b0',
          lineHeight: '1.8',
          whiteSpace: 'pre-wrap',
          marginBottom: '30px'
        }}>
          {job.description}
        </p>

        {job.requirements && (
          <>
            <h2 style={{ color: '#d4af37', fontSize: '24px', marginBottom: '15px' }}>
              Requirements
            </h2>
            <p style={{
              color: '#b0b0b0',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              marginBottom: '30px'
            }}>
              {job.requirements}
            </p>
          </>
        )}

        <div style={{
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <button className="btn btn-primary">Apply Now</button>
          <Link href="/find-jobs">
            <button className="btn btn-secondary">Back to Jobs</button>
          </Link>
        </div>
      </div>
    </div>
  )
}
