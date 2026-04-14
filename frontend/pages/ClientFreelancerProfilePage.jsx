import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const { freelancerId } = useParams()

  const [freelancer, setFreelancer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState([])

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

        try {
          const res = await fetch(`${API_BASE}/api/reviews/user/${freelancerId}`)
          const data = await res.json()
          if (data.success) setReviews(data.reviews)
        } catch {}
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [freelancerId])

  const backRoute = location.state?.backRoute || '/client/explore'

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
                {reviews.length > 0 && (
                  <div className="cfp-rating-row">
                    <span className="cfp-rating-stars">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} style={{ color: s <= Math.round(reviews.reduce((sum,r) => sum + r.rating, 0) / reviews.length) ? '#fbbf24' : 'rgba(255,255,255,0.2)', fontSize: '1rem' }}>★</span>
                      ))}
                    </span>
                    <span className="cfp-rating-score">
                      {(reviews.reduce((sum,r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                    </span>
                    <span className="cfp-rating-count">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                  </div>
                )}
                {/* Follower / Following counts */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    <strong style={{ color: '#f3f4f6' }}>{freelancer.followersCount ?? 0}</strong> followers
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    <strong style={{ color: '#f3f4f6' }}>{freelancer.followingCount ?? 0}</strong> following
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

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="cfp-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <h2 className="cfp-section-title" style={{ margin: 0 }}>Reviews</h2>
                  <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 600 }}>
                    ★ {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="fp-reviews-list">
                  {reviews.map((r) => (
                    <div key={r._id} className="fp-review-item">
                      <div className="fp-review-header">
                        <div className="fp-review-avatar">
                          {r.reviewerId?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="fp-review-meta">
                          <span className="fp-review-name">{r.reviewerId?.name || 'Anonymous'}</span>
                          <span className="fp-review-project">{r.projectId?.title || 'Project'}</span>
                        </div>
                        <div className="fp-review-stars">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} style={{ color: s <= r.rating ? '#fbbf24' : 'rgba(255,255,255,0.15)', fontSize: '0.95rem' }}>★</span>
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="fp-review-comment">{r.comment}</p>}
                      <span className="fp-review-date">
                        {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
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

export default ClientFreelancerProfilePage
