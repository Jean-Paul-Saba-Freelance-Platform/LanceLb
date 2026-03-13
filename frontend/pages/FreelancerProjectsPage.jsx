import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './FreelancerProjectsPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const FreelancerProjectsPage = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getUserName = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').name?.split(' ')[0] || 'Freelancer' } catch { return 'Freelancer' }
  }

  const authHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/projects`, {
          credentials: 'include',
          headers: authHeaders(),
        })
        const data = await res.json()
        if (data.success) setProjects(data.projects)
        else setError(data.message || 'Failed to load.')
      } catch {
        setError('Network error.')
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  const statusColor = (status) => {
    if (status === 'active') return '#10b981'
    if (status === 'completed') return '#38bdf8'
    return '#fbbf24'
  }

  const statusLabel = { planning: 'Planning', active: 'Active', completed: 'Completed' }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <div className="fp-page">
      <TopNav userName={getUserName()} />
      <div className="fp-container">
        <h1 className="fp-title">My Projects</h1>

        {error && <p className="fp-error">{error}</p>}

        {loading ? (
          <p className="fp-loading">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="fp-empty">
            <p>You have no active projects yet. Projects appear here once a client starts a project you're part of.</p>
          </div>
        ) : (
          <div className="fp-list">
            {projects.map(proj => {
              const userId = (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u._id || u.id || '' } catch { return '' } })()
              const myTasks = (proj.tasks || []).filter(t =>
                t.assignedTo === userId ||
                (t.assignedTo && (t.assignedTo._id === userId || t.assignedTo === userId))
              )
              const doneTasks = myTasks.filter(t => t.validatedByClient).length
              const pendingTasks = myTasks.filter(t => !t.validatedByClient).length

              return (
                <div
                  key={proj._id}
                  className="fp-card"
                  onClick={() => navigate(`/freelancer/projects/${proj._id}`)}
                >
                  <div className="fp-card-top">
                    <div className="fp-card-info">
                      <h3 className="fp-card-title">{proj.title}</h3>
                      {proj.clientId?.name && (
                        <span className="fp-card-client">by {proj.clientId.name}</span>
                      )}
                    </div>
                    <span
                      className="fp-card-status"
                      style={{ color: statusColor(proj.status), borderColor: statusColor(proj.status) }}
                    >
                      {statusLabel[proj.status]}
                    </span>
                  </div>

                  <div className="fp-card-meta">
                    {myTasks.length > 0 ? (
                      <>
                        <span>{doneTasks} done</span>
                        <span>·</span>
                        <span>{pendingTasks} pending</span>
                      </>
                    ) : (
                      <span>No tasks assigned to you yet</span>
                    )}
                    {proj.launchDate && (
                      <>
                        <span>·</span>
                        <span>Launch: {formatDate(proj.launchDate)}</span>
                      </>
                    )}
                    {proj.crewId?.name && (
                      <>
                        <span>·</span>
                        <span># {proj.crewId.name}</span>
                      </>
                    )}
                  </div>

                  {myTasks.length > 0 && (
                    <div className="fp-progress-row">
                      <div className="fp-progress-track">
                        <div
                          className="fp-progress-fill"
                          style={{ width: `${Math.round((doneTasks / myTasks.length) * 100)}%` }}
                        />
                      </div>
                      <span className="fp-progress-label">{doneTasks}/{myTasks.length}</span>
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

export default FreelancerProjectsPage
