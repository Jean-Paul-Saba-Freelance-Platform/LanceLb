import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './SignupRoleSelect.css'

const SignupRoleSelect = () => {
  const [selectedRole, setSelectedRole] = useState(null)
  const navigate = useNavigate()

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
  }

  const handleContinue = () => {
    if (selectedRole === 'client') {
      navigate('/signup/client')
    } else if (selectedRole === 'freelancer') {
      navigate('/signup/freelancer')
    }
  }

  return (
    <div className="role-select-container">
      <div className="role-select-card">
        <div className="role-select-header">
          <h1>Join as a client or freelancer</h1>
        </div>

        <div className="role-options">
          <div
            className={`role-option ${selectedRole === 'client' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('client')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleRoleSelect('client')
              }
            }}
          >
            <div className="role-option-radio">
              {selectedRole === 'client' && <div className="radio-indicator"></div>}
            </div>
            <div className="role-option-content">
              <h3 className="role-option-title">Client</h3>
              <p className="role-option-description">I'm a client, hiring for a project</p>
            </div>
          </div>

          <div
            className={`role-option ${selectedRole === 'freelancer' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('freelancer')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleRoleSelect('freelancer')
              }
            }}
          >
            <div className="role-option-radio">
              {selectedRole === 'freelancer' && <div className="radio-indicator"></div>}
            </div>
            <div className="role-option-content">
              <h3 className="role-option-title">Freelancer</h3>
              <p className="role-option-description">I'm a freelancer, looking for work</p>
            </div>
          </div>
        </div>

        <button
          className={`role-cta-button ${selectedRole ? 'enabled' : 'disabled'}`}
          onClick={handleContinue}
          disabled={!selectedRole}
        >
          {selectedRole === 'client' && 'Join as a Client'}
          {selectedRole === 'freelancer' && 'Join as a Freelancer'}
          {!selectedRole && 'Continue'}
        </button>

        <div className="role-select-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="login-link">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupRoleSelect
