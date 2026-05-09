/**
 * Post Job Page - Placeholder
 * 
 * TODO: Implement full job posting form with:
 * - Job title
 * - Description
 * - Category
 * - Budget/rate
 * - Timeline
 * - Required skills
 * - Job type (hourly/fixed-price)
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './PostJobPage.css'

const PostJobPage = () => {
  const navigate = useNavigate()
  
  // Get user from localStorage
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
    <div className="post-job-page">
      <TopNav userName={getUserName()} />
      <div className="post-job-container">
        <div className="post-job-card">
          <h1 className="post-job-title">Post a Job</h1>
          <p className="post-job-subtitle">
            This page is under development. The job posting form will be available here soon.
          </p>
          <button 
            className="post-job-back-button"
            onClick={() => navigate('/client/home')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostJobPage
