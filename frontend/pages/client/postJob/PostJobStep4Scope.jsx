/**
 * PostJobStep4Scope — Step 4 of the "Post a Job" wizard.
 *
 * Collects four scoping dimensions that help match the job with the
 * right freelancer talent pool:
 *   A) Project size   — small / medium / large
 *   B) Duration       — 1_to_3_months / 3_to_6_months / more_than_6_months
 *   C) Experience     — entry / intermediate / expert  (matches backend enum)
 *   D) Contract-to-hire — yes / no
 *
 * All four sections must have a selection before Next is enabled.
 *
 * Draft persistence:
 *   - On mount, restores projectSize, duration, experienceLevel,
 *     contractToHire from localStorage["postJobDraft"].
 *   - On Next, merges these four fields into the existing draft and
 *     navigates to /client/post-job/budget (Step 5).
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PostJobLayout from './PostJobLayout'

/* ── Constants ─────────────────────────────────────────────────────────── */

const DRAFT_KEY = 'postJobDraft'

/**
 * Each section is described as an array of option objects so the JSX
 * can map over them generically.  `value` is what gets persisted;
 * `label` and `desc` are display-only.
 */
const PROJECT_SIZE_OPTIONS = [
  {
    value: 'small',
    label: 'Small',
    desc: 'Quick and straightforward tasks — a few days of work.',
  },
  {
    value: 'medium',
    label: 'Medium',
    desc: 'Well-defined projects with clear deliverables — a few weeks.',
  },
  {
    value: 'large',
    label: 'Large',
    desc: 'Longer-term or complex initiatives — ongoing engagement.',
  },
]

const DURATION_OPTIONS = [
  {
    value: '1_to_3_months',
    label: '1 to 3 months',
    desc: 'Short-term engagement with a defined end date.',
  },
  {
    value: '3_to_6_months',
    label: '3 to 6 months',
    desc: 'Mid-length project that may evolve as work progresses.',
  },
  {
    value: 'more_than_6_months',
    label: 'More than 6 months',
    desc: 'Long-term collaboration or ongoing support.',
  },
]

const EXPERIENCE_OPTIONS = [
  {
    value: 'entry',
    label: 'Entry level',
    desc: 'Newer freelancers with foundational skills and eagerness to learn.',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    desc: 'Experienced professionals with a solid portfolio.',
  },
  {
    value: 'expert',
    label: 'Expert',
    desc: 'Top-tier talent with deep expertise and proven track records.',
  },
]

const CONTRACT_TO_HIRE_OPTIONS = [
  {
    value: 'yes',
    label: 'Yes, this could become a full-time role',
    desc: 'You may offer the freelancer a permanent position later.',
  },
  {
    value: 'no',
    label: 'No, this is a defined project',
    desc: 'The engagement ends when the deliverables are complete.',
  },
]

/* ── Component ─────────────────────────────────────────────────────────── */

const PostJobStep4Scope = () => {
  const navigate = useNavigate()

  const [projectSize, setProjectSize] = useState('')
  const [duration, setDuration] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [contractToHire, setContractToHire] = useState('')

  /* ---- Restore draft on mount ---- */
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      if (draft.projectSize) setProjectSize(draft.projectSize)
      if (draft.duration) setDuration(draft.duration)
      if (draft.experienceLevel) setExperienceLevel(draft.experienceLevel)
      if (draft.contractToHire) setContractToHire(draft.contractToHire)
    } catch {
      /* corrupt draft — start fresh */
    }
  }, [])

  /* ---- Validation: all four must be selected ---- */
  const isValid =
    projectSize !== '' &&
    duration !== '' &&
    experienceLevel !== '' &&
    contractToHire !== ''

  /* ---- Handlers ---- */

  const handleNext = () => {
    if (!isValid) return

    try {
      const existing = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ...existing,
          projectSize,
          duration,
          experienceLevel,
          contractToHire,
        })
      )
    } catch {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ projectSize, duration, experienceLevel, contractToHire })
      )
    }

    navigate('/client/post-job/budget')
  }

  const handleBack = () => {
    navigate('/client/post-job/description')
  }

  /* ---- Reusable radio-group renderer ---- */
  const renderRadioGroup = (name, options, value, onChange) => (
    <div className="wizard-radio-group">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`wizard-radio-option ${value === opt.value ? 'selected' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="wizard-radio-input"
          />
          <span className="wizard-radio-circle" />
          <span className="wizard-radio-content">
            <span className="wizard-radio-title">{opt.label}</span>
            <span className="wizard-radio-desc">{opt.desc}</span>
          </span>
        </label>
      ))}
    </div>
  )

  /* ---- Render ---- */
  return (
    <PostJobLayout
      stepNumber={4}
      totalSteps={6}
      stepTitle="Job post"
      nextLabel="Next: Budget"
      onNext={handleNext}
      nextDisabled={!isValid}
      onBack={handleBack}
      onClose={() => navigate('/client/home')}
    >
      <div className="wizard-two-col">
        {/* ── Left column ── */}
        <div className="wizard-left-col">
          <h1>Next, estimate the scope of your work.</h1>
          <p>
            These aren't final answers, but they help us recommend the right
            talent and give freelancers a clearer picture of your expectations.
          </p>
        </div>

        {/* ── Right column — four stacked sections ── */}
        <div className="wizard-right-col">
          {/* A) Project size */}
          <div>
            <span className="wizard-label">How big is your project?</span>
            {renderRadioGroup('projectSize', PROJECT_SIZE_OPTIONS, projectSize, setProjectSize)}
          </div>

          {/* B) Duration */}
          <div>
            <span className="wizard-label">How long will your work take?</span>
            {renderRadioGroup('duration', DURATION_OPTIONS, duration, setDuration)}
          </div>

          {/* C) Experience level */}
          <div>
            <span className="wizard-label">What level of experience will it need?</span>
            {renderRadioGroup('experienceLevel', EXPERIENCE_OPTIONS, experienceLevel, setExperienceLevel)}
          </div>

          {/* D) Contract-to-hire */}
          <div>
            <span className="wizard-label">Is this a contract-to-hire opportunity?</span>
            {renderRadioGroup('contractToHire', CONTRACT_TO_HIRE_OPTIONS, contractToHire, setContractToHire)}
          </div>
        </div>
      </div>
    </PostJobLayout>
  )
}

export default PostJobStep4Scope
