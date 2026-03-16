import { Navigate } from 'react-router-dom'

/**
 * Wraps public auth pages (/login, /signup, /verify-otp).
 * If the user is already logged in, redirects them directly to their dashboard
 * so they never see the login/signup screen while authenticated.
 */
const AuthRedirect = ({ children }) => {
  const getUserFromStorage = () => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const user = getUserFromStorage()
  const token = localStorage.getItem('token')

  // Both user object and token must exist to be considered logged in
  if (user && token) {
    const destination =
      user.userType === 'client' ? '/client/home' : '/freelancer/home'
    return <Navigate to={destination} replace />
  }

  return children
}

export default AuthRedirect
