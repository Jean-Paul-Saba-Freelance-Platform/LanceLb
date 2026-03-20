import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import FollowButton from '../src/components/FollowButton.jsx'
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
 * ClientFreelancerProfilePage
 *
 * Lets a client view a freelancer's public profile and send/manage a follow request.
 */
const ClientFreelancerProfilePage = () => {
  const navigate = useNavigate()
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

  const backRoute = '/client/home'

  return (
    <div className="cfp-page">
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
                  <span className="cfp-badge cfp-badge--type">Freelancer</span>
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
                Member since {new Date(freelancer.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ClientFreelancerProfilePage
