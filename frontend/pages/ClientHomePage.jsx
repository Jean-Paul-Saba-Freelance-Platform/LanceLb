import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import RightSidebarCard from '../src/components/RightSidebarCard.jsx'
import ConfirmDeleteModal from '../src/components/ConfirmDeleteModal.jsx'
import { nextStepsData, categoriesData, resourcesData, defaultDashboardSummary } from './client/mockClientDashboardData.js'
import './ClientHomePage.css'

const API_BASE = 'http://127.0.0.1:4000'

const ClientHomePage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeView, setActiveView] = useState('activeJobs')
  const [dashboardSummary, setDashboardSummary] = useState(defaultDashboardSummary)

  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobsError, setJobsError] = useState('')
  const [jobsSuccess, setJobsSuccess] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const fetchDashboardSummary = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${API_BASE}/api/client/dashboard/summary`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDashboardSummary({
            activeJobsCount: data.activeJobsCount || 0,
            contractsCount: data.contractsCount || 0,
            emailVerified: data.emailVerified || false,
            phoneVerified: data.phoneVerified || false,
            billingMethodAdded: data.billingMethodAdded || false
          })
        }
      }
    } catch (error) {
      console.log('Dashboard API not available, using mock data:', error.message)
    }
  }

  const fetchClientJobs = async () => {
    setJobsLoading(true)
    setJobsError('')
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
        setJobsError(data.message || 'Failed to load jobs')
      }
    } catch {
      setJobsError('Network error — make sure the backend is running.')
    } finally {
      setJobsLoading(false)
    }
  }

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
        setJobsSuccess('Job deleted successfully.')
        setTimeout(() => setJobsSuccess(''), 4000)
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

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        setUser(userData)
        if (userData.isAccountVerified !== undefined) {
          setDashboardSummary(prev => ({
            ...prev,
            emailVerified: userData.isAccountVerified
          }))
        }
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }

    fetchDashboardSummary()
    fetchClientJobs()
  }, [])

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Get user's first name
  const getUserFirstName = () => {
    if (!user) return 'Client'
    return user.name?.split(' ')[0] || user.firstName || 'Client'
  }

  // Update nextSteps with user data
  const getNextSteps = () => {
    return nextStepsData.map(step => {
      if (step.id === 3) {
        // Email verification step
        return {
          ...step,
          completed: dashboardSummary.emailVerified
        }
      }
      // TODO: Update other steps when backend provides data
      return step
    })
  }

  // Handle "Post a Job" action — opens the multi-step wizard
  const handlePostJob = () => {
    navigate('/client/post-job')
  }

  // Handle category click
  const handleCategoryClick = (route) => {
    navigate(route)
  }

  // Handle next step action
  const handleNextStepAction = (route) => {
    navigate(route)
  }

  const firstName = getUserFirstName()
  const nextSteps = getNextSteps()

  return (
    <div className="client-home">
      <TopNav userName={firstName} />

      <div className="client-home-container">
        {/* Main Content */}
        <div className="client-main-content">
          {/* A) Greeting + Primary Action */}
          <div className="greeting-card">
            <div className="greeting-content">
              <h2 className="greeting-text">{getGreeting()}, {firstName}.</h2>
              <p className="greeting-subtitle">Ready to find the perfect talent for your project?</p>
            </div>
            <button className="primary-action-button" onClick={handlePostJob}>
              Post a Job
            </button>
          </div>

          {/* B) Next Steps Cards */}
          <div className="next-steps-section">
            <h2 className="section-title">Next steps to start hiring</h2>
            <div className="next-steps-grid">
              {nextSteps.map(step => (
                <div key={step.id} className={`next-steps-card ${step.completed ? 'completed' : ''}`}>
                  <div className="next-steps-icon">{step.icon}</div>
                  <h3 className="next-steps-title">{step.title}</h3>
                  <p className="next-steps-description">{step.description}</p>
                  {!step.completed && (
                    <button 
                      className="next-steps-action"
                      onClick={() => handleNextStepAction(step.actionRoute)}
                    >
                      {step.actionText}
                    </button>
                  )}
                  {step.completed && (
                    <span className="next-steps-completed">✓ Completed</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* C) Overview / Activity Panel */}
          <div className="overview-section">
            <div className="overview-header">
              <h2 className="section-title">Overview</h2>
              <div className="segmented-control">
                <button
                  className={`segmented-control-button ${activeView === 'activeJobs' ? 'active' : ''}`}
                  onClick={() => setActiveView('activeJobs')}
                >
                  Active jobs
                </button>
                <button
                  className={`segmented-control-button ${activeView === 'contracts' ? 'active' : ''}`}
                  onClick={() => setActiveView('contracts')}
                >
                  Contracts / In progress
                </button>
              </div>
            </div>

            <div className="overview-card">
              {activeView === 'activeJobs' && (
                <>
                  {jobsSuccess && (
                    <div className="overview-success-banner">
                      <span>{jobsSuccess}</span>
                      <button className="overview-success-dismiss" onClick={() => setJobsSuccess('')}>×</button>
                    </div>
                  )}

                  {jobsLoading && (
                    <div className="overview-loading">
                      <div className="skeleton-card" />
                      <div className="skeleton-card" />
                    </div>
                  )}

                  {jobsError && !jobsLoading && (
                    <div className="overview-error-banner">
                      <span>{jobsError}</span>
                      <button className="overview-error-retry" onClick={fetchClientJobs}>Retry</button>
                    </div>
                  )}

                  {!jobsLoading && !jobsError && jobs.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-state-illustration">
                        <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="40" fill="#a855f7" opacity="0.2"/>
                          <path d="M30 50 L45 65 L70 35" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
                          <circle cx="50" cy="50" r="35" stroke="#a855f7" strokeWidth="2" opacity="0.3"/>
                        </svg>
                      </div>
                      <h3 className="empty-state-title">No active jobs yet</h3>
                      <p className="empty-state-description">
                        Start by posting your first job to find talented freelancers.
                      </p>
                      <div className="empty-state-actions">
                        <button className="empty-state-button primary" onClick={handlePostJob}>
                          Post a job
                        </button>
                        <button 
                          className="empty-state-button secondary"
                          onClick={() => navigate('/talent')}
                        >
                          Find talent
                        </button>
                      </div>
                    </div>
                  )}

                  {!jobsLoading && !jobsError && jobs.length > 0 && (
                    <div className="overview-jobs-list">
                      {jobs.map(job => (
                        <div key={job.id || job._id} className="overview-job-card">
                          <div className="overview-job-top">
                            <h3 className="overview-job-title">{job.title}</h3>
                            {job.status && (
                              <span className={`overview-job-badge status-${job.status}`}>
                                {job.status === 'open' ? 'Open' : job.status === 'in_progress' ? 'In Progress' : 'Closed'}
                              </span>
                            )}
                          </div>
                          <div className="overview-job-meta">
                            <span className="overview-job-date">
                              Posted {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="overview-job-budget">
                              {job.paymentType === 'hourly'
                                ? `$${job.hourlyMin} – $${job.hourlyMax}/hr`
                                : `$${job.fixedBudget} fixed`}
                            </span>
                          </div>
                          {job.requiredSkills?.length > 0 && (
                            <div className="overview-job-skills">
                              {job.requiredSkills.slice(0, 5).map((skill, i) => (
                                <span key={i} className="overview-skill-chip">{skill}</span>
                              ))}
                              {job.requiredSkills.length > 5 && (
                                <span className="overview-skill-chip more">+{job.requiredSkills.length - 5}</span>
                              )}
                            </div>
                          )}
                          <div className="overview-job-actions">
                            <button
                              className="overview-job-btn manage"
                              onClick={() => navigate('/client/jobs')}
                            >
                              Manage
                            </button>
                            <button
                              className="overview-job-btn edit"
                              onClick={() => navigate(`/client/jobs/${job.id || job._id}/edit`)}
                            >
                              Edit
                            </button>
                            <button
                              className="overview-job-btn delete"
                              onClick={() => setDeleteTarget(job)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeView === 'contracts' && (
                <div className="empty-state">
                  <div className="empty-state-illustration">
                    <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                      <rect x="25" y="30" width="50" height="40" rx="4" fill="#a855f7" opacity="0.2"/>
                      <path d="M35 50 L45 60 L65 40" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
                      <circle cx="50" cy="50" r="35" stroke="#a855f7" strokeWidth="2" opacity="0.3"/>
                    </svg>
                  </div>
                  <h3 className="empty-state-title">No contracts in progress</h3>
                  <p className="empty-state-description">
                    Once you hire a freelancer, your active contracts will appear here.
                  </p>
                  <div className="empty-state-actions">
                    <button className="empty-state-button primary" onClick={handlePostJob}>
                      Post a job
                    </button>
                    <button 
                      className="empty-state-button secondary"
                      onClick={() => navigate('/talent')}
                    >
                      Find talent
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* D) Explore Categories */}
          <div className="categories-section">
            <h2 className="section-title">Find experts by category</h2>
            <div className="categories-grid">
              {categoriesData.map(category => (
                <div 
                  key={category.id} 
                  className="category-card"
                  onClick={() => handleCategoryClick(category.route)}
                >
                  <div className="category-icon">{category.icon}</div>
                  <h3 className="category-title">{category.title}</h3>
                  <p className="category-description">{category.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* E) Help & Resources */}
          <div className="resources-section">
            <h2 className="section-title">Help & resources</h2>
            <div className="resources-grid">
              {resourcesData.map(resource => (
                <div key={resource.id} className="resource-card">
                  <h3 className="resource-title">{resource.title}</h3>
                  <p className="resource-description">{resource.description}</p>
                  <button 
                    className="resource-action"
                    onClick={() => navigate(resource.route)}
                  >
                    {resource.actionText} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
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

export default ClientHomePage
