import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Stepper, { Step } from './Stepper'
import './JobCard.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'
const DESCRIPTION_PREVIEW_LENGTH = 180

function scoreColor(score) {
  if (score >= 70) return '#10b981'
  if (score >= 40) return '#fbbf24'
  return '#f87171'
}

function stripEmoji(str) {
  if (!str) return str
  return str.replace(/[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2702}-\u{27B0}]|[\uFE00-\uFEFF]/gu, '').replace(/\s+/g, ' ').trim()
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

const JobCard = ({ job, isSaved = false, onToggleSave, alreadyApplied = false, onApplied }) => {
  const navigate = useNavigate()
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [answers, setAnswers] = useState({})
  const [proposedBudget, setProposedBudget] = useState('')
  const [proposedTimeline, setProposedTimeline] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [atsResult, setAtsResult] = useState(null)
  const [atsLoading, setAtsLoading] = useState(false)
  const [atsError, setAtsError] = useState('')
  const [jobMatchScore, setJobMatchScore] = useState(null)
  const [matchedKeywords, setMatchedKeywords] = useState([])
  const [missingKeywords, setMissingKeywords] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const postedTime = job.postedTime || timeAgo(job.createdAt)
  const title = job.title || ''
  const typeLine = budgetLine(job)
  const experience = job.experience || EXPERIENCE_LABELS[job.experienceLevel] || ''
  const duration = job.duration ? (DURATION_LABELS[job.duration] || job.duration) : ''
  const fullDescription = job.description || ''
  const isLongDescription = fullDescription.length > DESCRIPTION_PREVIEW_LENGTH
  const description = isDescriptionExpanded || !isLongDescription
    ? fullDescription
    : fullDescription.slice(0, DESCRIPTION_PREVIEW_LENGTH) + '…'
  const tags = job.tags || (job.requiredSkills ? job.requiredSkills.slice(0, 6) : [])
  const clientId =
    job.clientId ||
    job.client?._id ||
    job.client?.id ||
    job.postedBy ||
    job.userId ||
    null
  const clientPreview = {
    _id: clientId,
    name: job.client?.name || job.clientName || '',
    firstName: job.client?.firstName || '',
    lastName: job.client?.lastName || '',
    email: job.client?.email || '',
    avatar: job.client?.avatar || '',
    location: job.client?.location || '',
  }

  const [questions, setQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const [fitScore, setFitScore] = useState(null)
  const [fitStrengths, setFitStrengths] = useState([])
  const [fitImprovements, setFitImprovements] = useState([])
  const [fitLoading, setFitLoading] = useState(false)
  const [fitProfileComplete, setFitProfileComplete] = useState(true)
  const [fitError, setFitError] = useState('')
  const [tipsLoading, setTipsLoading] = useState(false)
  const [tipsError, setTipsError] = useState('')
  const [tipsSummary, setTipsSummary] = useState('')
  const [detailedTips, setDetailedTips] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestError, setSuggestError] = useState('')
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set())
  const [currentProfile, setCurrentProfile] = useState(null)

  const openApplyModal = async () => {
    if (alreadyApplied) return
    const jobId = job.id || job._id
    setIsApplyOpen(true)
    setLoadingQuestions(true)
    setFitLoading(true)
    setFitError('')

    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    if (token) {
      fetch(`${API_BASE}/api/auth/profile`, { headers, credentials: 'include' })
        .then(r => r.json()).then(d => { if (d.success) setCurrentProfile(d.user) }).catch(() => {})
    }

    try {
      const [jobResult, fitResult] = await Promise.allSettled([
        jobId ? fetch(`${API_BASE}/api/client/jobs/${jobId}`) : Promise.resolve(null),
        token && jobId
          ? fetch(`${API_BASE}/api/ai/fit-score/${jobId}`, { credentials: 'include', headers })
          : Promise.resolve(null),
      ])

      if (jobResult.status === 'fulfilled' && jobResult.value) {
        const data = await jobResult.value.json()
        if (data.success && data.job?.screeningQuestions?.length) {
          setQuestions(data.job.screeningQuestions)
          const initial = {}
          data.job.screeningQuestions.forEach(q => {
            initial[q._id || q.id] = ''
          })
          setAnswers(initial)
        }
      } else {
        console.error('Error fetching job details:', jobResult.reason)
      }

      if (!token) {
        setFitError('Login required to view AI analysis.')
      } else if (fitResult.status === 'fulfilled' && fitResult.value) {
        const fitData = await fitResult.value.json()
        if (fitResult.value.ok && fitData.success) {
          setFitScore(fitData.fitScore ?? null)
          setFitStrengths(fitData.strengths || [])
          setFitImprovements(fitData.improvements || [])
          setFitProfileComplete(fitData.profileComplete !== false)
        } else {
          setFitError(fitData.message || 'AI analysis is unavailable right now.')
        }
      } else if (fitResult.status === 'rejected') {
        console.error('Error fetching AI fit score:', fitResult.reason)
        setFitError('AI analysis is unavailable right now.')
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

  const fetchDetailedTips = async () => {
    const token = localStorage.getItem('token')
    if (!token || tipsLoading || detailedTips.length > 0 || !fitProfileComplete) return

    setTipsLoading(true)
    setTipsError('')

    try {
      const res = await fetch(`${API_BASE}/api/ai/application-tips/${job.id || job._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setTipsError(data.message || 'Could not load AI tips right now.')
        return
      }

      setTipsSummary(data.summary || '')
      setDetailedTips(Array.isArray(data.tips) ? data.tips : [])
    } catch (err) {
      console.error('Error fetching detailed AI tips:', err)
      setTipsError('Could not load AI tips right now.')
    } finally {
      setTipsLoading(false)
    }
  }

  const fetchSuggestions = async () => {
    const token = localStorage.getItem('token')
    if (!token || suggestLoading) return

    setSuggestLoading(true)
    setSuggestError('')
    setSuggestions([])
    setDismissedSuggestions(new Set())

    const formattedAnswers = questions.map(q => ({
      questionId: q._id || q.id,
      questionText: q.questionText,
      value: answers[q._id || q.id] || '',
    })).filter(a => a.value !== '')

    try {
      const res = await fetch(`${API_BASE}/api/ai/suggest-improvements/${job.id || job._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({
          coverLetter,
          proposedBudget: proposedBudget ? Number(proposedBudget) : undefined,
          proposedTimelineDays: proposedTimeline ? Number(proposedTimeline) : undefined,
          answers: formattedAnswers,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setSuggestError(data.message || 'Could not generate suggestions.')
        return
      }
      setSuggestions(data.suggestions || [])
    } catch {
      setSuggestError('Could not reach AI service.')
    } finally {
      setSuggestLoading(false)
    }
  }

  const acceptSuggestion = async (suggestion) => {
    if (suggestion.field === 'coverLetter') setCoverLetter(suggestion.suggested)
    if (suggestion.field === 'proposedBudget') setProposedBudget(suggestion.suggested)
    if (suggestion.field === 'proposedTimelineDays') setProposedTimeline(suggestion.suggested)

    if (suggestion.field.startsWith('profile_')) {
      const token = localStorage.getItem('token')
      const payload = {}
      if (suggestion.field === 'profile_bio') payload.bio = suggestion.suggested
      if (suggestion.field === 'profile_title') payload.title = suggestion.suggested
      if (suggestion.field === 'profile_skills') {
        const newSkills = suggestion.suggested.split(',').map(s => s.trim()).filter(Boolean)
        const existing = currentProfile?.skills || []
        const existingLower = existing.map(s => s.toLowerCase())
        const toAdd = newSkills.filter(s => !existingLower.includes(s.toLowerCase()))
        payload.skills = [...new Set([...existing, ...toAdd])]
      }
      try {
        await fetch(`${API_BASE}/api/auth/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        setSuggestions([])
        setDismissedSuggestions(new Set())
      } catch {
        // profile update failure doesn't block the application flow
      }
    }

    setDismissedSuggestions(prev => new Set([...prev, suggestion.field]))
  }

  const rejectSuggestion = (field) => {
    setDismissedSuggestions(prev => new Set([...prev, field]))
  }

  const handleCvUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setAtsError('Only PDF files are supported for ATS scoring.')
      return
    }
    setCvFile(file)
    setAtsResult(null)
    setAtsError('')
    setAtsLoading(true)

    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('resume', file)
    if (job.description) {
      formData.append('job_description', job.description)
    }

    try {
      const res = await fetch(`${API_BASE}/api/ats/evaluate`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAtsResult(data)
        setJobMatchScore(data.job_match_score ?? null)
        setMatchedKeywords(data.matched_keywords || [])
        setMissingKeywords(data.missing_keywords || [])
      } else {
        setAtsError(data.message || 'ATS scoring failed.')
      }
    } catch {
      setAtsError('Could not reach ATS service.')
    } finally {
      setAtsLoading(false)
    }
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
      ...(atsResult && {
        atsScore:      atsResult.total_score,
        atsGrade:      atsResult.grade,
        atsCategory:   atsResult.predicted_category,
        atsConfidence: atsResult.confidence,
        atsBreakdown:  atsResult.breakdown,
        atsFeedback:   atsResult.feedback,
      }),
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
      if (onApplied) onApplied(job.id || job._id)
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
    setAtsResult(null)
    setAtsLoading(false)
    setAtsError('')
    setJobMatchScore(null)
    setMatchedKeywords([])
    setMissingKeywords([])
    setError('')
    setSuccess(false)
    setQuestions([])
    setFitScore(null)
    setFitStrengths([])
    setFitImprovements([])
    setFitProfileComplete(true)
    setFitError('')
    setTipsLoading(false)
    setTipsError('')
    setTipsSummary('')
    setDetailedTips([])
    setSuggestions([])
    setSuggestLoading(false)
    setSuggestError('')
    setDismissedSuggestions(new Set())
    setCurrentProfile(null)
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

      <p className={`job-description ${isDescriptionExpanded ? 'expanded' : ''}`}>{description}</p>
      {isLongDescription && (
        <button
          type="button"
          className="job-description-toggle"
          onClick={() => setIsDescriptionExpanded(prev => !prev)}
          aria-expanded={isDescriptionExpanded}
        >
          {isDescriptionExpanded ? 'Show less' : 'Show full description'}
        </button>
      )}

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
            className="job-profile-button"
            onClick={() =>
              navigate(`/freelancer/client-profile/${clientId || 'unknown'}`, {
                state: { client: clientPreview, fromJob: job.id || job._id },
              })
            }
            disabled={!clientId}
            title={clientId ? 'See client profile' : 'Client profile unavailable'}
          >
            See client profile
          </button>
          {alreadyApplied ? (
            <button className="job-apply-button job-apply-button--applied" disabled>
              Applied
            </button>
          ) : (
            <button className="job-apply-button gooey-button" onClick={openApplyModal}>
              Apply now
            </button>
          )}
          <button
            className={`job-icon-button ${isSaved ? 'job-icon-button--saved' : ''}`}
            aria-label={isSaved ? 'Unsave job' : 'Save job'}
            onClick={() => onToggleSave && onToggleSave(job._id || job.id)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
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
            {!success && (fitLoading || fitError || !fitProfileComplete || fitScore != null || fitImprovements.length > 0 || fitStrengths.length > 0 || tipsSummary || detailedTips.length > 0 || tipsError) && (
              <div className="fit-score-panel">
                {fitLoading ? (
                  <div className="fit-score-loading">
                    <div className="fit-score-spinner" />
                    <span>Analyzing your fit...</span>
                  </div>
                ) : fitError ? (
                  <div className="fit-score-error">{fitError}</div>
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
                      <div className="fit-action-row">
                        <button
                          type="button"
                          className="fit-tips-button"
                          onClick={fetchDetailedTips}
                          disabled={tipsLoading}
                        >
                          {tipsLoading ? 'Getting tips...' : 'Get AI tips'}
                        </button>
                        <button
                          type="button"
                          className="fit-suggest-button"
                          onClick={fetchSuggestions}
                          disabled={suggestLoading}
                        >
                          {suggestLoading ? 'Analyzing...' : 'Suggest improvements'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
                {!fitLoading && fitProfileComplete && (tipsSummary || detailedTips.length > 0 || tipsError) && (
                  <div className="fit-tips-panel">
                    {tipsError ? (
                      <p className="fit-tips-error">{tipsError}</p>
                    ) : (
                      <>
                        {tipsSummary && <p className="fit-tips-summary">{tipsSummary}</p>}
                        {detailedTips.length > 0 && (
                          <div className="fit-tips-list">
                            {detailedTips.map((tip, index) => (
                              <div className="fit-tip-item" key={`${tip.title || 'tip'}-${index}`}>
                                <h5>{tip.title || `Tip ${index + 1}`}</h5>
                                <p>{tip.details}</p>
                                {tip.example && <p className="fit-tip-example">Example: {tip.example}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI Suggestions Panel */}
            {(suggestLoading || suggestError || suggestions.length > 0) && (
              <div className="suggestions-panel">
                <div className="suggestions-panel-header">
                  <span className="suggestions-panel-title">AI Suggested Improvements</span>
                  {!suggestLoading && suggestions.length > 0 && (
                    <span className="suggestions-count">
                      {suggestions.filter(s => !dismissedSuggestions.has(s.field)).length} remaining
                    </span>
                  )}
                </div>
                {suggestLoading ? (
                  <div className="suggestions-loading">
                    <div className="fit-score-spinner" />
                    <span>Analyzing your draft...</span>
                  </div>
                ) : suggestError ? (
                  <p className="suggestions-error">{suggestError}</p>
                ) : suggestions.length === 0 ? (
                  <p className="suggestions-empty">Your application looks great — no improvements needed.</p>
                ) : (
                  <div className="suggestions-list">
                    {suggestions.map((s) => {
                      const dismissed = dismissedSuggestions.has(s.field)
                      const isAccepted = dismissed && (
                        (s.field === 'coverLetter' && coverLetter === s.suggested) ||
                        (s.field === 'proposedBudget' && proposedBudget === s.suggested) ||
                        (s.field === 'proposedTimelineDays' && proposedTimeline === s.suggested)
                      )
                      return (
                        <div key={s.field} className={`suggestion-card ${dismissed ? 'suggestion-card--dismissed' : ''}`}>
                          <div className="suggestion-header">
                            <span className="suggestion-label">{s.label}</span>
                            {dismissed && (
                              <span className={`suggestion-status ${isAccepted ? 'suggestion-status--accepted' : 'suggestion-status--rejected'}`}>
                                {isAccepted ? 'Applied' : 'Skipped'}
                              </span>
                            )}
                          </div>
                          <p className="suggestion-reason">{s.reason}</p>
                          {!dismissed && (
                            <>
                              <div className="suggestion-diff">
                                <div className="suggestion-diff-before">
                                  <span className="suggestion-diff-label">Current</span>
                                  <p className="suggestion-diff-text suggestion-diff-text--before">
                                    {s.field === 'coverLetter'
                                      ? (coverLetter ? `${coverLetter.slice(0, 100)}${coverLetter.length > 100 ? '…' : ''}` : '(empty)')
                                      : s.field === 'proposedBudget' ? (proposedBudget ? `$${proposedBudget}` : '(not set)')
                                      : s.field === 'proposedTimelineDays' ? (proposedTimeline ? `${proposedTimeline} days` : '(not set)')
                                      : s.field === 'profile_bio' ? (currentProfile?.bio ? `${currentProfile.bio.slice(0, 80)}…` : '(empty)')
                                      : s.field === 'profile_title' ? (currentProfile?.title || '(empty)')
                                      : (currentProfile?.skills?.join(', ') || '(no skills)')}
                                  </p>
                                </div>
                                <div className="suggestion-diff-arrow">→</div>
                                <div className="suggestion-diff-after">
                                  <span className="suggestion-diff-label">Suggested</span>
                                  <p className="suggestion-diff-text suggestion-diff-text--after">
                                    {s.field === 'coverLetter'
                                      ? `${s.suggested.slice(0, 100)}${s.suggested.length > 100 ? '…' : ''}`
                                      : s.field === 'proposedBudget' ? `$${s.suggested}`
                                      : s.field === 'proposedTimelineDays' ? `${s.suggested} days`
                                      : `${s.suggested.slice(0, 100)}${s.suggested.length > 100 ? '…' : ''}`}
                                  </p>
                                </div>
                              </div>
                              <div className="suggestion-actions">
                                <button
                                  type="button"
                                  className="suggestion-accept"
                                  onClick={() => acceptSuggestion(s)}
                                >
                                  {s.field.startsWith('profile_') ? 'Apply to Profile' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  className="suggestion-reject"
                                  onClick={() => rejectSuggestion(s.field)}
                                >
                                  Skip
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
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

                {/* Step 4: CV Upload + ATS Scoring */}
                <Step>
                  <div className="wizard-step">
                    <h4 className="wizard-step-title">Upload Your CV</h4>
                    <p className="wizard-step-desc">Upload your PDF resume to get an instant ATS score before submitting.</p>
                    <label className="wizard-file-upload">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleCvUpload(e.target.files[0])}
                      />
                      <div className="wizard-file-label">
                        <span className="wizard-file-icon">📎</span>
                        <span>{cvFile ? cvFile.name : 'Choose a PDF file'}</span>
                      </div>
                    </label>

                    {atsLoading && (
                      <div className="ats-loading">
                        <div className="ats-spinner" />
                        <span>Scoring your resume...</span>
                      </div>
                    )}

                    {atsError && <p className="wizard-error">{atsError}</p>}

                    {atsResult && (
                      <div className="ats-result">
                        <div className="ats-result-main">
                          <div className="ats-gauge">
                            <svg viewBox="0 0 80 80" className="ats-ring">
                              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                              <circle
                                cx="40" cy="40" r="34"
                                fill="none"
                                stroke={scoreColor(atsResult.total_score)}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${(atsResult.total_score / 100) * 213.6} 213.6`}
                                transform="rotate(-90 40 40)"
                              />
                            </svg>
                            <span className="ats-gauge-number" style={{ color: scoreColor(atsResult.total_score) }}>
                              {atsResult.total_score}
                            </span>
                          </div>
                          <div className="ats-result-details">
                            {atsResult.grade && (
                              <span className="ats-grade-label" style={{ color: scoreColor(atsResult.total_score) }}>
                                {stripEmoji(atsResult.grade)}
                              </span>
                            )}
                            {atsResult.breakdown && (
                              <div className="ats-breakdown">
                                {Object.entries(atsResult.breakdown).map(([label, val]) => (
                                  <div key={label} className="ats-bar-row">
                                    <span className="ats-bar-label">{label}</span>
                                    <div className="ats-bar-track">
                                      <div
                                        className="ats-bar-fill"
                                        style={{ width: `${Math.min(val * 4, 100)}%`, background: scoreColor(val * 4) }}
                                      />
                                    </div>
                                    <span className="ats-bar-score">{val}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {atsResult.feedback?.length > 0 && (
                          <div className="ats-tips-panel">
                            {atsResult.feedback.map((tip, i) => (
                              <p key={i} className="ats-tip-item">{stripEmoji(tip)}</p>
                            ))}
                          </div>
                        )}
                        {jobMatchScore != null && (
                          <div className="ats-job-match">
                            <div className="ats-job-match-header">
                              <span className="ats-job-match-label">CV-JOB FIT</span>
                              <span className="ats-job-match-score" style={{ color: scoreColor(jobMatchScore) }}>
                                {jobMatchScore}%
                              </span>
                            </div>
                            {matchedKeywords.filter(k => k.length > 5 && !k.includes(' ')).length > 0 && (
                              <div className="ats-match-row">
                                <span className="ats-match-tag ats-match-tag--hit">✓ Matched: {matchedKeywords.filter(k => k.length > 5 && !k.includes(' ')).slice(0, 5).join(', ')}</span>
                              </div>
                            )}
                            {missingKeywords.filter(k => k.length > 5 && !k.includes(' ')).length > 0 && (
                              <div className="ats-match-row">
                                <span className="ats-match-tag ats-match-tag--miss">+ Consider adding: {missingKeywords.filter(k => k.length > 5 && !k.includes(' ')).slice(0, 3).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

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
