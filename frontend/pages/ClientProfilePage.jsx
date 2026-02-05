/**
 * Client Profile Page - Placeholder
 * TODO: Implement full client profile page
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './ClientProfilePage.css'

const ClientProfilePage = () => {
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
    <div className="client-profile-page">
      <TopNav userName={getUserName()} />
      <div className="client-profile-container">
        <div className="client-profile-card">
          <h1 className="client-profile-title">Client Profile</h1>
          <p className="client-profile-subtitle">
            This page is under development. Your client profile will be available here soon.
          </p>
          <button 
            className="client-profile-back-button"
            onClick={() => navigate('/client/home')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientProfilePage
