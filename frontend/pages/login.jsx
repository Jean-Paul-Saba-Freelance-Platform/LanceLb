import { useState } from 'react'
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

                <div className="auth-divider"><span>or</span></div>

                <a
                    href={`${API_BASE}/api/auth/google`}
                    className="auth-button-google"
                >
                    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continue with Google
                </a>

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

