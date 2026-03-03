import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './FreelancerClientProfilePage.css'

const API_BASE = 'http://127.0.0.1:4000'

const getUserName = () => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      return user.name?.split(' ')[0] || user.firstName || 'Freelancer'
    }
  } catch (error) {
    console.error('Error loading user:', error)
  }
  return 'Freelancer'
}

const getDisplayName = (client) => {
  if (!client) return 'Client'
  const full = `${client.firstName || ''} ${client.lastName || ''}`.trim()
  return full || client.name || 'Client'
}

const FreelancerClientProfilePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { clientId } = useParams()
  const initialClient = location.state?.client || null

  const [client, setClient] = useState(initialClient)
  const [loading, setLoading] = useState(!initialClient)

  useEffect(() => {
    if (!clientId || clientId === 'unknown') {
      setLoading(false)
      return
    }

    if (initialClient?.name || initialClient?.firstName || initialClient?.email) {
      setLoading(false)
      return
    }

    const fetchClient = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(`${API_BASE}/api/message/user`, {
          credentials: 'include',
          headers,
        })
        const data = await res.json()
        if (!res.ok || !Array.isArray(data)) return
        const found = data.find((u) => String(u._id || u.id) === String(clientId))
        if (found) setClient(found)
      } catch (error) {
        console.error('Error loading client profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClient()
  }, [clientId, initialClient])

  const displayName = useMemo(() => getDisplayName(client), [client])

  return (
    <div className="freelancer-client-profile-page">
      <TopNav userName={getUserName()} />

      <div className="freelancer-client-profile-container">
        <div className="freelancer-client-profile-card">
          <button
            className="freelancer-client-profile-back"
            onClick={() => navigate('/freelancer/home')}
          >
            ← Back to Home
          </button>

          <h1 className="freelancer-client-profile-title">Client Profile</h1>

          {loading ? (
            <p className="freelancer-client-profile-subtitle">Loading client info...</p>
          ) : (
            <>
              <div className="freelancer-client-profile-summary">
                <div className="freelancer-client-profile-avatar">
                  {(displayName || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2>{displayName}</h2>
                  <p>{client?.email || 'Email unavailable'}</p>
                  <p>{client?.location || 'Location unavailable'}</p>
                </div>
              </div>

              <p className="freelancer-client-profile-subtitle">
                More public client profile details will appear here as the profile module expands.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default FreelancerClientProfilePage
