import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './ClientApplicationsPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const DEFAULT_MESSAGES = {
  accepted: (jobTitle, freelancerName) =>
    `Hi ${freelancerName},\n\nWe're thrilled to let you know that your application for "${jobTitle}" has been accepted! We were impressed by your profile and look forward to working with you.\n\nWe'll be in touch shortly with next steps.\n\nBest regards`,
  rejected: (jobTitle, freelancerName) =>
    `Hi ${freelancerName},\n\nThank you for taking the time to apply for "${jobTitle}". After careful consideration, we've decided to move forward with another candidate.\n\nWe appreciate your interest and encourage you to apply for future opportunities.\n\nBest regards`,
}

const ClientApplicationsPage = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  // Message modal state
  const [modal, setModal] = useState(null) // { applicationId, status, message, freelancerName }

  const getUserName = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.name?.split(' ')[0] || user.firstName || 'Client'
      }
    } catch (err) {
      console.error('Error loading user:', err)
    }
    return 'Client'
  }

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      try {
        const [jobRes, appsRes] = await Promise.all([
          fetch(`${API_BASE}/api/client/jobs/${jobId}`, { credentials: 'include', headers }),
          fetch(`${API_BASE}/api/applications/job/${jobId}`, { credentials: 'include', headers }),
        ])

        const jobData = await jobRes.json()
        const appsData = await appsRes.json()

        if (jobData.success) setJob(jobData.job)
        if (appsData.success) setApplications(appsData.applications)
        if (!jobData.success) setError(jobData.message || 'Failed to load job')
      } catch (err) {
        console.error('Error fetching applications:', err)
        setError('Network error — make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [jobId])

  // Open the message modal before confirming accept/reject
  const openModal = (applicationId, status) => {
    const app = applications.find(a => a._id === applicationId)
    const freelancerName = app?.freelancerId?.name || 'there'
    const jobTitle = job?.title || 'this job'
    setModal({
      applicationId,
      status,
      message: DEFAULT_MESSAGES[status](jobTitle, freelancerName),
      freelancerName,
    })
  }

  const closeModal = () => setModal(null)

  const confirmStatusUpdate = async () => {
    if (!modal) return
    const { applicationId, status, message } = modal
    setUpdatingId(applicationId)
    closeModal()
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ status, statusMessage: message }),
      })
      const data = await res.json()
      if (data.success) {
        setApplications(prev =>
          prev.map(app =>
            app._id === applicationId ? { ...app, status, statusMessage: message } : app
          )
        )
      }
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Shortlist doesn't need a message modal
  const updateStatus = async (applicationId, status) => {
    setUpdatingId(applicationId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        setApplications(prev =>
          prev.map(app => app._id === applicationId ? { ...app, status } : app)
        )
      }
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const aiScoreColor = (score) => {
    if (score >= 70) return '#10b981'
    if (score >= 40) return '#fbbf24'
    return '#f87171'
  }

  const aiScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match'
    if (score >= 60) return 'Good Match'
    if (score >= 40) return 'Fair Match'
    return 'Low Match'
  }

  const atsGradeColor = (grade) => {
    if (grade === 'A') return '#10b981'
    if (grade === 'B') return '#34d399'
    if (grade === 'C') return '#fbbf24'
    if (grade === 'D') return '#f97316'
    return '#f87171'
  }

  const BREAKDOWN_MAX = {
    'Section Completeness': 25,
    'Keyword Density': 25,
    'Quantified Impact': 20,
    'Action Verbs': 15,
    'Readability': 10,
    'Contact Info': 5,
  }

  const parseFeedback = (items) =>
    items.map((item) => ({
      text: item.replace(/^[✅❌]\s*/, '').trim(),
      positive: item.startsWith('✅'),
    }))

  const statusBadge = (status) => {
    const map = {
      pending: 'badge-pending',
      shortlisted: 'badge-shortlisted',
      accepted: 'badge-accepted',
      rejected: 'badge-rejected',
      withdrawn: 'badge-withdrawn',
    }
    return `app-status-badge ${map[status] || ''}`
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })

  const acceptedCount = applications.filter(a => a.status === 'accepted').length

  if (loading) {
    return (
      <div className="client-apps-page">
        <TopNav userName={getUserName()} />
        <div className="client-apps-container">
          <p className="client-apps-loading">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="client-apps-page">
      <TopNav userName={getUserName()} />
      <div className="client-apps-container">
        <button className="client-apps-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="client-apps-header">
          <h1 className="client-apps-title">
            Applications{job ? ` for "${job.title}"` : ''}
          </h1>
          <span className="client-apps-count">
            {applications.length} application{applications.length !== 1 ? 's' : ''}
          </span>
          {acceptedCount > 0 && (
            <button
              className="create-project-btn"
              onClick={() => navigate('/client/projects/new', { state: { jobId, jobTitle: job?.title } })}
            >
              + Create Project ({acceptedCount} accepted)
            </button>
          )}
        </div>

        {error && <p className="client-apps-error">{error}</p>}

        {applications.length === 0 && !error ? (
          <div className="client-apps-empty">
            <p>No applications have been submitted for this job yet.</p>
          </div>
        ) : (
          <div className="client-apps-list">
            {applications.map((app) => {
              const freelancer = app.freelancerId || {}
              const isExpanded = expandedId === app._id

              return (
                <div key={app._id} className="app-card">
                  <div
                    className="app-card-header"
                    onClick={() => setExpandedId(isExpanded ? null : app._id)}
                  >
                    <div className="app-card-left">
                      <div className="app-avatar">
                        {(freelancer.name || 'F').charAt(0).toUpperCase()}
                      </div>
                      <div className="app-info">
                        <span className="app-name">{freelancer.name || 'Unknown Freelancer'}</span>
                        <span className="app-email">{freelancer.email || ''}</span>
                      </div>
                    </div>
                    <div className="app-card-right">
                      {app.atsGrade && (
                        <div className="app-ats-grade-badge" style={{ '--ats-color': atsGradeColor(app.atsGrade) }}>
                          <span className="app-ats-grade-val" style={{ color: atsGradeColor(app.atsGrade) }}>{app.atsGrade}</span>
                        </div>
                      )}
                      {app.aiScore != null ? (
                        <div className="ai-score-badge" style={{ '--ai-color': aiScoreColor(app.aiScore) }}>
                          <span className="ai-score-value" style={{ color: aiScoreColor(app.aiScore) }}>{app.aiScore}</span>
                        </div>
                      ) : (
                        <span className="ai-score-pending">...</span>
                      )}
                      <span className={statusBadge(app.status)}>{app.status}</span>
                      <span className="app-date">{formatDate(app.createdAt)}</span>
                      <span className={`app-expand-icon ${isExpanded ? 'open' : ''}`}>▾</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="app-card-body">
                      {app.coverLetter && (
                        <div className="app-section">
                          <h4 className="app-section-title">Cover Letter</h4>
                          <p className="app-section-text">{app.coverLetter}</p>
                        </div>
                      )}

                      {app.answers?.length > 0 && (
                        <div className="app-section">
                          <h4 className="app-section-title">Screening Answers</h4>
                          <div className="app-answers">
                            {app.answers.map((a, i) => (
                              <div key={i} className="app-answer">
                                <span className="app-answer-q">{a.questionText}</span>
                                <span className="app-answer-a">{String(a.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="app-meta-row">
                        {app.proposedBudget != null && (
                          <div className="app-meta-item">
                            <span className="app-meta-label">Budget</span>
                            <span className="app-meta-value">${app.proposedBudget}</span>
                          </div>
                        )}
                        {app.proposedTimelineDays != null && (
                          <div className="app-meta-item">
                            <span className="app-meta-label">Timeline</span>
                            <span className="app-meta-value">{app.proposedTimelineDays} days</span>
                          </div>
                        )}
                      </div>

                      {/* Status message sent by client */}
                      {app.statusMessage && (app.status === 'accepted' || app.status === 'rejected') && (
                        <div className={`app-status-message ${app.status === 'accepted' ? 'status-msg-accept' : 'status-msg-reject'}`}>
                          <span className="app-status-msg-label">
                            {app.status === 'accepted' ? '✓ Acceptance message sent' : '✕ Rejection message sent'}
                          </span>
                          <p className="app-status-msg-text">{app.statusMessage}</p>
                        </div>
                      )}

                      {/* AI Profile Analysis Section */}
                      {app.aiScore != null && (
                        <div className="ai-analysis-section">
                          <h4 className="app-section-title">Profile Analysis</h4>
                          <div className="ai-analysis-header">
                            <span className="ai-analysis-score" style={{ color: aiScoreColor(app.aiScore) }}>
                              {app.aiScore}/100
                            </span>
                            <span className="ai-analysis-label" style={{ color: aiScoreColor(app.aiScore) }}>
                              {aiScoreLabel(app.aiScore)}
                            </span>
                          </div>
                          {app.aiStrengths?.length > 0 && (
                            <div className="ai-analysis-list">
                              {app.aiStrengths.map((s, i) => (
                                <div key={i} className="ai-analysis-item ai-analysis-item--strength">
                                  <span className="ai-item-icon">✓</span>
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {app.aiWeaknesses?.length > 0 && (
                            <div className="ai-analysis-list">
                              {app.aiWeaknesses.map((w, i) => (
                                <div key={i} className="ai-analysis-item ai-analysis-item--weakness">
                                  <span className="ai-item-icon">!</span>
                                  <span>{w}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ATS CV Analysis Section */}
                      {app.atsScore != null && (
                        <div className="app-ats-section">
                          <h4 className="app-section-title">CV Analysis (ATS)</h4>
                          <div className="app-ats-header">
                            <span className="app-ats-score" style={{ color: atsGradeColor(app.atsGrade) }}>
                              {app.atsScore}/100
                            </span>
                            <span className="app-ats-grade" style={{ color: atsGradeColor(app.atsGrade) }}>
                              Grade {app.atsGrade}
                            </span>
                            {app.atsCategory && (
                              <span className="app-ats-category">{app.atsCategory}</span>
                            )}
                            {app.atsConfidence != null && (
                              <span className="app-ats-confidence">
                                {Math.round(app.atsConfidence * 100)}% confidence
                              </span>
                            )}
                          </div>

                          {app.atsBreakdown && (
                            <div className="app-ats-breakdown">
                              {Object.entries(app.atsBreakdown).map(([key, score]) => {
                                const max = BREAKDOWN_MAX[key] || 25
                                const pct = Math.min((score / max) * 100, 100)
                                const fillColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#fbbf24' : '#f87171'
                                return (
                                  <div key={key} className="app-ats-bar-row">
                                    <span className="app-ats-bar-label">{key}</span>
                                    <div className="app-ats-bar-track">
                                      <div
                                        className="app-ats-bar-fill"
                                        style={{ width: `${pct}%`, background: fillColor }}
                                      />
                                    </div>
                                    <span className="app-ats-bar-val">{score}/{max}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {app.atsFeedback?.length > 0 && (
                            <div className="ai-analysis-list">
                              {parseFeedback(app.atsFeedback).map((item, i) => (
                                <div
                                  key={i}
                                  className={`ai-analysis-item ${item.positive ? 'ai-analysis-item--strength' : 'ai-analysis-item--weakness'}`}
                                >
                                  <span className="ai-item-icon">{item.positive ? '✓' : '!'}</span>
                                  <span>{item.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {app.status === 'pending' && (
                        <div className="app-actions">
                          <button
                            className="app-action-btn accept"
                            disabled={updatingId === app._id}
                            onClick={() => openModal(app._id, 'accepted')}
                          >
                            {updatingId === app._id ? '...' : 'Accept'}
                          </button>
                          <button
                            className="app-action-btn reject"
                            disabled={updatingId === app._id}
                            onClick={() => openModal(app._id, 'rejected')}
                          >
                            {updatingId === app._id ? '...' : 'Reject'}
                          </button>
                          <button
                            className="app-action-btn shortlist"
                            disabled={updatingId === app._id}
                            onClick={() => updateStatus(app._id, 'shortlisted')}
                          >
                            {updatingId === app._id ? '...' : 'Shortlist'}
                          </button>
                        </div>
                      )}

                      {app.status === 'shortlisted' && (
                        <div className="app-actions">
                          <button
                            className="app-action-btn accept"
                            disabled={updatingId === app._id}
                            onClick={() => openModal(app._id, 'accepted')}
                          >
                            {updatingId === app._id ? '...' : 'Accept'}
                          </button>
                          <button
                            className="app-action-btn reject"
                            disabled={updatingId === app._id}
                            onClick={() => openModal(app._id, 'rejected')}
                          >
                            {updatingId === app._id ? '...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Accept / Reject message modal */}
      {modal && (
        <div className="status-modal-overlay" onClick={closeModal}>
          <div className="status-modal" onClick={e => e.stopPropagation()}>
            <h3 className="status-modal-title">
              {modal.status === 'accepted' ? '✓ Accept Applicant' : '✕ Reject Applicant'}
            </h3>
            <p className="status-modal-subtitle">
              Customize the message that will be sent to {modal.freelancerName}.
            </p>
            <textarea
              className="status-modal-textarea"
              value={modal.message}
              onChange={e => setModal(prev => ({ ...prev, message: e.target.value }))}
              rows={8}
            />
            <div className="status-modal-actions">
              <button className="status-modal-cancel" onClick={closeModal}>Cancel</button>
              <button
                className={`status-modal-confirm ${modal.status === 'accepted' ? 'confirm-accept' : 'confirm-reject'}`}
                onClick={confirmStatusUpdate}
              >
                {modal.status === 'accepted' ? 'Accept & Send' : 'Reject & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientApplicationsPage
