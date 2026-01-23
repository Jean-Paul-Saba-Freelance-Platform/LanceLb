import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Auth.css'

const SignUp = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'freelancer'
    })
    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const validateForm = () => {
        const nextErrors = {}

        if (!formData.name.trim()) nextErrors.name = 'Name is required'
        if (!formData.email.trim()) {
            nextErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            nextErrors.email = 'Email is invalid'
        }
        if (!formData.password) {
            nextErrors.password = 'Password is required'
        } else if (formData.password.length < 6) {
            nextErrors.password = 'Password must be at least 6 characters'
        }
        if (!formData.confirmPassword) {
            nextErrors.confirmPassword = 'Please confirm your password'
        } else if (formData.password !== formData.confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match'
        }

        setErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!validateForm()) return

        // TODO: Add signup logic here
        console.log('Signup attempt:', formData)
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p className="auth-subtitle">Join us and start your freelance journey</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="auth-input"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="auth-input"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="userType">I am a</label>
                        <select
                            id="userType"
                            name="userType"
                            className="auth-input"
                            value={formData.userType}
                            onChange={handleChange}
                        >
                            <option value="freelancer">Freelancer</option>
                            <option value="client">Client / Employer</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="auth-input"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="auth-input"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        {errors.confirmPassword && (
                            <span className="error-message">{errors.confirmPassword}</span>
                        )}
                    </div>

                    <div className="form-options">
                        <label className="checkbox-label">
                            <input type="checkbox" required />
                            <span>
                                I agree to the{' '}
                                <a href="#" onClick={(e) => e.preventDefault()}>
                                    Terms & Conditions
                                </a>
                            </span>
                        </label>
                    </div>

                    <button type="submit" className="auth-button-primary">
                        Create Account
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SignUp
 