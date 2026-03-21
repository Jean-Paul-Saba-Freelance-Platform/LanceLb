import { Navigate } from 'react-router-dom'

/**
 * Route guard component that protects freelancer-only routes
 * Checks localStorage for user data and validates role
 */
const FreelancerRoute = ({ children }) => {
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

  // If user is not a freelancer (e.g. client), redirect to their home
  // Note: field is userType, not role — align with how ClientRoute and auth store it
  if (user.userType !== 'freelancer') {
    return <Navigate to="/client/home" replace />
  }

  // User is a freelancer, render the protected content
  return children
}

export default FreelancerRoute
