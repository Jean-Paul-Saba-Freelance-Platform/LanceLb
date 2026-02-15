/**
 * PostJobStep3Description — Step 3 of the "Post a Job" wizard.
 *
 * The client writes a detailed description of the work: scope, deliverables,
 * timeline, tools, etc.  A well-written description attracts higher-quality
 * proposals, so a tips card coaches the user on what to include.
 *
 * Validation:
 *   - Trimmed length must be >= 20 and <= 5000 (matching backend Job schema).
 *   - Next is disabled until valid.
 *
 * Draft persistence:
 *   - On mount, restores draft.description from localStorage.
 *   - On Next, merges description into the existing draft and navigates
 *     to /client/post-job/scope (Step 4).
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PostJobLayout from './PostJobLayout'

/* ── Constants ─────────────────────────────────────────────────────────── */

const DRAFT_KEY = 'postJobDraft'
const MIN_DESC_LENGTH = 20
const MAX_DESC_LENGTH = 5000

/* ── Component ─────────────────────────────────────────────────────────── */

const PostJobStep3Description = () => {
  const navigate = useNavigate()
  const [description, setDescription] = useState('')

  /* ---- Restore draft on mount ---- */
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      if (draft.description) {
        setDescription(draft.description)
      }
    } catch {
      /* corrupt draft — start fresh */
    }
  }, [])

  /* ---- Derived validation state ---- */
  const trimmedLength = description.trim().length
  const isValid = trimmedLength >= MIN_DESC_LENGTH && trimmedLength <= MAX_DESC_LENGTH

  /* ---- Character-count colour class ---- */
  const charCountClass =
    trimmedLength > MAX_DESC_LENGTH
      ? 'wizard-char-count at-limit'
      : trimmedLength > MAX_DESC_LENGTH - 200
        ? 'wizard-char-count near-limit'
        : 'wizard-char-count'

  /* ---- Handlers ---- */

  const handleNext = () => {
    if (!isValid) return

    try {
      const existing = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...existing, description: description.trim() })
      )
    } catch {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ description: description.trim() })
      )
    }

    navigate('/client/post-job/scope')
  }

  const handleBack = () => {
    navigate('/client/post-job/skills')
  }

  /* ---- Render ---- */
  return (
    <PostJobLayout
      stepNumber={3}
      totalSteps={6}
      stepTitle="Job post"
      nextLabel="Next: Scope"
      onNext={handleNext}
      nextDisabled={!isValid}
      onBack={handleBack}
    >
      <div className="wizard-two-col">
        {/* ── Left column ── */}
        <div className="wizard-left-col">
          <h1>Start the conversation.</h1>
          <p>
            A detailed description helps freelancers understand your vision
            and decide whether they're the right fit. The more context you
            share, the better proposals you'll receive.
          </p>
        </div>

        {/* ── Right column ── */}
        <div className="wizard-right-col">
          {/* Textarea */}
          <div>
            <label className="wizard-label" htmlFor="job-description-input">
              Describe your job
            </label>

            <textarea
              id="job-description-input"
              className="wizard-textarea"
              placeholder={
                'Example:\n\n' +
                'We\'re building an e-commerce platform and need a developer to:\n' +
                '• Implement product listing pages with filters\n' +
                '• Integrate Stripe for payments\n' +
                '• Build an admin dashboard for order management\n\n' +
                'Timeline: ~4 weeks\n' +
                'Tools: React, Node.js, PostgreSQL'
              }
              
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESC_LENGTH}
              autoFocus
            />

            <p className={charCountClass}>
              {trimmedLength < MIN_DESC_LENGTH && trimmedLength > 0
                ? `At least ${MIN_DESC_LENGTH} characters needed · `
                : ''}
              {trimmedLength}/{MAX_DESC_LENGTH}
            </p>
          </div>

          {/* Tips card */}
          <div className="wizard-examples-card">
            <h4>Tips for a great description</h4>
            <ul className="wizard-examples-list">
              <li>
                Define clear deliverables — what exactly should be handed off at the end?
              </li>
              <li>
                Mention your timeline or deadline so freelancers can plan their schedule.
              </li>
              <li>
                List the tools, frameworks, or platforms involved (e.g. React, Figma, AWS).
              </li>
              <li>
                Include context about your project or company to attract the right talent.
              </li>
              <li>
                Note any must-have requirements vs. nice-to-haves to set expectations.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PostJobLayout>
  )
}

export default PostJobStep3Description
