import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import FollowButton from '../src/components/FollowButton.jsx'
import TopNav from '../src/components/TopNav.jsx'
import './FreelancerClientProfilePage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const getInitial = (name) => (name || 'C').charAt(0).toUpperCase()

/**
 * FreelancerClientProfilePage
 *
 * Lets a freelancer view a client's public profile and follow them.
 */
const FreelancerClientProfilePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { clientId } = useParams()

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!clientId || clientId === 'unknown') {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/follow/user/${clientId}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load profile')
        setClient(data.user)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [clientId])

  const backRoute = location.state?.backRoute || (() => {
    const userStr = localStorage.getItem('user')
    const currentUser = userStr ? JSON.parse(userStr) : null
    return currentUser?.userType === 'client' ? '/client/explore' : '/freelancer/explore'
  })()

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  })()
  const currentUserName = currentUser?.name || currentUser?.firstName || 'Freelancer'

  return (
    <div className="fcp-page">
      <TopNav userName={currentUserName} />
      <div className="fcp-container">
        <button className="fcp-back" onClick={() => navigate(backRoute)}>
          ← Back
        </button>

        {loading && (
          <div className="fcp-skeleton">
            <div className="fcp-skeleton-avatar" />
            <div className="fcp-skeleton-lines">
              <div className="fcp-skeleton-line fcp-skeleton-line--wide" />
              <div className="fcp-skeleton-line" />
              <div className="fcp-skeleton-line fcp-skeleton-line--narrow" />
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="fcp-error">
            <p>{error}</p>
          </div>
        )}

        {client && !loading && (
          <motion.div
            className="fcp-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="fcp-header">
              <div className="fcp-avatar">
                {client.profilePicture ? (
                  <img src={client.profilePicture} alt={client.name} />
                ) : (
                  <span>{getInitial(client.name)}</span>
                )}
              </div>
              <div className="fcp-identity">
                <h1 className="fcp-name">{client.name}</h1>
                {client.title && <p className="fcp-title">{client.title}</p>}
                <div className="fcp-meta-row">
                  <span className="fcp-badge fcp-badge--type">Client</span>
                </div>
                {/* Follower / Following counts */}
                <div className="fcp-follow-counts">
                  <span className="fcp-follow-item">
                    <strong className="fcp-follow-num">{client.followersCount ?? 0}</strong>
                    <span className="fcp-follow-label">followers</span>
                  </span>
                  <span className="fcp-follow-item">
                    <strong className="fcp-follow-num">{client.followingCount ?? 0}</strong>
                    <span className="fcp-follow-label">following</span>
                  </span>
                </div>
              </div>
              <div className="fcp-actions">
                <FollowButton targetUserId={clientId} />
              </div>
            </div>

            {/* Bio */}
            {client.bio && (
              <div className="fcp-section">
                <h2 className="fcp-section-title">About</h2>
                <p className="fcp-bio">{client.bio}</p>
              </div>
            )}

            {/* Skills / Interests */}
            {Array.isArray(client.skills) && client.skills.length > 0 && (
              <div className="fcp-section">
                <h2 className="fcp-section-title">Interests</h2>
                <div className="fcp-skills">
                  {client.skills.map((skill) => (
                    <span key={skill} className="fcp-skill-pill">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Member since */}
            <div className="fcp-footer">
              <span className="fcp-member-since">
                Member since {client.createdAt
                  ? new Date(client.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'Recently joined'}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default FreelancerClientProfilePage
