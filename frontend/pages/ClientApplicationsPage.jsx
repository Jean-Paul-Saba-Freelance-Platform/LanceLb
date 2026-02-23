import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './ClientApplicationsPage.css'

const API_BASE = 'http://127.0.0.1:4000'

const ClientApplicationsPage = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

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
          prev.map(app =>
            app._id === applicationId ? { ...app, status } : app
          )
        )
      }
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

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

                      {app.status === 'pending' && (
                        <div className="app-actions">
                          <button
                            className="app-action-btn accept"
                            disabled={updatingId === app._id}
                            onClick={() => updateStatus(app._id, 'accepted')}
                          >
                            {updatingId === app._id ? '...' : 'Accept'}
                          </button>
                          <button
                            className="app-action-btn reject"
                            disabled={updatingId === app._id}
                            onClick={() => updateStatus(app._id, 'rejected')}
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
                            onClick={() => updateStatus(app._id, 'accepted')}
                          >
                            {updatingId === app._id ? '...' : 'Accept'}
                          </button>
                          <button
                            className="app-action-btn reject"
                            disabled={updatingId === app._id}
                            onClick={() => updateStatus(app._id, 'rejected')}
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
    </div>
  )
}

export default ClientApplicationsPage
