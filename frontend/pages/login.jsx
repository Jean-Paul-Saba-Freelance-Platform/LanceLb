import React, { useState } from 'react'
import './login.css'

const Login = ({ onSwitchToSignup }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // TODO: Add login logic here
        console.log('Login attempt:', formData)
    }

    return (
        <div className="login-container">
            <div className="login-card glass-card">
                <div className="login-header">
                    <h1>Welcome Back</h1>
                    <p className="login-subtitle">Sign in to find your next freelance opportunity</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
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
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="glass-input"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-options">
                        <label className="remember-me">
                            <input type="checkbox" />
                            <span>Remember me</span>
                        </label>
                        <a href="#" className="forgot-password">Forgot password?</a>
                    </div>

                    <button type="submit" className="glass-button login-button">
                        Sign In
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        Don't have an account?{' '}
                        <a href="#" className="signup-link" onClick={(e) => {
                            e.preventDefault()
                            if (onSwitchToSignup) onSwitchToSignup()
                        }}>Sign up</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login

