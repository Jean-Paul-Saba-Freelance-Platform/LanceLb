import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './SignupFreelancer.css'

const SignupFreelancer = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    country: 'Lebanon',
    marketingOptIn: false,
    termsAgreed: false
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
    if (submitError) {
      setSubmitError('')
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.termsAgreed) {
      newErrors.termsAgreed = 'You must agree to the Terms of Service'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    try {
      const response = await fetch('http://127.0.0.1:4000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          email: formData.email.trim(),
          password: formData.password,
          userType: 'freelancer'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors from backend
        if (data.errors) {
          setErrors(data.errors)
        }
        setSubmitError(data.message || 'Registration failed. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Success
      setSubmitSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (error) {
      console.error('Registration error:', error)
      setSubmitError('Network error. Please check your connection and try again.')
      setIsSubmitting(false)
    }
  }

  const handleOAuthClick = (provider) => {
    // Placeholder for OAuth - not functional yet
    console.log(`Continue with ${provider} - Coming soon`)
  }

  // List of countries (placeholder - can be expanded)
  const countries = [
    'Lebanon',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'India',
    'Brazil',
    'Other'
  ]

  return (
    <div className="signup-freelancer-container">
      <div className="signup-freelancer-header">
        <Link to="/" className="header-brand-small">
          FreelanceHub
        </Link>
        <Link to="/login" className="header-login-link">
          Already have an account? Log In
        </Link>
      </div>

      <div className="signup-freelancer-content">
        <div className="signup-freelancer-card">
          <h1 className="signup-freelancer-title">Sign up to find work you love</h1>

          {/* OAuth Buttons */}
          <div className="oauth-buttons">
            <button
              type="button"
              className="oauth-button oauth-google"
              onClick={() => handleOAuthClick('Google')}
            >
              Continue with Google
            </button>
            <button
              type="button"
              className="oauth-button oauth-apple"
              onClick={() => handleOAuthClick('Apple')}
            >
              Continue with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="divider">
            <span className="divider-line"></span>
            <span className="divider-text">or</span>
            <span className="divider-line"></span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="signup-freelancer-form">
            {/* Success Message */}
            {submitSuccess && (
              <div className="success-message">
                Account created successfully! Redirecting to login...
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="error-message-global">
                {submitError}
              </div>
            )}

            {/* First Name and Last Name Row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Password (min. 8 characters)"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Country */}
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <select
                id="country"
                name="country"
                className="form-input"
                value={formData.country}
                onChange={handleChange}
              >
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Checkboxes */}
            <div className="form-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="marketingOptIn"
                  checked={formData.marketingOptIn}
                  onChange={handleChange}
                />
                <span>Send me helpful emails to find work and grow my freelance business</span>
              </label>

              <label className={`checkbox-label ${errors.termsAgreed ? 'error' : ''}`}>
                <input
                  type="checkbox"
                  name="termsAgreed"
                  checked={formData.termsAgreed}
                  onChange={handleChange}
                  required
                />
                <span>I agree to the FreelanceHub <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a> and <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a></span>
              </label>
              {errors.termsAgreed && <span className="error-message">{errors.termsAgreed}</span>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || submitSuccess}
            >
              {isSubmitting ? 'Creating account...' : 'Create my account'}
            </button>
          </form>

          {/* Footer Link */}
          <div className="signup-freelancer-footer">
            <p>
              Here to hire talent?{' '}
              <Link to="/signup/client" className="footer-link">Join as a client</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupFreelancer
