/**
 * Freelancer Deliver Work Page - Placeholder
 * TODO: Implement active contracts/orders page for freelancers
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './FreelancerDeliverWorkPage.css'

const FreelancerDeliverWorkPage = () => {
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
    <div className="freelancer-deliver-work-page">
      <TopNav userName={getUserName()} />
      <div className="freelancer-deliver-work-container">
        <div className="freelancer-deliver-work-card">
          <h1 className="freelancer-deliver-work-title">Deliver Work</h1>
          <p className="freelancer-deliver-work-subtitle">
            This page is under development. You'll be able to manage your active contracts and deliver work here.
          </p>
          <button 
            className="freelancer-deliver-work-back-button"
            onClick={() => navigate('/freelancer/home')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default FreelancerDeliverWorkPage
