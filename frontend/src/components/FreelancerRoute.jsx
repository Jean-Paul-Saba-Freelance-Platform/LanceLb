import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import AccountBlockedScreen from './AccountBlockedScreen'

const FreelancerRoute = ({ children }) => {
  const [statusCheck, setStatusCheck] = useState({ loading: true, blockData: null })

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  }

  const user = getUserFromStorage()

  useEffect(() => {
    if (!user || user.userType !== 'freelancer' || !user.isAccountVerified) {
      setStatusCheck({ loading: false, blockData: null })
      return
    }

    const token = localStorage.getItem('token')
    fetch('/api/freelancer/stats', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (res.status === 403) {
          const data = await res.json()
          if (data.statusType === 'banned' || data.statusType === 'timeout') {
            setStatusCheck({ loading: false, blockData: data })
            return
          }
        }
        setStatusCheck({ loading: false, blockData: null })
      })
      .catch(() => setStatusCheck({ loading: false, blockData: null }))
  }, [])

  if (!user) return <Navigate to="/login" replace />
  if (!user.isAccountVerified) return <Navigate to="/verify-otp" replace />
  if (user.userType !== 'freelancer') return <Navigate to="/client/home" replace />

  if (statusCheck.loading) return null

  if (statusCheck.blockData) {
    const { statusType, reason, timeoutUntil } = statusCheck.blockData
    return <AccountBlockedScreen statusType={statusType} reason={reason} timeoutUntil={timeoutUntil} />
  }

  return children
}

export default FreelancerRoute
