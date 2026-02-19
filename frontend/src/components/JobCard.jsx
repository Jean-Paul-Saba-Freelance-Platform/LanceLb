import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import './JobCard.css'

const EXPERIENCE_LABELS = {
  entry: 'Entry',
  intermediate: 'Intermediate',
  expert: 'Expert',
}

const DURATION_LABELS = {
  '1_to_3_months': '1–3 months',
  '3_to_6_months': '3–6 months',
  'more_than_6_months': 'More than 6 months',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const posted = new Date(dateStr)
  const diffMs = now - posted
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Posted today'
  if (diffDays === 1) return 'Posted yesterday'
  if (diffDays < 7) return `Posted ${diffDays} days ago`
  if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return `Posted ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
}

function budgetLine(job) {
  if (job.paymentType === 'hourly' && job.hourlyMin != null && job.hourlyMax != null) {
    return `Hourly · $${job.hourlyMin}–$${job.hourlyMax}`
  }
  if (job.paymentType === 'fixed' && job.fixedBudget != null) {
    return `Fixed-price · $${job.fixedBudget}`
  }
  if (job.type) return job.type
  return ''
}

const JobCard = ({ job }) => {
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [applyBanner, setApplyBanner] = useState(false)

  const postedTime = job.postedTime || timeAgo(job.createdAt)
  const title = job.title || ''
  const typeLine = budgetLine(job)
  const experience = job.experience || EXPERIENCE_LABELS[job.experienceLevel] || ''
  const duration = job.duration ? (DURATION_LABELS[job.duration] || job.duration) : ''
  const description = job.description
    ? (job.description.length > 180 ? job.description.slice(0, 180) + '…' : job.description)
    : ''
  const tags = job.tags || (job.requiredSkills ? job.requiredSkills.slice(0, 6) : [])

  const handleApplyClick = () => {
    if (job.createdAt) {
      setApplyBanner(true)
      setTimeout(() => setApplyBanner(false), 3000)
    } else {
      setIsApplyOpen(true)
    }
  }

  const handleApplySubmit = (event) => {
    event.preventDefault()
    setIsApplyOpen(false)
  }

  return (
    <div className="job-card">
      <div className="job-card-header">
        <span className="job-posted-time">{postedTime}</span>
      </div>

      <h3 className="job-title">{title}</h3>

      <div className="job-meta-line">
        {typeLine && <span>{typeLine}</span>}
        {experience && <span>• {experience}</span>}
        {duration && <span>• {duration}</span>}
      </div>

      <p className="job-description">{description}</p>

      <div className="job-tags">
        {tags.map((tag, index) => (
          <span key={index} className="job-tag">{tag}</span>
        ))}
      </div>

      {applyBanner && (
        <div className="job-apply-banner">
          Apply feature coming soon
        </div>
      )}

      <div className="job-card-footer">
        <div className="job-footer-left">
          {job.paymentVerified && (
            <span className="job-badge payment-verified">Payment verified</span>
          )}
          {job.rating && (
            <span className="job-rating">
              <span className="stars">★★★★★</span>
              <span className="rating-text">{job.rating}</span>
            </span>
          )}
          {job.spent && <span className="job-spent">{job.spent}</span>}
          {job.location && <span className="job-location">📍 {job.location}</span>}
          {job.proposals && (
            <span className="job-proposals">{job.proposals} proposals</span>
          )}
          {job.projectSize && !job.spent && (
            <span className="job-spent">
              {job.projectSize === 'small' ? 'Small project' : job.projectSize === 'medium' ? 'Medium project' : 'Large project'}
            </span>
          )}
        </div>

        <div className="job-footer-right">
          <button
            className="job-apply-button gooey-button"
            onClick={handleApplyClick}
          >
            Apply now
          </button>
          <button className="job-icon-button" aria-label="Like">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button className="job-icon-button" aria-label="Save">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {isApplyOpen && createPortal(
        <div className="apply-modal-overlay" onClick={() => setIsApplyOpen(false)}>
          <div className="apply-modal" onClick={(event) => event.stopPropagation()}>
            <div className="apply-modal-header">
              <h3>Apply to {title}</h3>
              <button className="apply-modal-close" onClick={() => setIsApplyOpen(false)}>
                ×
              </button>
            </div>
            <form className="apply-form" onSubmit={handleApplySubmit}>
              <label className="apply-field">
                Why are you a great fit?
                <textarea required rows="4" placeholder="Briefly explain your experience and approach." />
              </label>
              <label className="apply-field">
                Relevant experience
                <input type="text" required placeholder="e.g., 3 years React, 5 years design" />
              </label>
              <label className="apply-field">
                Availability
                <input type="text" required placeholder="e.g., 20 hrs/week, start immediately" />
              </label>
              <label className="apply-field">
                Upload CV
                <input type="file" accept=".pdf,.doc,.docx" required />
              </label>
              <button type="submit" className="apply-submit-button gooey-button">
                Submit application
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default JobCard
