import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './ClientProjectsPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const ClientProjectsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create-project form (shown when navigated from applications page with jobId)
  const [showForm, setShowForm] = useState(!!location.state?.jobId)
  const [formTitle, setFormTitle] = useState(location.state?.jobTitle ? `${location.state.jobTitle} Project` : '')
  const [formDescription, setFormDescription] = useState('')
  const [formJobIds, setFormJobIds] = useState(location.state?.jobId ? [location.state.jobId] : [])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Available client jobs for multi-job project
  const [clientJobs, setClientJobs] = useState([])

  const getUserName = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.name?.split(' ')[0] || 'Client'
    } catch { return 'Client' }
  }

  const authHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, jobsRes] = await Promise.all([
          fetch(`${API_BASE}/api/projects`, { credentials: 'include', headers: authHeaders() }),
          fetch(`${API_BASE}/api/client/jobs`, { credentials: 'include', headers: authHeaders() }),
        ])
        const projectsData = await projectsRes.json()
        const jobsData = await jobsRes.json()

        if (projectsData.success) setProjects(projectsData.projects)
        if (jobsData.success) setClientJobs(jobsData.jobs || [])
      } catch (err) {
        console.error(err)
        setError('Network error loading projects.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const toggleJobId = (id) => {
    setFormJobIds(prev =>
      prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]
    )
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateError('')
    if (!formTitle.trim()) return setCreateError('Project title is required.')
    if (!formJobIds.length) return setCreateError('Select at least one job with accepted applicants.')

    setCreating(true)
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({ title: formTitle.trim(), description: formDescription.trim(), jobIds: formJobIds }),
      })
      const data = await res.json()
      if (data.success) {
        setProjects(prev => [data.project, ...prev])
        setShowForm(false)
        navigate(`/client/projects/${data.project._id}`)
      } else {
        setCreateError(data.message || 'Failed to create project.')
      }
    } catch (err) {
      setCreateError('Network error.')
    } finally {
      setCreating(false)
    }
  }

  const statusColor = (status) => {
    if (status === 'active') return '#10b981'
    if (status === 'completed') return '#38bdf8'
    return '#fbbf24'
  }

  const statusLabel = { planning: 'Planning', active: 'Active', completed: 'Completed' }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <div className="cp-page">
      <TopNav userName={getUserName()} />
      <div className="cp-container">
        <div className="cp-header">
          <h1 className="cp-title">Projects</h1>
          <button className="cp-new-btn" onClick={() => setShowForm(f => !f)}>
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        </div>

        {/* Create project form */}
        {showForm && (
          <form className="cp-form" onSubmit={handleCreate}>
            <h3 className="cp-form-title">Create New Project</h3>

            <div className="cp-field">
              <label className="cp-label">Project Title</label>
              <input
                className="cp-input"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. LanceLB Website Redesign"
                required
              />
            </div>

            <div className="cp-field">
              <label className="cp-label">Description (optional)</label>
              <textarea
                className="cp-input cp-textarea"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={3}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label">Include Job Roles (with accepted applicants)</label>
              <div className="cp-jobs-list">
                {clientJobs.length === 0 && (
                  <span className="cp-no-jobs">No jobs found.</span>
                )}
                {clientJobs.map(job => (
                  <label key={job._id} className="cp-job-check">
                    <input
                      type="checkbox"
                      checked={formJobIds.includes(job._id)}
                      onChange={() => toggleJobId(job._id)}
                    />
                    <span>{job.title}</span>
                    <span className={`cp-job-status cp-status-${job.status}`}>{job.status}</span>
                  </label>
                ))}
              </div>
            </div>

            {createError && <p className="cp-form-error">{createError}</p>}

            <button className="cp-submit-btn" type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        )}

        {error && <p className="cp-error">{error}</p>}

        {loading ? (
          <p className="cp-loading">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="cp-empty">
            <p>No projects yet. Accept applicants on a job and create your first project.</p>
          </div>
        ) : (
          <div className="cp-list">
            {projects.map(proj => {
              const totalTasks = proj.tasks?.length || 0
              const doneTasks = proj.tasks?.filter(t => t.validatedByClient).length || 0
              const progress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

              return (
                <div
                  key={proj._id}
                  className="cp-card"
                  onClick={() => navigate(`/client/projects/${proj._id}`)}
                >
                  <div className="cp-card-top">
                    <div className="cp-card-info">
                      <h3 className="cp-card-title">{proj.title}</h3>
                      {proj.description && (
                        <p className="cp-card-desc">{proj.description}</p>
                      )}
                    </div>
                    <span className="cp-card-status" style={{ color: statusColor(proj.status), borderColor: statusColor(proj.status) }}>
                      {statusLabel[proj.status]}
                    </span>
                  </div>

                  <div className="cp-card-meta">
                    <span>
                      {proj.jobs?.length || 0} role{proj.jobs?.length !== 1 ? 's' : ''}
                    </span>
                    <span>·</span>
                    <span>{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
                    {proj.launchDate && (
                      <>
                        <span>·</span>
                        <span>Launch: {formatDate(proj.launchDate)}</span>
                      </>
                    )}
                  </div>

                  {totalTasks > 0 && (
                    <div className="cp-progress-row">
                      <div className="cp-progress-track">
                        <div className="cp-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="cp-progress-label">{doneTasks}/{totalTasks}</span>
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

export default ClientProjectsPage
