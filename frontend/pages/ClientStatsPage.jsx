/**
 * Client Stats Page - Placeholder
 * TODO: Implement client stats dashboard
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './ClientStatsPage.css'

const ClientStatsPage = () => {
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
    <div className="client-stats-page">
      <TopNav userName={getUserName()} />
      <div className="client-stats-container">
        <div className="client-stats-card">
          <h1 className="client-stats-title">Stats & Trends</h1>
          <p className="client-stats-subtitle">
            This page is under development. Your hiring statistics and trends will be available here soon.
          </p>
          <button 
            className="client-stats-back-button"
            onClick={() => navigate('/client/home')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientStatsPage
