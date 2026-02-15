/**
 * PostJobStep5Budget — Step 5 of the "Post a Job" wizard.
 *
 * The client chooses a payment type (hourly or fixed-price) and then
 * enters the corresponding budget figures.
 *
 * Two selectable glass cards present the payment type.  Once a type is
 * picked, a conditional input section slides in:
 *   - Hourly  → min/max rate range  ($/hr)
 *   - Fixed   → single total budget ($)
 *
 * Validation:
 *   - A payment type must be selected.
 *   - All visible number inputs must be > 0.
 *   - For hourly, min must be <= max.
 *
 * Draft persistence:
 *   - On mount, restores paymentType, hourlyMin, hourlyMax, fixedBudget.
 *   - On Next, merges those plus a computed `budget` field (used by the
 *     backend Job model) into the existing draft.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PostJobLayout from './PostJobLayout'

/* ── Constants ─────────────────────────────────────────────────────────── */

const DRAFT_KEY = 'postJobDraft'

/* ── Component ─────────────────────────────────────────────────────────── */

const PostJobStep5Budget = () => {
  const navigate = useNavigate()

  /* ---- State ---- */
  const [paymentType, setPaymentType] = useState('')   // "hourly" | "fixed"
  const [hourlyMin, setHourlyMin] = useState('')
  const [hourlyMax, setHourlyMax] = useState('')
  const [fixedBudget, setFixedBudget] = useState('')

  /* ---- Restore draft on mount ---- */
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      if (draft.paymentType) setPaymentType(draft.paymentType)
      if (draft.hourlyMin !== undefined && draft.hourlyMin !== '') setHourlyMin(String(draft.hourlyMin))
      if (draft.hourlyMax !== undefined && draft.hourlyMax !== '') setHourlyMax(String(draft.hourlyMax))
      if (draft.fixedBudget !== undefined && draft.fixedBudget !== '') setFixedBudget(String(draft.fixedBudget))
    } catch {
      /* corrupt draft — start fresh */
    }
  }, [])

  /* ---- Derived validation ---- */
  const hourlyMinNum = parseFloat(hourlyMin)
  const hourlyMaxNum = parseFloat(hourlyMax)
  const fixedNum = parseFloat(fixedBudget)

  const isHourlyValid =
    paymentType === 'hourly' &&
    hourlyMin !== '' &&
    hourlyMax !== '' &&
    hourlyMinNum > 0 &&
    hourlyMaxNum > 0 &&
    hourlyMinNum <= hourlyMaxNum

  const isFixedValid =
    paymentType === 'fixed' &&
    fixedBudget !== '' &&
    fixedNum > 0

  const isValid =
    paymentType === 'hourly' ? isHourlyValid :
    paymentType === 'fixed'  ? isFixedValid  :
    false

  /* ---- Handlers ---- */

  const handleNext = () => {
    if (!isValid) return

    /* Compute the budget value the backend expects (a single number).
       For hourly we use the minimum rate; for fixed it's the total. */
    const budget = paymentType === 'fixed' ? fixedNum : hourlyMinNum

    try {
      const existing = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ...existing,
          paymentType,
          hourlyMin: hourlyMinNum || '',
          hourlyMax: hourlyMaxNum || '',
          fixedBudget: fixedNum || '',
          budget,
        })
      )
    } catch {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ paymentType, hourlyMin: hourlyMinNum, hourlyMax: hourlyMaxNum, fixedBudget: fixedNum, budget })
      )
    }

    navigate('/client/post-job/review')
  }

  const handleBack = () => {
    navigate('/client/post-job/scope')
  }

  /* ---- Render ---- */
  return (
    <PostJobLayout
      stepNumber={5}
      totalSteps={6}
      stepTitle="Job post"
      nextLabel="Review Job Post"
      onNext={handleNext}
      nextDisabled={!isValid}
      onBack={handleBack}
    >
      <div className="wizard-two-col">
        {/* ── Left column ── */}
        <div className="wizard-left-col">
          <h1>Tell us about your budget.</h1>
          <p>
            This helps freelancers know what to expect. You can always
            negotiate the final terms once you start receiving proposals.
          </p>
        </div>

        {/* ── Right column ── */}
        <div className="wizard-right-col">
          {/* Payment type cards */}
          <div className="budget-cards-row">
            {/* Hourly card */}
            <button
              type="button"
              className={`budget-card ${paymentType === 'hourly' ? 'selected' : ''}`}
              onClick={() => setPaymentType('hourly')}
            >
              <span className="budget-card-radio" />
              <span className="budget-card-icon">⏱</span>
              <span className="budget-card-title">Hourly rate</span>
              <span className="budget-card-desc">
                Pay by the hour — great for ongoing or evolving work.
              </span>
            </button>

            {/* Fixed card */}
            <button
              type="button"
              className={`budget-card ${paymentType === 'fixed' ? 'selected' : ''}`}
              onClick={() => setPaymentType('fixed')}
            >
              <span className="budget-card-radio" />
              <span className="budget-card-icon">💰</span>
              <span className="budget-card-title">Project budget</span>
              <span className="budget-card-desc">
                Set a total price — ideal for well-defined deliverables.
              </span>
            </button>
          </div>

          {/* Conditional inputs based on payment type */}
          {paymentType === 'hourly' && (
            <div className="budget-input-section">
              <span className="wizard-label">Set your hourly rate range</span>
              <div className="budget-range-row">
                <div className="budget-field">
                  <span className="budget-field-prefix">$</span>
                  <input
                    type="number"
                    className="wizard-input budget-number-input"
                    placeholder="Min"
                    value={hourlyMin}
                    onChange={(e) => setHourlyMin(e.target.value)}
                    min="0"
                    step="any"
                  />
                </div>
                <span className="budget-range-divider">–</span>
                <div className="budget-field">
                  <span className="budget-field-prefix">$</span>
                  <input
                    type="number"
                    className="wizard-input budget-number-input"
                    placeholder="Max"
                    value={hourlyMax}
                    onChange={(e) => setHourlyMax(e.target.value)}
                    min="0"
                    step="any"
                  />
                </div>
                <span className="budget-range-suffix">/hour</span>
              </div>
              {/* Inline validation hint */}
              {hourlyMin !== '' && hourlyMax !== '' && hourlyMinNum > hourlyMaxNum && (
                <p className="budget-error">Minimum rate can't exceed maximum.</p>
              )}
            </div>
          )}

          {paymentType === 'fixed' && (
            <div className="budget-input-section">
              <span className="wizard-label">What is the total budget for this project?</span>
              <div className="budget-field budget-field-wide">
                <span className="budget-field-prefix">$</span>
                <input
                  type="number"
                  className="wizard-input budget-number-input"
                  placeholder="e.g. 2500"
                  value={fixedBudget}
                  onChange={(e) => setFixedBudget(e.target.value)}
                  min="0"
                  step="any"
                />
              </div>
            </div>
          )}

          {/* Helpful tip */}
          {paymentType && (
            <div className="wizard-examples-card">
              <h4>
                {paymentType === 'hourly' ? 'Hourly rate tips' : 'Fixed budget tips'}
              </h4>
              <ul className="wizard-examples-list">
                {paymentType === 'hourly' ? (
                  <>
                    <li>Entry-level freelancers typically charge $15–$35/hr.</li>
                    <li>Intermediate professionals range from $35–$75/hr.</li>
                    <li>Expert-level specialists may charge $75–$150+/hr.</li>
                    <li>A wider range attracts more proposals to choose from.</li>
                  </>
                ) : (
                  <>
                    <li>Break down the scope into milestones for easier payment tracking.</li>
                    <li>Include a buffer of 10–15% for scope changes or revisions.</li>
                    <li>Compare similar projects on the platform to calibrate your budget.</li>
                    <li>A competitive budget attracts higher-quality proposals faster.</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </PostJobLayout>
  )
}

export default PostJobStep5Budget
