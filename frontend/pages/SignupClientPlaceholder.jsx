import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './SignupPlaceholder.css'

const SignupClientPlaceholder = () => {
  const navigate = useNavigate()

  return (
    <div className="placeholder-container">
      <div className="placeholder-card">
        <div className="placeholder-header">
          <h1>Client Sign Up</h1>
          <p className="placeholder-subtitle">Coming Soon</p>
        </div>

        <p className="placeholder-description">
          We're working on building the best experience for clients. 
          This page will be available soon.
        </p>

        <button
          className="placeholder-back-button"
          onClick={() => navigate('/signup')}
        >
          Back
        </button>
      </div>
    </div>
  )
}

export default SignupClientPlaceholder
