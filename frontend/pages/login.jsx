import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Grainient from '../src/components/Grainient'
import './Auth.css'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'


const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const Login = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [touched, setTouched] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const validate = (fields = formData) => {
        const errs = {}
        if (!fields.email.trim()) {
            errs.email = 'Email is required'
        } else if (!EMAIL_REGEX.test(fields.email)) {
            errs.email = 'Enter a valid email (e.g. user@example.com)'
        }
        if (!fields.password) {
            errs.password = 'Password is required'
        } else if (fields.password.length < 6) {
            errs.password = 'Password must be at least 6 characters'
        }
        return errs
    }

    const handleChange = (e) => {
        const updated = { ...formData, [e.target.name]: e.target.value }
        setFormData(updated)
        if (error) setError('')
        if (touched[e.target.name]) {
            setFieldErrors(prev => {
                const errs = validate(updated)
                return { ...prev, [e.target.name]: errs[e.target.name] || '' }
            })
        }
    }

    const handleBlur = (e) => {
        setTouched(prev => ({ ...prev, [e.target.name]: true }))
        const errs = validate(formData)
        setFieldErrors(prev => ({ ...prev, [e.target.name]: errs[e.target.name] || '' }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        setFieldErrors(errs)
        setTouched({ email: true, password: true })
        if (Object.keys(errs).length > 0) return

        setIsSubmitting(true)
        setError('')

        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Login failed')
            }

            const { token, user } = data
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            
            // Redirect to verification if not verified
            if (!user.isAccountVerified) {
                navigate('/verify-otp')
                return
            }

            // Redirect based on user type
            if (user.userType === 'freelancer') {
                navigate('/freelancer/home')
            } else if (user.userType === 'client') {
                navigate('/client/home')
            } else {
                navigate('/')
            }
        } catch (error) {
            console.error('Login error:', error)
            setError(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-dither">
                <Grainient
                    color1="#00A884"
                    color2="#111B21"
                    color3="#202C33"
                    timeSpeed={0.25}
                    colorBalance={0}
                    warpStrength={1}
                    warpFrequency={5}
                    warpSpeed={2}
                    warpAmplitude={50}
                    blendAngle={0}
                    blendSoftness={0.05}
                    rotationAmount={500}
                    noiseScale={2}
                    grainAmount={0.1}
                    grainScale={2}
                    grainAnimated={false}
                    contrast={1.5}
                    gamma={1}
                    saturation={1}
                    centerX={0}
                    centerY={0}
                    zoom={0.9}
                />
            </div>
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Sign In</h1>
                    <p className="auth-subtitle">Welcome back to LanceLB</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="error-message-global">{error}</div>}
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`auth-input${fieldErrors.email && touched.email ? ' input-error' : ''}`}
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />
                        {fieldErrors.email && touched.email && (
                            <span className="error-message">{fieldErrors.email}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className={`auth-input${fieldErrors.password && touched.password ? ' input-error' : ''}`}
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />
                        {fieldErrors.password && touched.password && (
                            <span className="error-message">{fieldErrors.password}</span>
                        )}
                    </div>

                    <div className="form-options">
                        <label className="checkbox-label">
                            <input type="checkbox" />
                            <span>Remember me</span>
                        </label>
                        <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>
                            Forgot password?
                        </a>
                    </div>

                    <button 
                        type="submit" 
                        className="auth-button-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/signup" className="auth-link">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login

