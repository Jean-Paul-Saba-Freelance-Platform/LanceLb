import React, { useEffect, useRef } from 'react'
import './ConfirmDeleteModal.css'

const ConfirmDeleteModal = ({
  open,
  title = 'Delete job?',
  body = 'This will permanently remove this job post. This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) => {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onCancel()
  }

  return (
    <div className="cdm-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="cdm-modal">
        <h2 className="cdm-title">{title}</h2>
        <p className="cdm-body">{body}</p>

        {error && (
          <div className="cdm-error">
            <span>{error}</span>
          </div>
        )}

        <div className="cdm-actions">
          <button
            type="button"
            className="cdm-btn cdm-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="cdm-btn cdm-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <span className="cdm-spinner" />}
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal
