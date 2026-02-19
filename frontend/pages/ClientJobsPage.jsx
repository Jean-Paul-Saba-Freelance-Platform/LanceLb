import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import ConfirmDeleteModal from '../src/components/ConfirmDeleteModal.jsx'
import './ClientJobsPage.css'

const API_BASE = 'http://127.0.0.1:4000'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
]

const ClientJobsPage = () => {
  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const getUserName = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.name?.split(' ')[0] || user.firstName || 'Client'
      }
    } catch { /* ignore */ }
    return 'Client'
  }

  const fetchJobs = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/client/jobs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setJobs(data.data || [])
      } else {
        setError(data.message || 'Failed to load jobs')
      }
    } catch {
      setError('Network error — make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/client/jobs/${deleteTarget.id || deleteTarget._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setJobs(prev => prev.filter(j => (j.id || j._id) !== (deleteTarget.id || deleteTarget._id)))
        setDeleteTarget(null)
        setSuccess('Job deleted successfully.')
        setTimeout(() => setSuccess(''), 4000)
      } else {
        setDeleteError(data.message || 'Failed to delete job')
      }
    } catch {
      setDeleteError('Network error — make sure the backend is running.')
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, deleting])

  const handleDeleteCancel = useCallback(() => {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError('')
  }, [deleting])

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !search.trim() ||
      job.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })

  const budgetDisplay = (job) => {
    if (job.paymentType === 'hourly' && job.hourlyMin != null && job.hourlyMax != null) {
      return `$${job.hourlyMin} – $${job.hourlyMax}/hr`
    }
    if (job.paymentType === 'fixed' && job.fixedBudget != null) {
      return `$${job.fixedBudget} fixed`
    }
    return '—'
  }

  const statusLabel = (status) => {
    if (status === 'open') return 'Open'
    if (status === 'in_progress') return 'In Progress'
    if (status === 'closed') return 'Closed'
    return status
  }

  return (
    <div className="client-jobs-page">
      <TopNav userName={getUserName()} />
      <div className="client-jobs-container">
        <div className="manage-header">
          <div>
            <h1 className="manage-title">Manage Jobs</h1>
            <p className="manage-subtitle">View and manage all your posted jobs.</p>
          </div>
          <button
            className="manage-post-btn"
            onClick={() => navigate('/client/post-job')}
          >
            + Post a New Job
          </button>
        </div>

        {success && (
          <div className="manage-success">
            <span>{success}</span>
            <button className="manage-success-dismiss" onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        <div className="manage-toolbar">
          <div className="manage-search-wrap">
            <svg className="manage-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="manage-search-input"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="manage-status-filter">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`manage-status-btn ${statusFilter === opt.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="manage-loading">
            {[1, 2, 3].map(i => <div key={i} className="manage-skeleton" />)}
          </div>
        )}

        {error && !loading && (
          <div className="manage-error">
            <span>{error}</span>
            <button className="manage-error-retry" onClick={fetchJobs}>Retry</button>
          </div>
        )}

        {!loading && !error && filteredJobs.length === 0 && (
          <div className="manage-empty">
            {jobs.length === 0 ? (
              <>
                <h3>No jobs posted yet</h3>
                <p>Create your first job posting to get started.</p>
                <button
                  className="manage-post-btn"
                  onClick={() => navigate('/client/post-job')}
                >
                  Post a Job
                </button>
              </>
            ) : (
              <>
                <h3>No jobs match your filters</h3>
                <p>Try adjusting the search or status filter.</p>
              </>
            )}
          </div>
        )}

        {!loading && !error && filteredJobs.length > 0 && (
          <div className="manage-jobs-list">
            {filteredJobs.map(job => {
              const jobId = job.id || job._id
              return (
                <div key={jobId} className="manage-job-card">
                  <div className="manage-job-top">
                    <div className="manage-job-info">
                      <h3 className="manage-job-title">{job.title}</h3>
                      <div className="manage-job-meta">
                        <span>{formatDate(job.createdAt)}</span>
                        <span className="manage-meta-dot">·</span>
                        <span className="manage-job-budget">{budgetDisplay(job)}</span>
                      </div>
                    </div>
                    <span className={`manage-job-badge status-${job.status}`}>
                      {statusLabel(job.status)}
                    </span>
                  </div>
                  {job.requiredSkills?.length > 0 && (
                    <div className="manage-job-skills">
                      {job.requiredSkills.slice(0, 6).map((skill, i) => (
                        <span key={i} className="manage-skill-chip">{skill}</span>
                      ))}
                      {job.requiredSkills.length > 6 && (
                        <span className="manage-skill-chip more">+{job.requiredSkills.length - 6}</span>
                      )}
                    </div>
                  )}
                  {job.description && (
                    <p className="manage-job-desc">
                      {job.description.length > 150
                        ? job.description.slice(0, 150) + '...'
                        : job.description}
                    </p>
                  )}
                  <div className="manage-job-actions">
                    <button
                      className="manage-action-btn primary"
                      onClick={() => navigate(`/client/jobs/${jobId}/edit`)}
                    >
                      Edit
                    </button>
                    <button
                      className="manage-action-btn secondary"
                      onClick={() => navigate('/client/home')}
                    >
                      View
                    </button>
                    <button
                      className="manage-action-btn danger"
                      onClick={() => setDeleteTarget(job)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete job?"
        body={`This will permanently remove "${deleteTarget?.title || 'this job'}". This action cannot be undone.`}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}

export default ClientJobsPage
