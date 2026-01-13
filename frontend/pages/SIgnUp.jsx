import React, { useState } from 'react'
import './signUp.css'

const SignUp = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'freelancer'
    })

    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        // Clear error when user starts typing
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            })
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters'
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (validateForm()) {
            // TODO: Add signup logic here
            console.log('Signup attempt:', formData)
        }
    }

    return (
        <div className="signup-container">
            <div className="signup-card glass-card">
                <div className="signup-header">
                    <h1>Create Account</h1>
                    <p className="signup-subtitle">Join us and start your freelance journey</p>
                </div>

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="glass-input"
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
                            className="glass-input"
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
                            className="glass-input"
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
                            className="glass-input"
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
                            className="glass-input"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>

                    <div className="form-options">
                        <label className="terms-checkbox">
                            <input type="checkbox" required />
                            <span>I agree to the <a href="#">Terms & Conditions</a></span>
                        </label>
                    </div>

                    <button type="submit" className="glass-button signup-button">
                        Create Account
                    </button>
                </form>

                <div className="signup-footer">
                    <p>
                        Already have an account?{' '}
                        <a href="#" className="login-link" onClick={(e) => {
                            e.preventDefault()
                            if (onSwitchToLogin) onSwitchToLogin()
                        }}>Sign in</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SignUp

