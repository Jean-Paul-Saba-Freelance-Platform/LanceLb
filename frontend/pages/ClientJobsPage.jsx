/**
 * Client Jobs Management Page - Placeholder
 * TODO: Implement job management page for clients
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './ClientJobsPage.css'

const ClientJobsPage = () => {
  const navigate = useNavigate()
  
  const getUserName = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.name?.split(' ')[0] || user.firstName || 'Client'
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
    return 'Client'
  }

  return (
    <div className="client-jobs-page">
      <TopNav userName={getUserName()} />
      <div className="client-jobs-container">
        <div className="client-jobs-card">
          <h1 className="client-jobs-title">Manage Jobs</h1>
          <p className="client-jobs-subtitle">
            This page is under development. You'll be able to manage all your posted jobs here.
          </p>
          <div className="client-jobs-actions">
            <button 
              className="client-jobs-button primary"
              onClick={() => navigate('/client/jobs/new')}
            >
              Post a New Job
            </button>
            <button 
              className="client-jobs-button secondary"
              onClick={() => navigate('/client/home')}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientJobsPage
