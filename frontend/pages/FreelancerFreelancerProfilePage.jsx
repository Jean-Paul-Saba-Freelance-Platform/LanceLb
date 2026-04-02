import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import FollowButton from '../src/components/FollowButton.jsx'
import TopNav from '../src/components/TopNav.jsx'
import './ClientFreelancerProfilePage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const EXPERIENCE_LABELS = {
  entry: 'Entry Level',
  intermediate: 'Intermediate',
  expert: 'Expert',
}

const getInitial = (name) => (name || 'F').charAt(0).toUpperCase()

/**
 * FreelancerFreelancerProfilePage
 *
 * Lets a freelancer view another user's public profile from /explore and send/manage a follow request.
 */
const FreelancerFreelancerProfilePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { freelancerId } = useParams()

  const [freelancer, setFreelancer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!freelancerId) return

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/follow/user/${freelancerId}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load profile')
        setFreelancer(data.user)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [freelancerId])

  const backRoute = location.state?.backRoute || '/freelancer/explore'

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  })()
  const currentUserName = currentUser?.name || currentUser?.firstName || 'Freelancer'

  return (
    <div className="cfp-page">
      <TopNav userName={currentUserName} />
      <div className="cfp-container">
        <button className="cfp-back" onClick={() => navigate(backRoute)}>
          ← Back
        </button>

        {loading && (
          <div className="cfp-skeleton">
            <div className="cfp-skeleton-avatar" />
            <div className="cfp-skeleton-lines">
              <div className="cfp-skeleton-line cfp-skeleton-line--wide" />
              <div className="cfp-skeleton-line" />
              <div className="cfp-skeleton-line cfp-skeleton-line--narrow" />
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="cfp-error">
            <p>{error}</p>
            <button className="cfp-back" onClick={() => navigate(backRoute)}>Go back</button>
          </div>
        )}

        {freelancer && !loading && (
          <motion.div
            className="cfp-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="cfp-header">
              <div className="cfp-avatar">
                {freelancer.profilePicture ? (
                  <img src={freelancer.profilePicture} alt={freelancer.name} />
                ) : (
                  <span>{getInitial(freelancer.name)}</span>
                )}
              </div>
              <div className="cfp-identity">
                <h1 className="cfp-name">{freelancer.name}</h1>
                {freelancer.title && <p className="cfp-title">{freelancer.title}</p>}
                <div className="cfp-meta-row">
                  {freelancer.experienceLevel && (
                    <span className="cfp-badge cfp-badge--exp">
                      {EXPERIENCE_LABELS[freelancer.experienceLevel] || freelancer.experienceLevel}
                    </span>
                  )}
                  <span className="cfp-badge cfp-badge--type">
                    {freelancer.userType === 'client' ? 'Client' : 'Freelancer'}
                  </span>
                </div>
                {/* Follower / Following counts */}
                <div className="cfp-follow-counts">
                  <span className="cfp-follow-item">
                    <strong className="cfp-follow-num">{freelancer.followersCount ?? 0}</strong>
                    <span className="cfp-follow-label">followers</span>
                  </span>
                  <span className="cfp-follow-item">
                    <strong className="cfp-follow-num">{freelancer.followingCount ?? 0}</strong>
                    <span className="cfp-follow-label">following</span>
                  </span>
                </div>
              </div>
              <div className="cfp-actions">
                <FollowButton targetUserId={freelancerId} />
              </div>
            </div>

            {/* Bio */}
            {freelancer.bio && (
              <div className="cfp-section">
                <h2 className="cfp-section-title">About</h2>
                <p className="cfp-bio">{freelancer.bio}</p>
              </div>
            )}

            {/* Skills */}
            {Array.isArray(freelancer.skills) && freelancer.skills.length > 0 && (
              <div className="cfp-section">
                <h2 className="cfp-section-title">Skills</h2>
                <div className="cfp-skills">
                  {freelancer.skills.map((skill) => (
                    <span key={skill} className="cfp-skill-pill">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Member since */}
            <div className="cfp-footer">
              <span className="cfp-member-since">
                Member since {freelancer.createdAt
                  ? new Date(freelancer.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'Recently joined'}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default FreelancerFreelancerProfilePage
