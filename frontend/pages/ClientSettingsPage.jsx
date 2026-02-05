/**
 * Client Settings Page - Placeholder
 * TODO: Implement client settings page
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './ClientSettingsPage.css'

const ClientSettingsPage = () => {
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
    <div className="client-settings-page">
      <TopNav userName={getUserName()} />
      <div className="client-settings-container">
        <div className="client-settings-card">
          <h1 className="client-settings-title">Account Settings</h1>
          <p className="client-settings-subtitle">
            This page is under development. Your account settings will be available here soon.
          </p>
          <button 
            className="client-settings-back-button"
            onClick={() => navigate('/client/home')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientSettingsPage
