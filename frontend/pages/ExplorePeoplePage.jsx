import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, MessageCircle, UserCheck, UserPlus, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import TopNav from '../src/components/TopNav'
import './ExplorePeoplePage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

const EXPERIENCE_LABELS = { entry: 'Entry', intermediate: 'Mid-Level', expert: 'Expert' }
const EXPERIENCE_COLORS = { entry: '#10b981', intermediate: '#fbbf24', expert: '#f87171' }

const getInitial = (name) => (name || '?').charAt(0).toUpperCase()

// ---------------------------------------------------------------------------
// PeopleCard — single user card with inline follow + message actions
// ---------------------------------------------------------------------------

const PeopleCard = ({ person, myType, index }) => {
  const navigate = useNavigate()
  const [outgoing, setOutgoing] = useState(null)  // null | 'requested' | 'accepted'
  const [incoming, setIncoming] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/follow/status/${person._id}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (!cancelled && data.success) {
          setOutgoing(data.outgoing)
          setIncoming(data.incoming)
        }
      } catch {
        // silent — defaults to null
      } finally {
        if (!cancelled) setStatusLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [person._id])

  // Follow / unfollow handler
  const handleFollow = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (!outgoing) {
        const res = await fetch(`${API_BASE}/api/follow/${person._id}`, {
          method: 'POST', credentials: 'include', headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (data.success) setOutgoing('requested')
      } else {
        const res = await fetch(`${API_BASE}/api/follow/${person._id}`, {
          method: 'DELETE', credentials: 'include', headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (data.success) setOutgoing(null)
      }
    } catch {
      // ignore
    } finally {
      setBusy(false)
    }
  }

  // Navigate to DM — go to the messages page (conversation opens there)
  const handleMessage = () => {
    const messagesPath = myType === 'freelancer' ? '/freelancer/messages' : '/client/messages'
    navigate(messagesPath)
  }

  // Navigate to profile based on userTypes
  const handleViewProfile = () => {
    if (myType === 'client' && person.userType === 'freelancer') {
      navigate(`/client/freelancer-profile/${person._id}`)
    } else if (myType === 'freelancer' && person.userType === 'client') {
      navigate(`/freelancer/client-profile/${person._id}`)
    } else if (myType === 'client' && person.userType === 'client') {
      navigate(`/client/client-profile/${person._id}`)
    } else {
      navigate(`/freelancer/freelancer-profile/${person._id}`)
    }
  }

  const canMessage = outgoing === 'accepted' || incoming === 'accepted'
  const followLabel = outgoing === 'accepted' ? 'Following' : outgoing === 'requested' ? 'Requested' : 'Follow'
  const followMod = outgoing === 'accepted' ? 'following' : outgoing === 'requested' ? 'requested' : 'default'

  return (
    <motion.div
      className="ep-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      {/* Avatar + type badge */}
      <div className="ep-card-top">
        <div className="ep-avatar" onClick={handleViewProfile}>
          {person.profilePicture
            ? <img src={person.profilePicture} alt={person.name} />
            : <span className="ep-avatar-initial">{getInitial(person.name)}</span>
          }
        </div>
        <span className={`ep-type-badge ep-type-${person.userType}`}>
          {person.userType === 'freelancer' ? 'Freelancer' : 'Client'}
        </span>
      </div>

      {/* Info */}
      <div className="ep-card-body" onClick={handleViewProfile}>
        <h3 className="ep-name">{person.name}</h3>
        {person.title && <p className="ep-title">{person.title}</p>}
        {person.bio && <p className="ep-bio">{person.bio}</p>}
      </div>

      {/* Skills */}
      {person.skills?.length > 0 && (
        <div className="ep-skills">
          {person.skills.slice(0, 3).map((s) => (
            <span key={s} className="ep-skill-chip">{s}</span>
          ))}
          {person.skills.length > 3 && (
            <span className="ep-skill-chip ep-skill-more">+{person.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Experience */}
      {person.experienceLevel && (
        <div className="ep-exp">
          <span
            className="ep-exp-dot"
            style={{ background: EXPERIENCE_COLORS[person.experienceLevel] }}
          />
          <span className="ep-exp-label">{EXPERIENCE_LABELS[person.experienceLevel]}</span>
        </div>
      )}

      {/* Actions */}
      <div className="ep-card-actions">
        {statusLoading ? (
          <button className="ep-btn ep-btn-ghost" disabled>···</button>
        ) : (
          <button
            className={`ep-btn ep-btn-follow ep-btn-follow--${followMod}`}
            onClick={handleFollow}
            disabled={busy}
          >
            {busy ? '···' : (
              <>
                {outgoing === 'accepted'
                  ? <UserCheck size={14} />
                  : outgoing === 'requested'
                  ? <Clock size={14} />
                  : <UserPlus size={14} />
                }
                {followLabel}
              </>
            )}
          </button>
        )}

        <button
          className={`ep-btn ep-btn-msg ${canMessage ? '' : 'ep-btn-msg--disabled'}`}
          onClick={canMessage ? handleMessage : undefined}
          disabled={!canMessage}
          title={canMessage ? 'Send a message' : 'Follow each other to message'}
        >
          <MessageCircle size={14} />
          Message
        </button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// ExplorePeoplePage
// ---------------------------------------------------------------------------

const FILTER_TYPES = [
  { label: 'Everyone', value: '' },
  { label: 'Freelancers', value: 'freelancer' },
  { label: 'Clients', value: 'client' },
]

const FILTER_EXP = [
  { label: 'Any Level', value: '' },
  { label: 'Entry', value: 'entry' },
  { label: 'Mid-Level', value: 'intermediate' },
  { label: 'Expert', value: 'expert' },
]

const ExplorePeoplePage = () => {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const myType = user?.userType

  const [people, setPeople] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [userType, setUserType] = useState('')
  const [experienceLevel, setExpLevel] = useState('')

  const debounceRef = useRef(null)

  const fetchPeople = useCallback(async (params) => {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams()
      if (params.search)          qs.set('search', params.search)
      if (params.userType)        qs.set('userType', params.userType)
      if (params.experienceLevel) qs.set('experienceLevel', params.experienceLevel)
      qs.set('page', params.page)
      qs.set('limit', 12)

      const res = await fetch(`${API_BASE}/api/follow/explore?${qs}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to load people')
      setPeople(data.users)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchPeople({ search, userType, experienceLevel, page })
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search; instant for filters
  const handleSearchChange = (val) => {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchPeople({ search: val, userType, experienceLevel, page: 1 })
    }, 350)
  }

  const handleFilter = (key, val) => {
    const next = { search, userType, experienceLevel, page: 1, [key]: val }
    if (key === 'userType') setUserType(val)
    if (key === 'experienceLevel') setExpLevel(val)
    setPage(1)
    fetchPeople(next)
  }

  const handlePage = (p) => {
    setPage(p)
    fetchPeople({ search, userType, experienceLevel, page: p })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="ep-page">
      <TopNav userName={user?.name} userAvatar={user?.profilePicture} />

      <div className="ep-content">
        {/* Header */}
        <motion.div
          className="ep-header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="ep-header-text">
            <h1 className="ep-heading">Explore People</h1>
            <p className="ep-subheading">
              {total > 0 ? `${total} member${total !== 1 ? 's' : ''} on LanceLB` : 'Discover talent and clients'}
            </p>
          </div>

          {/* Search */}
          <div className="ep-search-wrap">
            <Search size={16} className="ep-search-icon" />
            <input
              type="text"
              className="ep-search-input"
              placeholder="Search by name, title, or skill…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Filters */}
        <div className="ep-filters">
          <div className="ep-filter-group">
            {FILTER_TYPES.map((f) => (
              <button
                key={f.value}
                className={`ep-filter-chip ${userType === f.value ? 'active' : ''}`}
                onClick={() => handleFilter('userType', f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="ep-filter-group">
            {FILTER_EXP.map((f) => (
              <button
                key={f.value}
                className={`ep-filter-chip ${experienceLevel === f.value ? 'active' : ''}`}
                onClick={() => handleFilter('experienceLevel', f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="ep-skeleton-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="ep-skeleton-card" />
            ))}
          </div>
        ) : error ? (
          <div className="ep-empty">
            <p className="ep-empty-msg">{error}</p>
          </div>
        ) : people.length === 0 ? (
          <div className="ep-empty">
            <Users size={40} className="ep-empty-icon" />
            <p className="ep-empty-msg">No people found matching your filters.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <div className="ep-grid">
              {people.map((person, i) => (
                <PeopleCard
                  key={person._id}
                  person={person}
                  myType={myType}
                  index={i}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {pages > 1 && !loading && (
          <div className="ep-pagination">
            <button
              className="ep-page-btn"
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1}
            >
              ← Prev
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`ep-page-btn ${p === page ? 'active' : ''}`}
                onClick={() => handlePage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="ep-page-btn"
              onClick={() => handlePage(page + 1)}
              disabled={page >= pages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExplorePeoplePage
