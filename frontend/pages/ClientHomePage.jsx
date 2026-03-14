import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import RightSidebarCard from '../src/components/RightSidebarCard.jsx'
import { nextStepsData, categoriesData, resourcesData, defaultDashboardSummary } from './client/mockClientDashboardData.js'
import './ClientHomePage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const ClientHomePage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeView, setActiveView] = useState('activeJobs')
  const [dashboardSummary, setDashboardSummary] = useState(defaultDashboardSummary)
  const [clientJobs, setClientJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [jobsError, setJobsError] = useState('')

  const fetchDashboardSummary = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${API_BASE}/api/client/dashboard/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

    const fetchClientJobs = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) { setLoadingJobs(false); return }
        const res = await fetch(`${API_BASE}/api/client/jobs/mine`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setClientJobs(data.jobs || data.data || [])
        } else {
          setJobsError(data.message || 'Failed to load jobs')
        }
      } catch (err) {
        console.error('Error fetching client jobs:', err)
        setJobsError('Could not reach the server. Make sure the backend is running.')
      } finally {
        setLoadingJobs(false)
      }
    }
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
                  {loadingJobs ? (
                    <p className="overview-loading">Loading your jobs...</p>
                  ) : jobsError ? (
                    <p className="overview-error">{jobsError}</p>
                  ) : clientJobs.filter(j => j.status === 'open').length > 0 ? (
                    <div className="overview-job-list">
                      {clientJobs.filter(j => j.status === 'open').map(job => (
                        <div key={job.id || job._id} className="overview-job-item">
                          <div className="overview-job-info">
                            <span className="overview-job-title">{job.title}</span>
                            <span className="overview-job-meta">
                              {job.paymentType === 'hourly' ? 'Hourly' : 'Fixed'} · {job.experienceLevel}
                            </span>
                          </div>
                          <button
                            className="overview-job-apps-btn"
                            onClick={() => navigate(`/client/jobs/${job.id || job._id}/applications`)}
                          >
                            View Applications
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <h3 className="empty-state-title">No active jobs yet</h3>
                      <p className="empty-state-description">
                        Start by posting your first job to find talented freelancers.
                      </p>
                      <div className="empty-state-actions">
                        <button className="empty-state-button primary" onClick={handlePostJob}>
                          Post a job
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeView === 'contracts' && (
                <div className="empty-state">
                  <h3 className="empty-state-title">No contracts in progress</h3>
                  <p className="empty-state-description">
                    Once you hire a freelancer, your active contracts will appear here.
                  </p>
                  <div className="empty-state-actions">
                    <button className="empty-state-button primary" onClick={handlePostJob}>
                      Post a job
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

    </div>
  )
}

export default ClientHomePage
