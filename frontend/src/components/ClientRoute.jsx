import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import AccountBlockedScreen from './AccountBlockedScreen'

const ClientRoute = ({ children }) => {
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
    if (!user || user.userType !== 'client' || !user.isAccountVerified) {
      setStatusCheck({ loading: false, blockData: null })
      return
    }

    const token = localStorage.getItem('token')
    fetch('/api/client/dashboard/summary', {
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
  if (user.userType !== 'client') return <Navigate to="/freelancer/home" replace />

  if (statusCheck.loading) return null

  if (statusCheck.blockData) {
    const { statusType, reason, timeoutUntil } = statusCheck.blockData
    return <AccountBlockedScreen statusType={statusType} reason={reason} timeoutUntil={timeoutUntil} />
  }

  return children
}

export default ClientRoute
