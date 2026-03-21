import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HelpCircle, Bell } from 'lucide-react'
import ProfileDropdown from './ProfileDropdown'
import './TopNav.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const TopNav = ({ userName, userAvatar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [respondingTo, setRespondingTo] = useState(null)
  const [followBackStates, setFollowBackStates] = useState({})
  const notifRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const brandLink = user?.userType === 'freelancer'
    ? '/freelancer/home'
    : user?.userType === 'client'
      ? '/client/home'
      : '/'
  const menuLinks = user?.userType === 'freelancer'
    ? [
      { label: 'Find Work', to: '/freelancer/find-work' },
      { label: 'Explore', to: '/freelancer/explore' },
      { label: 'Messages', to: '/freelancer/messages' },
      { label: 'My Proposals', to: '/freelancer/proposals' },
      { label: 'Projects', to: '/freelancer/projects' },
    ]
    : [
      { label: 'Home', to: '/client/home' },
      { label: 'Explore', to: '/client/explore' },
      { label: 'Messages', to: '/client/messages' },
      { label: 'Manage Jobs', to: '/client/jobs' },
      { label: 'Projects', to: '/client/projects' },
      { label: 'Post Job', to: '/client/post-job' },
    ]

  const authHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        credentials: 'include',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Listen for real-time notifications forwarded from Socket.io
  useEffect(() => {
    const handler = (e) => {
      const notif = e.detail
      setNotifications(prev => [notif, ...prev])
      setUnreadCount(c => c + 1)
    }
    window.addEventListener('lancelb:notification', handler)
    return () => window.removeEventListener('lancelb:notification', handler)
  }, [])

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return
    const handler = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileMenuOpen])

  const openNotifications = async () => {
    const opening = !showNotifications
    setShowNotifications(opening)
    if (opening && unreadCount > 0) {
      try {
        await fetch(`${API_BASE}/api/notifications/read-all`, {
          method: 'PATCH',
          credentials: 'include',
          headers: authHeaders(),
        })
        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      } catch {}
    }
  }

  const handleFollowResponse = async (followId, notifId, action) => {
    setRespondingTo(notifId)
    try {
      const res = await fetch(`${API_BASE}/api/follow/${followId}/respond`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) {
        // Remove from React state immediately
        setNotifications(prev => prev.filter(n => n._id !== notifId))
        // Also delete from DB so it doesn't come back on re-fetch
        await fetch(`${API_BASE}/api/notifications/${notifId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: authHeaders(),
        })
      }
    } catch {}
    setRespondingTo(null)
  }

  const handleFollowBack = async (targetUserId, notifId) => {
    setFollowBackStates(prev => ({ ...prev, [notifId]: 'loading' }))
    try {
      const res = await fetch(`${API_BASE}/api/follow/${targetUserId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      })
      const data = await res.json()
      if (data.success) {
        setFollowBackStates(prev => ({ ...prev, [notifId]: 'requested' }))
        // Delete the notification from DB so it doesn't reappear on re-fetch
        await fetch(`${API_BASE}/api/notifications/${notifId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: authHeaders(),
        })
        // Remove from local state after short delay so user sees "Request sent ✓"
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n._id !== notifId))
        }, 2000)
      } else {
        // Reset on failure
        setFollowBackStates(prev => ({ ...prev, [notifId]: null }))
      }
    } catch {
      setFollowBackStates(prev => ({ ...prev, [notifId]: null }))
    }
  }

  const notifIcon = (type) => {
    if (type === 'application_accepted') return '✓'
    if (type === 'application_rejected') return '✕'
    if (type === 'task_validated') return '★'
    if (type === 'task_completed') return '◎'
    if (type === 'project_started') return '▶'
    if (type === 'follow_request') return '👤'
    if (type === 'follow_accepted') return '✓'
    if (type === 'follow_back_suggestion') return '👥'
    return '•'
  }

  const notifColor = (type) => {
    if (type === 'application_accepted') return '#10b981'
    if (type === 'application_rejected') return '#f87171'
    if (type === 'task_validated') return '#fbbf24'
    if (type === 'project_started') return '#4be2be'
    if (type === 'follow_request') return '#4be2be'
    if (type === 'follow_accepted') return '#10b981'
    if (type === 'follow_back_suggestion') return '#4be2be'
    return '#38bdf8'
  }

  const formatRelative = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const handleAvatarClick = () => setIsDropdownOpen(!isDropdownOpen)
  const handleCloseDropdown = () => setIsDropdownOpen(false)

  return (
    <nav className="top-nav">
      <div className="top-nav-container">
        {/* Left: Brand */}
        <Link to={brandLink} className="top-nav-brand">
          Open Hand
        </Link>

        {/* Center: Menu Links */}
        <div className="top-nav-menu">
          {menuLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`top-nav-link${
                location.pathname === item.to ||
                location.pathname.startsWith(item.to + '/')
                  ? ' active' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right: Search, Icons, Avatar */}
        <div className="top-nav-right">
          {/* Mobile hamburger — inside right so dropdown anchors to right edge */}
          <div className="top-nav-mobile-wrap" ref={mobileMenuRef}>
            <button
              className="top-nav-hamburger"
              onClick={() => setMobileMenuOpen((p) => !p)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
            {mobileMenuOpen && (
              <nav className="top-nav-mobile-dropdown">
                {menuLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`top-nav-mobile-link${
                      location.pathname === item.to ||
                      location.pathname.startsWith(item.to + '/')
                        ? ' active' : ''
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="top-nav-search">
            <input
              type="text"
              placeholder="Search jobs"
              className="top-nav-search-input"
            />
            <select className="top-nav-search-dropdown">
              <option>Jobs</option>
            </select>
          </div>

          <div className="top-nav-icons">
            <button
              className="top-nav-icon-button"
              aria-label="Help & Support"
              title="Help & Support"
            >
              <HelpCircle size={20} />
            </button>

            {/* Notification bell with badge + panel */}
            <div className="notif-wrapper" ref={notifRef}>
              <button
                className="top-nav-icon-button notif-bell-btn"
                aria-label="Notifications"
                title="Notifications"
                onClick={openNotifications}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notif-panel">
                  <div className="notif-panel-header">
                    <span className="notif-panel-title">Notifications</span>
                    {notifications.some(n => !n.read) && (
                      <button
                        className="notif-clear-btn"
                        onClick={async () => {
                          try {
                            await fetch(`${API_BASE}/api/notifications/read-all`, {
                              method: 'PATCH', credentials: 'include', headers: authHeaders(),
                            })
                            setUnreadCount(0)
                            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                          } catch {}
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <p className="notif-empty">No notifications yet.</p>
                  ) : (
                    <div className="notif-list">
                      {notifications.map(n => (
                        <div key={n._id} className={`notif-item ${n.read ? '' : 'notif-unread'}`}>
                          <span
                            className="notif-type-icon"
                            style={{
                              color: notifColor(n.type),
                              background: `${notifColor(n.type)}20`,
                              cursor: n.type === 'follow_request' ? 'pointer' : 'default'
                            }}
                            onClick={() => {
                              if (n.type === 'follow_request' && n.relatedId) {
                                const profilePath = user?.userType === 'client'
                                  ? `/client/freelancer-profile/${n.relatedId}`
                                  : `/freelancer/freelancer-profile/${n.relatedId}`
                                setShowNotifications(false)
                                navigate(profilePath, { state: { backRoute: user?.userType === 'client' ? '/client/home' : '/freelancer/home' } })
                              }
                            }}
                            title={n.type === 'follow_request' ? 'View profile' : undefined}
                          >
                            {notifIcon(n.type)}
                          </span>
                          <div className="notif-content">
                            <span className="notif-title">{n.title}</span>
                            {n.message && <span className="notif-msg">{n.message}</span>}
                            <span className="notif-time">{formatRelative(n.createdAt)}</span>
                            {n.type === 'follow_request' && (
                              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                <button
                                  disabled={respondingTo === n._id}
                                  onClick={() => handleFollowResponse(n.relatedId, n._id, 'accept')}
                                  style={{ fontSize: '0.75rem', padding: '3px 10px', background: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                                >
                                  {respondingTo === n._id ? '...' : 'Accept'}
                                </button>
                                <button
                                  disabled={respondingTo === n._id}
                                  onClick={() => handleFollowResponse(n.relatedId, n._id, 'reject')}
                                  style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'transparent', color: '#94a3b8', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
                                >
                                  {respondingTo === n._id ? '...' : 'Decline'}
                                </button>
                              </div>
                            )}
                            {n.type === 'follow_back_suggestion' && !followBackStates[n._id] && (
                              <div style={{ marginTop: '6px' }}>
                                <button
                                  onClick={() => handleFollowBack(n.senderId, n._id)}
                                  style={{
                                    fontSize: '0.75rem', padding: '3px 10px',
                                    background: '#00a884', color: 'white',
                                    borderRadius: '6px', border: 'none', cursor: 'pointer'
                                  }}
                                >
                                  Follow Back
                                </button>
                              </div>
                            )}
                            {n.type === 'follow_back_suggestion' && followBackStates[n._id] === 'requested' && (
                              <div style={{ marginTop: '6px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                  Request sent ✓
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Avatar with Dropdown */}
          <div className="top-nav-avatar-wrapper">
            <button
              className="top-nav-avatar-button"
              onClick={handleAvatarClick}
              aria-label="Profile menu"
              aria-expanded={isDropdownOpen}
            >
              <div className="top-nav-avatar">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName || 'User'} />
                ) : (
                  <div className="top-nav-avatar-placeholder">
                    {(userName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </button>
            <ProfileDropdown
              userName={userName}
              userAvatar={userAvatar}
              isOpen={isDropdownOpen}
              onClose={handleCloseDropdown}
              onToggle={handleAvatarClick}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default TopNav
