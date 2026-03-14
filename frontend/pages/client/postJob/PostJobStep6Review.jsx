/**
 * PostJobStep6Review — Step 6 of the "Post a Job" wizard (Review & Publish).
 *
 * Reads the entire draft from localStorage["postJobDraft"] and renders
 * five review cards so the client can verify every section before publishing.
 * Each card has an "Edit" link that navigates back to the relevant step.
 *
 * When the user clicks "Publish Job Post", the component:
 *   1. Builds a payload from the draft matching the backend Job schema.
 *   2. POSTs to /api/client/jobs (auth via httpOnly cookie).
 *   3. On success — clears the draft and redirects to /client/jobs.
 *   4. On failure — displays an inline error message.
 *
 * Draft keys consumed:
 *   title, requiredSkills, description,
 *   projectSize, duration, experienceLevel, contractToHire,
 *   paymentType, hourlyMin, hourlyMax, fixedBudget
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PostJobLayout from './PostJobLayout'

/* ── Constants ─────────────────────────────────────────────────────────── */

const DRAFT_KEY = 'postJobDraft'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

/** Human-readable labels for scope enums */
const SIZE_LABELS = { small: 'Small', medium: 'Medium', large: 'Large' }
const DURATION_LABELS = {
  '1_to_3_months': '1–3 months',
  '3_to_6_months': '3–6 months',
  'more_than_6_months': 'More than 6 months',
}
const EXPERIENCE_LABELS = {
  entry: 'Entry level',
  intermediate: 'Intermediate',
  expert: 'Expert',
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

/** Returns true when every required draft section is filled. */
const isDraftComplete = (d) => {
  const hasTitle = (d.title || '').trim().length >= 5
  const hasSkills = Array.isArray(d.requiredSkills) && d.requiredSkills.length >= 1
  const hasDesc = (d.description || '').trim().length >= 20
  const hasScope =
    d.projectSize && d.duration && d.experienceLevel && d.contractToHire
  const hasBudget =
    d.paymentType === 'fixed'
      ? parseFloat(d.fixedBudget) > 0
      : d.paymentType === 'hourly'
        ? parseFloat(d.hourlyMin) > 0 && parseFloat(d.hourlyMax) > 0
        : false

  return hasTitle && hasSkills && hasDesc && hasScope && hasBudget
}

/** Converts the localStorage draft into the shape the backend expects. */
const buildPayload = (d) => {
  const paymentType = d.paymentType
  const hourlyMin = paymentType === 'hourly' ? Number(d.hourlyMin) : undefined
  const hourlyMax = paymentType === 'hourly' ? Number(d.hourlyMax) : undefined
  const fixedBudget = paymentType === 'fixed' ? Number(d.fixedBudget) : undefined

  /* budget — the canonical single number the model requires */
  const budget = paymentType === 'fixed' ? fixedBudget : hourlyMin

  return {
    title: d.title,
    description: d.description,
    requiredSkills: d.requiredSkills || [],
    experienceLevel: d.experienceLevel,
    projectSize: d.projectSize,
    duration: d.duration,
    contractToHire: d.contractToHire === 'yes' || d.contractToHire === true,
    paymentType,
    hourlyMin,
    hourlyMax,
    fixedBudget,
    budget,
  }
}

/* ── Component ─────────────────────────────────────────────────────────── */

const PostJobStep6Review = () => {
  const navigate = useNavigate()
  const [draft, setDraft] = useState({})
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')

  /* ---- Load draft on mount ---- */
  useEffect(() => {
    try {
      setDraft(JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'))
    } catch {
      setDraft({})
    }
  }, [])

  /* ---- Derived state ---- */
  const isComplete = isDraftComplete(draft)
  const hasDraft = !!(draft.title || draft.requiredSkills?.length || draft.description)

  /* ---- Publish — real API call ---- */
  const handlePublish = async () => {
    if (!isComplete || publishing) return

    setPublishing(true)
    setError('')

    try {
      const payload = buildPayload(draft)

      const token = localStorage.getItem('token')

      if (!token) {
        setError('You are not logged in. Please log in again.')
        setPublishing(false)
        return
      }
      
      const res = await fetch(`${API_BASE}/api/client/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || 'Something went wrong. Please try again.')
        setPublishing(false)
        return
      }

      /* Success — clear the draft and redirect to the jobs list */
      localStorage.removeItem(DRAFT_KEY)
      navigate('/client/jobs')
    } catch (err) {
      console.error('Publish error:', err)
      setError('Network error — make sure the backend is running.')
      setPublishing(false)
    }
  }

  /* ---- Budget display string ---- */
  const budgetDisplay = () => {
    if (draft.paymentType === 'hourly' && draft.hourlyMin && draft.hourlyMax) {
      return `Hourly rate: $${draft.hourlyMin} – $${draft.hourlyMax} /hour`
    }
    if (draft.paymentType === 'fixed' && draft.fixedBudget) {
      return `Project budget: $${draft.fixedBudget}`
    }
    return null
  }

  /* ---- Render ---- */
  return (
    <PostJobLayout
      stepNumber={6}
      totalSteps={6}
      stepTitle="Job post"
      nextLabel={publishing ? 'Publishing…' : 'Publish Job Post'}
      onNext={handlePublish}
      nextDisabled={!isComplete || publishing}
      onBack={() => navigate('/client/post-job/budget')}
      onClose={() => navigate('/client/home')}
    >
      {/* Inline error message (appears when publish fails) */}
      {error && (
        <div className="review-error">
          <span>{error}</span>
          <button
            type="button"
            className="review-error-dismiss"
            onClick={() => setError('')}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Info banner */}
      <div className="review-banner">
        <span className="review-banner-icon">ℹ</span>
        <span>
          Reminder: To publish your job post, you'll need to verify your
          phone number.
        </span>
      </div>

      <div className="wizard-two-col">
        {/* ── Left column ── */}
        <div className="wizard-left-col">
          <h1>Review your job post.</h1>
          <p>
            Make sure everything looks right. You can edit any section
            before publishing.
          </p>
        </div>

        {/* ── Right column — review cards ── */}
        <div className="wizard-right-col">
          {/* Empty-draft guard */}
          {!hasDraft && (
            <div className="review-empty">
              <p>Your draft is incomplete. Start from Step 1.</p>
              <button
                type="button"
                className="review-empty-btn"
                onClick={() => navigate('/client/post-job/title')}
              >
                Go to Step 1
              </button>
            </div>
          )}

          {hasDraft && (
            <>
              {/* 1 — Title */}
              <div className="review-card">
                <div className="review-card-header">
                  <span className="review-card-label">Job title</span>
                  <button
                    type="button"
                    className="review-edit-btn"
                    onClick={() => navigate('/client/post-job/title')}
                  >
                    Edit
                  </button>
                </div>
                <p className="review-card-value">
                  {draft.title?.trim() || '—'}
                </p>
              </div>

              {/* 2 — Skills */}
              <div className="review-card">
                <div className="review-card-header">
                  <span className="review-card-label">Skills</span>
                  <button
                    type="button"
                    className="review-edit-btn"
                    onClick={() => navigate('/client/post-job/skills')}
                  >
                    Edit
                  </button>
                </div>
                {Array.isArray(draft.requiredSkills) && draft.requiredSkills.length > 0 ? (
                  <div className="review-chips">
                    {draft.requiredSkills.map((s, i) => (
                      <span key={i} className="review-chip">{s}</span>
                    ))}
                  </div>
                ) : (
                  <p className="review-card-empty">No skills added</p>
                )}
              </div>

              {/* 3 — Description */}
              <div className="review-card">
                <div className="review-card-header">
                  <span className="review-card-label">Description</span>
                  <button
                    type="button"
                    className="review-edit-btn"
                    onClick={() => navigate('/client/post-job/description')}
                  >
                    Edit
                  </button>
                </div>
                {draft.description?.trim() ? (
                  <p className="review-card-value review-description">
                    {draft.description}
                  </p>
                ) : (
                  <p className="review-card-empty">No description provided</p>
                )}
              </div>

              {/* 4 — Scope */}
              <div className="review-card">
                <div className="review-card-header">
                  <span className="review-card-label">Scope</span>
                  <button
                    type="button"
                    className="review-edit-btn"
                    onClick={() => navigate('/client/post-job/scope')}
                  >
                    Edit
                  </button>
                </div>
                {draft.projectSize || draft.duration || draft.experienceLevel || draft.contractToHire ? (
                  <div className="review-scope-grid">
                    {draft.projectSize && (
                      <div className="review-scope-item">
                        <span className="review-scope-key">Project size</span>
                        <span className="review-scope-val">
                          {SIZE_LABELS[draft.projectSize] || draft.projectSize}
                        </span>
                      </div>
                    )}
                    {draft.duration && (
                      <div className="review-scope-item">
                        <span className="review-scope-key">Duration</span>
                        <span className="review-scope-val">
                          {DURATION_LABELS[draft.duration] || draft.duration}
                        </span>
                      </div>
                    )}
                    {draft.experienceLevel && (
                      <div className="review-scope-item">
                        <span className="review-scope-key">Experience</span>
                        <span className="review-scope-val">
                          {EXPERIENCE_LABELS[draft.experienceLevel] || draft.experienceLevel}
                        </span>
                      </div>
                    )}
                    {draft.contractToHire && (
                      <div className="review-scope-item">
                        <span className="review-scope-key">Contract-to-hire</span>
                        <span className="review-scope-val">
                          {draft.contractToHire === 'yes' ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="review-card-empty">Scope not defined</p>
                )}
              </div>

              {/* 5 — Budget */}
              <div className="review-card">
                <div className="review-card-header">
                  <span className="review-card-label">Budget</span>
                  <button
                    type="button"
                    className="review-edit-btn"
                    onClick={() => navigate('/client/post-job/budget')}
                  >
                    Edit
                  </button>
                </div>
                {budgetDisplay() ? (
                  <p className="review-card-value">{budgetDisplay()}</p>
                ) : (
                  <p className="review-card-empty">No budget set</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PostJobLayout>
  )
}

export default PostJobStep6Review
