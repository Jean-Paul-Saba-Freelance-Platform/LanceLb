/**
 * Freelancer Proposals Page - Placeholder
 * TODO: Implement proposals management page for freelancers
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './FreelancerProposalsPage.css'

const FreelancerProposalsPage = () => {
  const navigate = useNavigate()
  
  const getUserName = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.name?.split(' ')[0] || user.firstName || 'Freelancer'
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
    return 'Freelancer'
  }

  return (
    <div className="freelancer-proposals-page">
      <TopNav userName={getUserName()} />
      <div className="freelancer-proposals-container">
        <div className="freelancer-proposals-card">
          <h1 className="freelancer-proposals-title">My Proposals</h1>
          <p className="freelancer-proposals-subtitle">
            This page is under development. You'll be able to view and manage all your proposals here.
          </p>
          <button 
            className="freelancer-proposals-back-button"
            onClick={() => navigate('/freelancer/home')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default FreelancerProposalsPage
