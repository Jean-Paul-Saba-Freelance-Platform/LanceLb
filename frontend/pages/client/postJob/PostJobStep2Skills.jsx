/**
 * PostJobStep2Skills — Step 2 of the "Post a Job" wizard.
 *
 * The client searches for or types in skills that the job requires.
 * Skills are shown as removable chips.  A curated "Popular skills"
 * section offers one-click additions for the most common tags.
 *
 * Validation:
 *   - At least 1 skill is required before Next is enabled.
 *   - Maximum 30 skills (matching the backend Job schema validator).
 *   - Duplicates are blocked (case-insensitive comparison).
 *   - Each skill string is trimmed; empty strings are rejected.
 *
 * Draft persistence:
 *   - On mount, any previously saved requiredSkills[] are restored.
 *   - On Next, skills are merged into the localStorage "postJobDraft"
 *     object so they survive refreshes and coexist with other steps.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PostJobLayout from './PostJobLayout'

/* ── Constants ─────────────────────────────────────────────────────────── */

const DRAFT_KEY = 'postJobDraft'
const MAX_SKILLS = 30

/** Predefined popular skills shown below the input for quick selection */
const POPULAR_SKILLS = [
  'React',
  'Node.js',
  'MongoDB',
  'CSS',
  'HTML',
  'JavaScript',
  'TypeScript',
  'Python',
  'Figma',
  'WordPress',
  'AWS',
  'PostgreSQL',
]

/* ── Helpers ───────────────────────────────────────────────────────────── */

/**
 * Case-insensitive check for whether `skill` already exists in the array.
 * Returns true when the skill is already present.
 */
const isDuplicate = (skill, list) =>
  list.some((s) => s.toLowerCase() === skill.toLowerCase())

/* ── Component ─────────────────────────────────────────────────────────── */

const PostJobStep2Skills = () => {
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [skills, setSkills] = useState([])
  const [inputValue, setInputValue] = useState('')

  /* ---- Restore draft on mount ---- */
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      if (Array.isArray(draft.requiredSkills) && draft.requiredSkills.length) {
        setSkills(draft.requiredSkills)
      }
    } catch {
      /* corrupt draft — start fresh */
    }
  }, [])

  /* ---- Derived state ---- */
  const isValid = skills.length >= 1
  const isAtLimit = skills.length >= MAX_SKILLS

  /* ---- Add a skill (shared logic for input + popular click) ---- */
  const addSkill = (raw) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    if (isAtLimit) return
    if (isDuplicate(trimmed, skills)) return

    setSkills((prev) => [...prev, trimmed])
    setInputValue('')
    inputRef.current?.focus()
  }

  /* ---- Remove a skill by index ---- */
  const removeSkill = (index) => {
    setSkills((prev) => prev.filter((_, i) => i !== index))
  }

  /* ---- Keyboard handler on the input ---- */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill(inputValue)
    }
  }

  /* ---- Navigation handlers ---- */
  const handleNext = () => {
    if (!isValid) return

    try {
      const existing = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...existing, requiredSkills: skills })
      )
    } catch {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ requiredSkills: skills })
      )
    }

    navigate('/client/post-job/description')
  }

  const handleBack = () => {
    navigate('/client/post-job/title')
  }

  /* ---- Render ---- */
  return (
    <PostJobLayout
      stepNumber={2}
      totalSteps={6}
      stepTitle="Job post"
      nextLabel="Next: Description"
      onNext={handleNext}
      nextDisabled={!isValid}
      onBack={handleBack}
      onClose={() => navigate('/client/home')}
    >
      <div className="wizard-two-col">
        {/* ── Left column ── */}
        <div className="wizard-left-col">
          <h1>What are the main skills required for your work?</h1>
          <p>
            Adding the right skills helps your job post appear in relevant
            search results and attracts freelancers who are the best fit.
          </p>
        </div>

        {/* ── Right column ── */}
        <div className="wizard-right-col">
          {/* Input row */}
          <div>
            <label className="wizard-label" htmlFor="skill-input">
              Search or add skills
            </label>

            <div className="skills-input-row">
              <input
                ref={inputRef}
                id="skill-input"
                className="wizard-input skills-input-field"
                type="text"
                placeholder="e.g. React, Node.js, Figma…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAtLimit}
                autoFocus
              />
              <button
                type="button"
                className="skills-add-btn"
                onClick={() => addSkill(inputValue)}
                disabled={!inputValue.trim() || isAtLimit}
              >
                Add
              </button>
            </div>

            <p className="skills-helper-text">
              {isAtLimit
                ? `Maximum of ${MAX_SKILLS} skills reached`
                : `For best results, add 3–5 skills  ·  ${skills.length}/${MAX_SKILLS}`}
            </p>
          </div>

          {/* Selected skills chips */}
          {skills.length > 0 && (
            <div className="skills-chips-section">
              <span className="skills-chips-label">Selected skills</span>
              <div className="skills-chips-wrap">
                {skills.map((skill, idx) => (
                  <span key={`${skill}-${idx}`} className="skill-chip">
                    <span className="skill-chip-text">{skill}</span>
                    <button
                      type="button"
                      className="skill-chip-remove"
                      onClick={() => removeSkill(idx)}
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Popular skills quick-add */}
          <div className="wizard-examples-card">
            <h4>Popular skills</h4>
            <div className="skills-popular-wrap">
              {POPULAR_SKILLS.map((skill) => {
                const alreadyAdded = isDuplicate(skill, skills)
                return (
                  <button
                    key={skill}
                    type="button"
                    className={`skill-popular-btn ${alreadyAdded ? 'added' : ''}`}
                    onClick={() => addSkill(skill)}
                    disabled={alreadyAdded || isAtLimit}
                  >
                    {alreadyAdded ? '✓ ' : '+ '}
                    {skill}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </PostJobLayout>
  )
}

export default PostJobStep2Skills
