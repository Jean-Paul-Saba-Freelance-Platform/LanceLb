/**
 * Freelancer Find Work Page - Placeholder
 * TODO: Implement job search/browse page for freelancers
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './FreelancerFindWorkPage.css'

const FreelancerFindWorkPage = () => {
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
    <div className="freelancer-find-work-page">
      <TopNav userName={getUserName()} />
      <div className="freelancer-find-work-container">
        <div className="freelancer-find-work-card">
          <h1 className="freelancer-find-work-title">Find Work</h1>
          <p className="freelancer-find-work-subtitle">
            This page is under development. You'll be able to browse and search for jobs here.
          </p>
          <button 
            className="freelancer-find-work-back-button"
            onClick={() => navigate('/freelancer/home')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default FreelancerFindWorkPage
