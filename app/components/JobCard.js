'use client'

import Link from 'next/link'

export default function JobCard({
  id,
  title,
  company,
  location,
  description,
  isPlaceholder = false,
  isTravelingMan = false,
  badge = null,
  onViewDetails
}) {
  const cardClassName = `job-card ${isPlaceholder ? 'placeholder' : ''} ${isTravelingMan ? 'traveling-man' : ''}`

  if (isPlaceholder) {
    return (
      <div className={cardClassName}>
        {badge && <div className="traveling-badge">{badge}</div>}
        <h3>{title}</h3>
        <p className="company">{company}</p>
        <p className="location">{location}</p>
        <p className="description">{description}</p>
        <button className="btn btn-secondary" disabled>View Details</button>
      </div>
    )
  }

  return (
    <div className={cardClassName}>
      {badge && <div className="traveling-badge">{badge}</div>}
      <h3>{title}</h3>
      <p className="company">{company}</p>
      <p className="location">{location}</p>
      <p className="description">{description}</p>
      <Link href={`/jobs/${id}`}>
        <button className="btn btn-secondary" onClick={onViewDetails}>
          View Details
        </button>
      </Link>
    </div>
  )
}
