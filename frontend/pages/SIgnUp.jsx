import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Grainient from '../src/components/Grainient'
import './Auth.css'

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const SignUp = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'freelancer'
    })
    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})

    const validateField = (name, value, allFields = formData) => {
        switch (name) {
            case 'name':
                if (!value.trim()) return 'Full name is required'
                if (!NAME_REGEX.test(value.trim())) return 'Name must be 2–50 characters and contain only letters, spaces, hyphens, or apostrophes'
                return ''
            case 'email':
                if (!value.trim()) return 'Email is required'
                if (!EMAIL_REGEX.test(value)) return 'Enter a valid email (e.g. user@example.com)'
                return ''
            case 'password':
                if (!value) return 'Password is required'
                if (value.length < 8) return 'Password must be at least 8 characters'
                if (!PASSWORD_REGEX.test(value)) return 'Must include an uppercase letter, a lowercase letter, and a number'
                return ''
            case 'confirmPassword':
                if (!value) return 'Please confirm your password'
                if (value !== allFields.password) return 'Passwords do not match'
                return ''
            default:
                return ''
        }
    }

    const validateAll = (fields = formData) => {
        const errs = {}
        for (const key of ['name', 'email', 'password', 'confirmPassword']) {
            const msg = validateField(key, fields[key], fields)
            if (msg) errs[key] = msg
        }
        return errs
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        const updated = { ...formData, [name]: value }
        setFormData(updated)

        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value, updated) }))
        }
        if (name === 'password' && touched.confirmPassword && updated.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: validateField('confirmPassword', updated.confirmPassword, updated) }))
        }
    }

    const handleBlur = (e) => {
        const { name, value } = e.target
        setTouched(prev => ({ ...prev, [name]: true }))
        setErrors(prev => ({ ...prev, [name]: validateField(name, value, formData) }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const allTouched = { name: true, email: true, password: true, confirmPassword: true }
        setTouched(allTouched)
        const errs = validateAll()
        setErrors(errs)
        if (Object.keys(errs).length > 0) return

        try{
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    userType: formData.userType
                })
            })
            
            console.log("Response status:", response.status);
            const data = await response.json()
            console.log("Response data:", data);
            
            if(!response.ok){
                throw new Error(data.message || 'Registration failed')
            }
            
            const { token, user } = data
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            
            // Redirect to OTP verification
            navigate('/verify-otp')
        } catch (error) {
            console.error('Registration error:', error)
            setErrors({ submit: error.message })
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
                <form onSubmit={handleSubmit} className="auth-form">
                    {errors.submit && <div className="error-message-global">{errors.submit}</div>}

                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className={`auth-input${errors.name && touched.name ? ' input-error' : ''}`}
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />
                        {errors.name && touched.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`auth-input${errors.email && touched.email ? ' input-error' : ''}`}
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />
                        {errors.email && touched.email && <span className="error-message">{errors.email}</span>}
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
                            className={`auth-input${errors.password && touched.password ? ' input-error' : ''}`}
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />
                        {errors.password && touched.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className={`auth-input${errors.confirmPassword && touched.confirmPassword ? ' input-error' : ''}`}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />
                        {errors.confirmPassword && touched.confirmPassword && (
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

                <div className="auth-divider"><span>or</span></div>

                <a
                    href={`${API_BASE}/api/auth/google?userType=${formData.userType}`}
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
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SignUp
 