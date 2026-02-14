import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import './JobCard.css'

const JobCard = ({ job }) => {
  const [isApplyOpen, setIsApplyOpen] = useState(false)

  const handleApplySubmit = (event) => {
    event.preventDefault()
    setIsApplyOpen(false)
  }

  return (
    <div className="job-card">
      <div className="job-card-header">
        <span className="job-posted-time">{job.postedTime}</span>
      </div>

      <h3 className="job-title">{job.title}</h3>
      
      <div className="job-meta-line">
        <span>{job.type}</span>
        {job.experience && <span>• {job.experience}</span>}
        {job.duration && <span>• {job.duration}</span>}
      </div>

      <p className="job-description">{job.description}</p>

      <div className="job-tags">
        {job.tags.map((tag, index) => (
          <span key={index} className="job-tag">{tag}</span>
        ))}
      </div>

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
        </div>

        <div className="job-footer-right">
          <button
            className="job-apply-button gooey-button"
            onClick={() => setIsApplyOpen(true)}
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
              <h3>Apply to {job.title}</h3>
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
