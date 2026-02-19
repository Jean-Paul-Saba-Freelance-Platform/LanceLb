import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import Stepper, { Step } from './Stepper'
import './JobCard.css'

const API_BASE = 'http://127.0.0.1:4000'

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

  const [questions, setQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const openApplyModal = async () => {
    setIsApplyOpen(true)
    setLoadingQuestions(true)
    try {
      const res = await fetch(`${API_BASE}/api/client/jobs/${job.id || job._id}`)
      const data = await res.json()
      if (data.success && data.job?.screeningQuestions?.length) {
        setQuestions(data.job.screeningQuestions)
        const initial = {}
        data.job.screeningQuestions.forEach(q => {
          initial[q._id || q.id] = q.questionType === 'yesno' ? '' : ''
        })
        setAnswers(initial)
      }
    } catch (err) {
      console.error('Error fetching job details:', err)
    } finally {
      setLoadingQuestions(false)
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
  }

  const hasQuestions = questions.length > 0

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
        {job.tags?.map((tag, index) => (
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
              <h3>Apply to {job.title}</h3>
              <button className="apply-modal-close" onClick={closeModal}>×</button>
            </div>

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
