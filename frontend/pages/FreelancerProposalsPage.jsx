import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './FreelancerProposalsPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

function stripEmoji(str) {
  if (!str) return str
  return str.replace(/[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2702}-\u{27B0}]|[\uFE00-\uFEFF]/gu, '').replace(/\s+/g, ' ').trim()
}

const FreelancerProposalsPage = () => {
  const navigate = useNavigate()

  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [expandedId, setExpandedId]     = useState(null)
  const [withdrawingId, setWithdrawingId] = useState(null)

  const getUserName = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.name?.split(' ')[0] || 'Freelancer'
    } catch { return 'Freelancer' }
  }

  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem('token')
      try {
        const res  = await fetch(`${API_BASE}/api/applications/mine`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        if (data.success) setApplications(data.applications)
        else setError(data.message || 'Failed to load proposals')
      } catch {
        setError('Network error — make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

  const withdraw = async (appId) => {
    if (!window.confirm('Withdraw this application?')) return
    setWithdrawingId(appId)
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch(`${API_BASE}/api/applications/${appId}/status`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'withdrawn' }),
      })
      const data = await res.json()
      if (data.success) {
        setApplications(prev =>
          prev.map(a => a._id === appId ? { ...a, status: 'withdrawn' } : a)
        )
      }
    } catch {
      // silent — UI already shows current status
    } finally {
      setWithdrawingId(null)
    }
  }

  const statusBadgeClass = (status) => {
    const map = {
      pending:     'badge-pending',
      shortlisted: 'badge-shortlisted',
      accepted:    'badge-accepted',
      rejected:    'badge-rejected',
      withdrawn:   'badge-withdrawn',
    }
    return `prop-status-badge ${map[status] || ''}`
  }

  const atsColor = (score) => {
    if (score >= 70) return '#10b981'
    if (score >= 40) return '#fbbf24'
    return '#f87171'
  }

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (loading) {
    return (
      <div className="prop-page">
        <TopNav userName={getUserName()} />
        <div className="prop-container">
          <p className="prop-loading">Loading proposals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="prop-page">
      <TopNav userName={getUserName()} />
      <div className="prop-container">

        <div className="prop-header">
          <h1 className="prop-title">My Proposals</h1>
          <span className="prop-count">
            {applications.length} proposal{applications.length !== 1 ? 's' : ''}
          </span>
        </div>

        {error && <p className="prop-error">{error}</p>}

        {applications.length === 0 && !error ? (
          <div className="prop-empty">
            <p>You haven't submitted any proposals yet.</p>
            <button className="prop-find-btn" onClick={() => navigate('/freelancer/find-work')}>
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="prop-list">
            {applications.map((app) => {
              const job        = app.jobId || {}
              const isExpanded = expandedId === app._id

              return (
                <div key={app._id} className="prop-card">
                  <div
                    className="prop-card-header"
                    onClick={() => setExpandedId(isExpanded ? null : app._id)}
                  >
                    <div className="prop-card-left">
                      <div className="prop-info">
                        <span className="prop-job-title">{job.title || 'Job removed'}</span>
                        <span className="prop-date">Applied {formatDate(app.createdAt)}</span>
                      </div>
                    </div>
                    <div className="prop-card-right">
                      {/* ATS Score badge */}
                      {app.atsScore != null ? (
                        <div
                          className="prop-ats-badge"
                          title={`ATS Score: ${app.atsScore}/100`}
                          style={{ '--ats-color': atsColor(app.atsScore) }}
                        >
                          <span style={{ color: atsColor(app.atsScore) }}>{app.atsScore}</span>
                        </div>
                      ) : (
                        <div className="prop-ats-badge prop-ats-none" title="No CV uploaded">
                          <span>-</span>
                        </div>
                      )}
                      <span className={statusBadgeClass(app.status)}>{app.status}</span>
                      <span className={`prop-expand-icon ${isExpanded ? 'open' : ''}`}>▾</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="prop-card-body">

                      {/* Budget / Timeline */}
                      {(app.proposedBudget != null || app.proposedTimelineDays != null) && (
                        <div className="prop-meta-row">
                          {app.proposedBudget != null && (
                            <div className="prop-meta-item">
                              <span className="prop-meta-label">Budget</span>
                              <span className="prop-meta-value">${app.proposedBudget}</span>
                            </div>
                          )}
                          {app.proposedTimelineDays != null && (
                            <div className="prop-meta-item">
                              <span className="prop-meta-label">Timeline</span>
                              <span className="prop-meta-value">{app.proposedTimelineDays} days</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cover Letter */}
                      {app.coverLetter && (
                        <div className="prop-section">
                          <h4 className="prop-section-title">Cover Letter</h4>
                          <p className="prop-section-text">{app.coverLetter}</p>
                        </div>
                      )}

                      {/* ATS Resume Analysis */}
                      {app.atsScore != null && (
                        <div className="prop-ats-section">
                          <h4 className="prop-section-title">Resume ATS Analysis</h4>
                          <div className="prop-ats-main">
                            <div className="prop-ats-gauge">
                              <svg viewBox="0 0 80 80" className="prop-ats-ring">
                                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                                <circle
                                  cx="40" cy="40" r="34"
                                  fill="none"
                                  stroke={atsColor(app.atsScore)}
                                  strokeWidth="6"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(app.atsScore / 100) * 213.6} 213.6`}
                                  transform="rotate(-90 40 40)"
                                />
                              </svg>
                              <span className="prop-ats-gauge-number" style={{ color: atsColor(app.atsScore) }}>
                                {app.atsScore}
                              </span>
                            </div>
                            <div className="prop-ats-details">
                              {app.atsGrade && (
                                <span className="prop-ats-grade-label" style={{ color: atsColor(app.atsScore) }}>
                                  {stripEmoji(app.atsGrade)}
                                </span>
                              )}
                              <div className="prop-ats-tags">
                                {app.atsCategory && (
                                  <span className="prop-ats-tag prop-ats-tag--category">{app.atsCategory}</span>
                                )}
                                {app.atsConfidence != null && (
                                  <span className="prop-ats-tag prop-ats-tag--confidence">{app.atsConfidence}% confidence</span>
                                )}
                              </div>
                              {app.atsBreakdown && (
                                <div className="prop-ats-breakdown">
                                  {Object.entries(app.atsBreakdown).map(([label, score]) => (
                                    <div key={label} className="prop-breakdown-row">
                                      <span className="prop-breakdown-label">{label}</span>
                                      <div className="prop-breakdown-bar-track">
                                        <div
                                          className="prop-breakdown-bar-fill"
                                          style={{ width: `${Math.min(score * 4, 100)}%`, background: atsColor(score * 4) }}
                                        />
                                      </div>
                                      <span className="prop-breakdown-score">{score}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {app.atsFeedback?.length > 0 && (
                            <div className="prop-ats-tips-panel">
                              {app.atsFeedback.map((tip, i) => (
                                <p key={i} className="prop-ats-tip-item">{stripEmoji(tip)}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Withdraw button */}
                      {app.status === 'pending' && (
                        <div className="prop-actions">
                          <button
                            className="prop-withdraw-btn"
                            disabled={withdrawingId === app._id}
                            onClick={() => withdraw(app._id)}
                          >
                            {withdrawingId === app._id ? 'Withdrawing...' : 'Withdraw'}
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

export default FreelancerProposalsPage
