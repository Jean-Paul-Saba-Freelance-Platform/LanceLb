/**
 * CLIENT HOME PAGE - Implementation Checklist
 * 
 * WHAT WAS ADDED:
 * - ClientHome page component with all required sections
 * - Role-based route protection (ClientRoute)
 * - Mock data layer for dashboard content
 * - Responsive design matching existing design system
 * 
 * HOW TO TEST:
 * 1. Login as client:
 *    - Sign up with userType="client" or use existing client account
 *    - Login will redirect to /client/home automatically
 * 
 * 2. Access /client/home:
 *    - Direct navigation: http://localhost:5173/client/home
 *    - Should show client dashboard with all sections
 * 
 * 3. Expected redirects:
 *    - Not logged in -> redirects to /login
 *    - Logged in as freelancer -> redirects to /freelancer/home
 *    - Logged in as client -> shows client dashboard
 * 
 * WHAT IS PLACEHOLDER VS REAL:
 * - PLACEHOLDER: All data (nextSteps, categories, resources) uses mock data
 * - PLACEHOLDER: Overview section shows empty state (no real jobs/contracts)
 * - PLACEHOLDER: "Post a Job" button routes to placeholder page
 * - PLACEHOLDER: Category cards route to /talent?category=... (page may not exist yet)
 * - REAL: User authentication and role checking
 * - REAL: User name from localStorage
 * - REAL: Route protection logic
 * 
 * TODO FOR BACKEND INTEGRATION:
 * - Replace mockClientDashboardData with API call to GET /api/client/dashboard/summary
 * - Fetch real jobs/contracts for Overview section
 * - Update nextSteps completion status from user profile
 * - Connect "Post a Job" to real job creation flow
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import RightSidebarCard from '../src/components/RightSidebarCard.jsx'
import { nextStepsData, categoriesData, resourcesData, defaultDashboardSummary } from './client/mockClientDashboardData.js'
import './ClientHomePage.css'

const ClientHomePage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeView, setActiveView] = useState('activeJobs') // 'activeJobs' or 'contracts'
  const [dashboardSummary, setDashboardSummary] = useState(defaultDashboardSummary)

  // Fetch dashboard summary from API (optional - falls back to mock data if API fails)
  const fetchDashboardSummary = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('http://127.0.0.1:4000/api/client/dashboard/summary', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies for auth
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
      // API not available or error - use default/mock data
      console.log('Dashboard API not available, using mock data:', error.message)
    }
  }

  useEffect(() => {
    // Get user from localStorage
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        setUser(userData)
        
        // Update email verification status from user data
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

    // Try to fetch dashboard summary from API (optional)
    fetchDashboardSummary()
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

              {/* TODO: When backend is ready, replace empty state with:
              <div className="overview-list">
                {activeView === 'activeJobs' ? (
                  jobs.map(job => <JobListItem key={job.id} job={job} />)
                ) : (
                  contracts.map(contract => <ContractListItem key={contract.id} contract={contract} />)
                )}
              </div>
              */}
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
