import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// Handles the redirect from /api/auth/google/callback.
// Reads token + user from query params, stores them, then navigates home.
export default function GoogleAuthSuccess() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    useEffect(() => {
        const token = searchParams.get('token')
        const userRaw = searchParams.get('user')
        const error = searchParams.get('error')

        if (error || !token || !userRaw) {
            navigate('/login?error=google_failed', { replace: true })
            return
        }

        try {
            const user = JSON.parse(userRaw)
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))

            const destination = user.userType === 'client' ? '/client/home' : '/freelancer/home'
            navigate(destination, { replace: true })
        } catch {
            navigate('/login?error=google_failed', { replace: true })
        }
    }, [searchParams, navigate])

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111B21', color: '#e9edef' }}>
            Signing you in...
        </div>
    )
}
