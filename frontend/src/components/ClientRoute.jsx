import { Navigate } from 'react-router-dom'

/**
 * Route guard component that protects client-only routes
 * Checks localStorage for user data and validates userType
 * 
 * Redirects:
 * - If not logged in -> /login
 * - If userType is 'freelancer' -> /freelancer/home
 * - If userType is 'client' -> allows access
 */
const ClientRoute = ({ children }) => {
  // Get user from localStorage
  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        return JSON.parse(userStr)
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
    }
    return null
  }

  const user = getUserFromStorage()

  // If no user found, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If user is not a client, redirect to freelancer home
  if (user.userType !== 'client') {
    return <Navigate to="/freelancer/home" replace />
  }

  // User is a client, render the protected content
  return children
}

export default ClientRoute
