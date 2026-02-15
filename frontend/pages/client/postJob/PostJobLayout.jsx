/**
 * PostJobLayout — Shared wizard shell for the multi-step "Post a Job" flow.
 *
 * Renders three zones that persist across every step:
 *   1. Sticky header  → step counter ("1/5"), label, and a thin progress bar.
 *   2. Scrollable body → the step-specific content injected via `children`.
 *   3. Sticky footer  → Back and Next buttons with configurable labels / state.
 *
 * This component is purely presentational — it owns no routing or form state.
 * Each step page composes it and passes the props it needs.
 *
 * Props:
 *   stepNumber   (number)   — Current step (1-based).
 *   totalSteps   (number)   — Total steps in the wizard (default 5).
 *   stepTitle    (string)   — Label shown next to the step badge (default "Job post").
 *   children     (node)     — Step-specific content.
 *   nextLabel    (string)   — Text for the Next button (e.g. "Next: Skills").
 *   onNext       (function) — Called when Next is clicked.
 *   nextDisabled (boolean)  — When true the Next button is greyed out.
 *   onBack       (function) — Called when Back is clicked. If omitted, Back hides.
 */

import React from 'react'
import './PostJobLayout.css'

const PostJobLayout = ({
  stepNumber,
  totalSteps = 5,
  stepTitle = 'Job post',
  children,
  nextLabel = 'Next',
  onNext,
  nextDisabled = false,
  onBack,
}) => {
  /* Progress percentage drives the thin bar width */
  const progress = (stepNumber / totalSteps) * 100

  return (
    <div className="wizard-page">
      {/* ---- Header: step indicator + progress bar ---- */}
      <header className="wizard-header">
        <div className="wizard-header-inner">
          <span className="wizard-step-badge">
            {stepNumber}/{totalSteps}
          </span>
          <span className="wizard-step-label">{stepTitle}</span>
        </div>

        {/* Thin progress bar that fills proportionally */}
        <div className="wizard-progress-track">
          <div
            className="wizard-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ---- Body: step-specific content ---- */}
      <main className="wizard-body">{children}</main>

      {/* ---- Footer: Back / Next buttons ---- */}
      <footer className="wizard-footer">
        <div className="wizard-footer-inner">
          {/* Back button — renders an invisible spacer when onBack is absent
              so that Next stays right-aligned via justify-content: space-between */}
          {onBack ? (
            <button
              type="button"
              className="wizard-back-btn"
              onClick={onBack}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            className="wizard-next-btn"
            onClick={onNext}
            disabled={nextDisabled}
          >
            {nextLabel}
          </button>
        </div>
      </footer>
    </div>
  )
}

export default PostJobLayout
