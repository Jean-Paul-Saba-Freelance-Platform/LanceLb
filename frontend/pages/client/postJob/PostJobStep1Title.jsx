/**
 * PostJobStep1Title — Step 1 of the "Post a Job" wizard.
 *
 * The client enters a job title that will appear as the headline of their
 * listing.  The title must be at least 5 characters (trimmed) before the
 * user can proceed.
 *
 * On "Next" the title is persisted into localStorage under the key
 * "postJobDraft" (merged with any fields that later steps may have saved)
 * so the draft survives page refreshes and the browser back button.
 *
 * On mount, any previously saved title is restored into the input so the
 * user can pick up where they left off.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PostJobLayout from './PostJobLayout'

const DRAFT_KEY = 'postJobDraft'
const MIN_TITLE_LENGTH = 5
const MAX_TITLE_LENGTH = 120

const PostJobStep1Title = () => {
  const navigate = useNavigate()
  const [jobTitle, setJobTitle] = useState('')

  /* ----- Restore draft on mount ----- */
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      if (draft.title) {
        setJobTitle(draft.title)
      }
    } catch {
      /* corrupt draft — ignore */
    }
  }, [])

  /* ----- Derived validation state ----- */
  const trimmedLength = jobTitle.trim().length
  const isValid = trimmedLength >= MIN_TITLE_LENGTH

  /* ----- Character count colour class ----- */
  const charCountClass =
    trimmedLength > MAX_TITLE_LENGTH
      ? 'wizard-char-count at-limit'
      : trimmedLength > MAX_TITLE_LENGTH - 20
        ? 'wizard-char-count near-limit'
        : 'wizard-char-count'

  /* ----- Handlers ----- */

  const handleNext = () => {
    if (!isValid) return

    /* Merge title into the existing draft so we don't overwrite fields
       saved by other steps (skills, budget, etc.) */
    try {
      const existing = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...existing, title: jobTitle.trim() })
      )
    } catch {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title: jobTitle.trim() })
      )
    }

    navigate('/client/post-job/skills')
  }

  const handleBack = () => {
    navigate('/client/home')
  }

  /* ----- Render ----- */

  return (
    <PostJobLayout
      stepNumber={1}
      totalSteps={6}
      stepTitle="Job post"
      nextLabel="Next: Skills"
      onNext={handleNext}
      nextDisabled={!isValid}
      onBack={handleBack}
      onClose={() => navigate('/client/home')}
    >
      <div className="wizard-two-col">
        {/* Left column — motivational heading + helper copy */}
        <div className="wizard-left-col">
          <h1>Let's start with a strong title.</h1>
          <p>
            This helps your job post stand out to the right candidates.
            It's the first thing they'll see, so make it count!
          </p>
        </div>

        {/* Right column — title input + examples */}
        <div className="wizard-right-col">
          <div>
            <label className="wizard-label" htmlFor="job-title-input">
              Write a title for your job post
            </label>
            <input
              id="job-title-input"
              className="wizard-input"
              type="text"
              placeholder="e.g. Full-Stack Developer for E-Commerce Platform"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              autoFocus
            />
            <p className={charCountClass}>
              {trimmedLength}/{MAX_TITLE_LENGTH}
            </p>
          </div>

          {/* Example titles card */}
          <div className="wizard-examples-card">
            <h4>Example titles</h4>
            <ul className="wizard-examples-list">
              <li>Build a responsive WordPress site with booking functionality</li>
              <li>Create a mobile app UI/UX design for a fitness platform</li>
              <li>Develop a REST API with Node.js and MongoDB</li>
              <li>Design a brand identity package for a tech startup</li>
            </ul>
          </div>
        </div>
      </div>
    </PostJobLayout>
  )
}

export default PostJobStep1Title
