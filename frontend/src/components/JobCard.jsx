import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Stepper, { Step } from './Stepper'
import './JobCard.css'

const API_BASE = 'http://127.0.0.1:4000'

function scoreColor(score) {
  if (score >= 70) return '#10b981'
  if (score >= 40) return '#fbbf24'
  return '#f87171'
}

function scoreLabel(score) {
  if (score >= 80) return 'Excellent Match'
  if (score >= 60) return 'Good Match'
  if (score >= 40) return 'Fair Match'
  return 'Low Match'
}

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
  const [coverLetter, setCoverLetter] = useState('')
  const [answers, setAnswers] = useState({})
  const [proposedBudget, setProposedBudget] = useState('')
  const [proposedTimeline, setProposedTimeline] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const postedTime = job.postedTime || timeAgo(job.createdAt)
  const title = job.title || ''
  const typeLine = budgetLine(job)
  const experience = job.experience || EXPERIENCE_LABELS[job.experienceLevel] || ''
  const duration = job.duration ? (DURATION_LABELS[job.duration] || job.duration) : ''
  const description = job.description
    ? (job.description.length > 180 ? job.description.slice(0, 180) + '…' : job.description)
    : ''
  const tags = job.tags || (job.requiredSkills ? job.requiredSkills.slice(0, 6) : [])

  const [questions, setQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const [fitScore, setFitScore] = useState(null)
  const [fitStrengths, setFitStrengths] = useState([])
  const [fitImprovements, setFitImprovements] = useState([])
  const [fitLoading, setFitLoading] = useState(false)
  const [fitProfileComplete, setFitProfileComplete] = useState(true)

  const openApplyModal = async () => {
    setIsApplyOpen(true)
    setLoadingQuestions(true)
    setFitLoading(true)

    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    try {
      const [jobRes, fitRes] = await Promise.all([
        fetch(`${API_BASE}/api/client/jobs/${job.id || job._id}`),
        token
          ? fetch(`${API_BASE}/api/ai/fit-score/${job.id || job._id}`, { credentials: 'include', headers })
          : Promise.resolve(null),
      ])

      const data = await jobRes.json()
      if (data.success && data.job?.screeningQuestions?.length) {
        setQuestions(data.job.screeningQuestions)
        const initial = {}
        data.job.screeningQuestions.forEach(q => {
          initial[q._id || q.id] = ''
        })
        setAnswers(initial)
      }

      if (fitRes) {
        const fitData = await fitRes.json()
        if (fitData.success) {
          setFitScore(fitData.fitScore)
          setFitStrengths(fitData.strengths || [])
          setFitImprovements(fitData.improvements || [])
          setFitProfileComplete(fitData.profileComplete !== false)
        }
      }
    } catch (err) {
      console.error('Error fetching job details / fit score:', err)
    } finally {
      setLoadingQuestions(false)
      setFitLoading(false)
    }
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    const token = localStorage.getItem('token')
    if (!token) {
      setError('You must be logged in to apply.')
      setSubmitting(false)
      return
    }

    const formattedAnswers = questions.map(q => ({
      questionId: q._id || q.id,
      questionText: q.questionText,
      value: answers[q._id || q.id] || '',
    })).filter(a => a.value !== '')

    const payload = {
      jobId: job.id || job._id,
      coverLetter,
      proposedBudget: proposedBudget ? Number(proposedBudget) : undefined,
      proposedTimelineDays: proposedTimeline ? Number(proposedTimeline) : undefined,
      answers: formattedAnswers,
    }

    try {
      const res = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to submit application.')
        setSubmitting(false)
        return
      }

      setSuccess(true)
      setSubmitting(false)
    } catch (err) {
      console.error('Error submitting application:', err)
      setError('Network error — make sure the backend is running.')
      setSubmitting(false)
    }
  }

  const closeModal = () => {
    setIsApplyOpen(false)
    setCoverLetter('')
    setAnswers({})
    setProposedBudget('')
    setProposedTimeline('')
    setCvFile(null)
    setError('')
    setSuccess(false)
    setQuestions([])
    setFitScore(null)
    setFitStrengths([])
    setFitImprovements([])
    setFitProfileComplete(true)
  }

  const hasQuestions = questions.length > 0

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
            onClick={openApplyModal}
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
        <div className="apply-modal-overlay" onClick={closeModal}>
          <div className="apply-modal apply-modal--wizard" onClick={(e) => e.stopPropagation()}>
            <div className="apply-modal-header">
              <h3>Apply to {title}</h3>
              <button className="apply-modal-close" onClick={closeModal}>×</button>
            </div>

            {/* AI Fit Score Panel */}
            {!success && (
              <div className="fit-score-panel">
                {fitLoading ? (
                  <div className="fit-score-loading">
                    <div className="fit-score-spinner" />
                    <span>Analyzing your fit...</span>
                  </div>
                ) : !fitProfileComplete ? (
                  <div className="fit-score-incomplete">
                    <span className="fit-incomplete-icon">!</span>
                    <div className="fit-incomplete-text">
                      <strong>Complete your profile</strong>
                      <span>Add your skills, bio, and title for an accurate AI fit score.</span>
                    </div>
                  </div>
                ) : fitScore != null ? (
                  <div className="fit-score-result">
                    <div className="fit-score-gauge" style={{ '--score-color': scoreColor(fitScore) }}>
                      <svg viewBox="0 0 80 80" className="fit-score-ring">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                        <circle
                          cx="40" cy="40" r="34"
                          fill="none"
                          stroke={scoreColor(fitScore)}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${(fitScore / 100) * 213.6} 213.6`}
                          transform="rotate(-90 40 40)"
                        />
                      </svg>
                      <span className="fit-score-number" style={{ color: scoreColor(fitScore) }}>{fitScore}</span>
                    </div>
                    <div className="fit-score-details">
                      <span className="fit-score-label" style={{ color: scoreColor(fitScore) }}>{scoreLabel(fitScore)}</span>
                      {fitStrengths.length > 0 && (
                        <div className="fit-tags">
                          {fitStrengths.map((s, i) => (
                            <span key={i} className="fit-tag fit-tag--strength">{s}</span>
                          ))}
                        </div>
                      )}
                      {fitImprovements.length > 0 && (
                        <div className="fit-tags">
                          {fitImprovements.map((s, i) => (
                            <span key={i} className="fit-tag fit-tag--improve">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {success ? (
              <div className="apply-success">
                <div className="apply-success-icon">✓</div>
                <p>Application submitted successfully!</p>
                <button className="gooey-button" onClick={closeModal}>Close</button>
              </div>
            ) : loadingQuestions ? (
              <div className="apply-loading">Loading...</div>
            ) : (
              <Stepper
                initialStep={1}
                onFinalStepCompleted={handleSubmit}
                backButtonText="Back"
                nextButtonText="Next"
                stepCircleContainerClassName="apply-stepper-container"
                disableStepIndicators={false}
              >
                {/* Step 1: Cover Letter */}
                <Step>
                  <div className="wizard-step">
                    <h4 className="wizard-step-title">Why are you a great fit?</h4>
                    <p className="wizard-step-desc">Tell the client about your experience and approach for this project.</p>
                    <textarea
                      className="wizard-input wizard-textarea"
                      rows="5"
                      placeholder="I'm a great fit because..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    />
                  </div>
                </Step>

                {/* Step 2: Screening Questions (only if client defined them) */}
                {hasQuestions && (
                  <Step>
                    <div className="wizard-step">
                      <h4 className="wizard-step-title">Screening Questions</h4>
                      <p className="wizard-step-desc">Answer the client's questions below.</p>
                      <div className="wizard-questions">
                        {questions.map((q) => {
                          const qId = q._id || q.id
                          return (
                            <label key={qId} className="wizard-question">
                              <span className="wizard-question-text">
                                {q.questionText}
                                {q.required && <span className="wizard-required">*</span>}
                              </span>
                              {q.questionType === 'text' && (
                                <textarea
                                  className="wizard-input wizard-textarea"
                                  rows="3"
                                  placeholder="Your answer..."
                                  value={answers[qId] || ''}
                                  onChange={(e) => handleAnswerChange(qId, e.target.value)}
                                  required={q.required}
                                />
                              )}
                              {q.questionType === 'number' && (
                                <input
                                  type="number"
                                  className="wizard-input"
                                  placeholder="Enter a number"
                                  value={answers[qId] || ''}
                                  onChange={(e) => handleAnswerChange(qId, e.target.value)}
                                  required={q.required}
                                />
                              )}
                              {q.questionType === 'yesno' && (
                                <div className="wizard-yesno">
                                  <button
                                    type="button"
                                    className={`wizard-yesno-btn ${answers[qId] === 'yes' ? 'active' : ''}`}
                                    onClick={() => handleAnswerChange(qId, 'yes')}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    className={`wizard-yesno-btn ${answers[qId] === 'no' ? 'active' : ''}`}
                                    onClick={() => handleAnswerChange(qId, 'no')}
                                  >
                                    No
                                  </button>
                                </div>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </Step>
                )}

                {/* Step 3: Budget & Timeline */}
                <Step>
                  <div className="wizard-step">
                    <h4 className="wizard-step-title">Your Proposal</h4>
                    <p className="wizard-step-desc">Set your proposed budget and timeline.</p>
                    <label className="wizard-field">
                      <span>Proposed budget ($)</span>
                      <input
                        type="number"
                        className="wizard-input"
                        min="0"
                        placeholder="Your proposed price"
                        value={proposedBudget}
                        onChange={(e) => setProposedBudget(e.target.value)}
                      />
                    </label>
                    <label className="wizard-field">
                      <span>Estimated timeline (days)</span>
                      <input
                        type="number"
                        className="wizard-input"
                        min="1"
                        placeholder="e.g., 30"
                        value={proposedTimeline}
                        onChange={(e) => setProposedTimeline(e.target.value)}
                      />
                    </label>
                  </div>
                </Step>

                {/* Step 4: CV Upload & Submit */}
                <Step>
                  <div className="wizard-step">
                    <h4 className="wizard-step-title">Upload Your CV</h4>
                    <p className="wizard-step-desc">Attach your resume so the client can review your background.</p>
                    <label className="wizard-file-upload">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setCvFile(e.target.files[0])}
                      />
                      <div className="wizard-file-label">
                        <span className="wizard-file-icon">📎</span>
                        <span>{cvFile ? cvFile.name : 'Choose a file (PDF, DOC, DOCX)'}</span>
                      </div>
                    </label>
                    {error && <p className="wizard-error">{error}</p>}
                    {submitting && <p className="wizard-submitting">Submitting your application...</p>}
                  </div>
                </Step>
              </Stepper>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default JobCard
