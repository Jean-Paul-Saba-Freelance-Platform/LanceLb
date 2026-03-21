import { useState, useEffect } from 'react'
import TopNav from '../src/components/TopNav'
import { Edit2, Save, X, Plus } from 'lucide-react'
import './ClientProfilePage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const ClientProfilePage = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState({ type: '', message: '' })

  // Editable fields
  const [formBio, setFormBio] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formSkills, setFormSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')

  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [showFollowModal, setShowFollowModal] = useState(null)
  const [followList, setFollowList] = useState([])
  const [followListLoading, setFollowListLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          // Fall back to localStorage user
          const userStr = localStorage.getItem('user')
          if (userStr) setUser(JSON.parse(userStr))
          return
        }
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        })
        const data = await res.json()
        if (data.success && data.user) {
          setUser(data.user)
          setFormBio(data.user.bio || '')
          setFormTitle(data.user.title || '')
          setFormSkills(data.user.skills || [])
        } else {
          const userStr = localStorage.getItem('user')
          if (userStr) {
            const u = JSON.parse(userStr)
            setUser(u)
            setFormBio(u.bio || '')
            setFormTitle(u.title || '')
            setFormSkills(u.skills || [])
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const u = JSON.parse(userStr)
          setUser(u)
          setFormBio(u.bio || '')
          setFormTitle(u.title || '')
          setFormSkills(u.skills || [])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const [followersRes, followingRes] = await Promise.all([
          fetch(`${API_BASE}/api/follow/followers`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/follow/following`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        const followersData = await followersRes.json()
        const followingData = await followingRes.json()
        if (followersData.success) setFollowersCount(followersData.followers.length)
        if (followingData.success) setFollowingCount(followingData.following.length)
      } catch {}
    }
    fetchCounts()
  }, [])

  const handleEditClick = () => {
    // Sync form fields from current user state before entering edit mode
    setFormBio(user?.bio || '')
    setFormTitle(user?.title || '')
    setFormSkills(user?.skills || [])
    setEditing(true)
    setBanner({ type: '', message: '' })
  }

  const handleCancel = () => {
    setEditing(false)
    setBanner({ type: '', message: '' })
  }

  const handleSave = async () => {
    setSaving(true)
    setBanner({ type: '', message: '' })
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ bio: formBio, title: formTitle, skills: formSkills }),
      })
      const data = await res.json()
      if (data.success) {
        const updated = data.user || { ...user, bio: formBio, title: formTitle, skills: formSkills }
        setUser(updated)
        // Persist to localStorage
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}')
          localStorage.setItem('user', JSON.stringify({ ...stored, bio: formBio, title: formTitle, skills: formSkills }))
        } catch {}
        setEditing(false)
        setBanner({ type: 'success', message: 'Profile saved successfully.' })
        setTimeout(() => setBanner({ type: '', message: '' }), 3500)
      } else {
        setBanner({ type: 'error', message: data.message || 'Failed to save profile.' })
      }
    } catch (err) {
      console.error('Save error:', err)
      setBanner({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const unfollowFromModal = async (personId) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/follow/${personId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setFollowList(prev => prev.filter(p => p._id !== personId))
        if (showFollowModal === 'following') {
          setFollowingCount(prev => prev - 1)
        } else {
          setFollowersCount(prev => prev - 1)
        }
      }
    } catch {}
  }

  const openFollowModal = async (type) => {
    setShowFollowModal(type)
    setFollowListLoading(true)
    setFollowList([])
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/follow/${type}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setFollowList(type === 'followers' ? data.followers : data.following)
      }
    } catch {}
    setFollowListLoading(false)
  }

  const addSkill = () => {
    const trimmed = newSkill.trim()
    if (trimmed && !formSkills.includes(trimmed)) {
      setFormSkills((prev) => [...prev, trimmed])
    }
    setNewSkill('')
  }

  const removeSkill = (skill) => {
    setFormSkills((prev) => prev.filter((s) => s !== skill))
  }

  // Profile completeness: name, title, bio, skills
  const computeCompleteness = () => {
    let filled = 0
    if (user?.name) filled++
    if (user?.title) filled++
    if (user?.bio) filled++
    if (user?.skills?.length > 0) filled++
    return filled * 25
  }

  const userName = user?.name || user?.firstName || 'Client'
  const userInitial = userName.charAt(0).toUpperCase()
  const completeness = computeCompleteness()

  return (
    <div className="client-profile-page">
      <TopNav userName={userName} />

      <div className="client-profile-container">
        {banner.message && (
          <div className={`client-profile-banner client-profile-banner-${banner.type}`}>
            {banner.message}
          </div>
        )}

        {loading ? (
          <div className="client-profile-skeleton">
            <div className="client-profile-skeleton-sidebar">
              <div className="cpsk-circle" />
              <div className="cpsk-line cpsk-line-lg" />
              <div className="cpsk-line cpsk-line-md" />
            </div>
            <div className="client-profile-skeleton-main">
              <div className="cpsk-line cpsk-line-full" />
              <div className="cpsk-line cpsk-line-lg" />
              <div className="cpsk-line cpsk-line-md" />
              <div className="cpsk-line cpsk-line-full" />
            </div>
          </div>
        ) : (
          <div className="client-profile-layout">
            {/* Left: avatar / info card */}
            <div className="client-profile-sidebar">
              <div className="client-profile-avatar-card">
                <div className="client-profile-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={userName} className="client-profile-avatar-img" />
                  ) : (
                    <span className="client-profile-avatar-initial">{userInitial}</span>
                  )}
                </div>
                <h2 className="client-profile-name">{userName}</h2>
                {user?.title && (
                  <p className="client-profile-tagline">{user.title}</p>
                )}
                <p className="client-profile-email">{user?.email || ''}</p>

                <div style={{ display: 'flex', gap: '20px', marginTop: '12px',
                  justifyContent: 'center' }}>
                  <button
                    onClick={() => openFollowModal('followers')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      color: '#f3f4f6', fontSize: '0.88rem', textAlign: 'center' }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{followersCount}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>followers</div>
                  </button>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <button
                    onClick={() => openFollowModal('following')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      color: '#f3f4f6', fontSize: '0.88rem', textAlign: 'center' }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{followingCount}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>following</div>
                  </button>
                </div>

                <div className="client-profile-completeness">
                  <div className="client-profile-completeness-label">
                    <span>Profile completeness</span>
                    <span className="client-profile-completeness-pct">{completeness}%</span>
                  </div>
                  <div className="client-profile-completeness-track">
                    <div
                      className="client-profile-completeness-fill"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: details / edit form */}
            <div className="client-profile-main">
              {editing ? (
                <div className="client-profile-edit-card">
                  <div className="client-profile-edit-header">
                    <h2 className="client-profile-section-title">Edit Profile</h2>
                    <div className="client-profile-edit-actions">
                      <button
                        className="client-profile-btn-secondary"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        <X size={15} />
                        Cancel
                      </button>
                      <button
                        className="client-profile-btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        <Save size={15} />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>

                  <div className="client-profile-form">
                    <div className="client-profile-field">
                      <label className="client-profile-field-label">Company / Position Title</label>
                      <input
                        type="text"
                        className="client-profile-input"
                        placeholder="e.g., CEO at Acme Inc."
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        maxLength={120}
                      />
                    </div>

                    <div className="client-profile-field">
                      <label className="client-profile-field-label">Bio</label>
                      <textarea
                        className="client-profile-input client-profile-textarea"
                        placeholder="Tell freelancers about yourself or your company..."
                        value={formBio}
                        onChange={(e) => setFormBio(e.target.value)}
                        maxLength={800}
                        rows={4}
                      />
                      <span className="client-profile-field-hint">{formBio.length}/800</span>
                    </div>

                    <div className="client-profile-field">
                      <label className="client-profile-field-label">Interests / Skills needed</label>
                      <div className="client-profile-skills-editor">
                        <div className="client-profile-skills-tags">
                          {formSkills.map((skill, i) => (
                            <span key={i} className="client-profile-skill-tag">
                              {skill}
                              <button
                                className="client-profile-skill-remove"
                                onClick={() => removeSkill(skill)}
                                aria-label={`Remove ${skill}`}
                                type="button"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="client-profile-skill-add-row">
                          <input
                            type="text"
                            className="client-profile-input"
                            placeholder="Add interest or skill..."
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                          />
                          <button
                            className="client-profile-btn-secondary"
                            onClick={addSkill}
                            type="button"
                          >
                            <Plus size={15} />
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Title card */}
                  <div className="client-profile-detail-card">
                    <div className="client-profile-detail-header">
                      <h2 className="client-profile-section-title">
                        {user?.title || <span className="client-profile-empty-hint">No title set</span>}
                      </h2>
                      <button
                        className="client-profile-edit-icon-btn"
                        onClick={handleEditClick}
                        aria-label="Edit profile"
                      >
                        <Edit2 size={17} />
                      </button>
                    </div>
                  </div>

                  {/* Bio card */}
                  <div className="client-profile-detail-card">
                    <div className="client-profile-detail-header">
                      <h3 className="client-profile-section-title">About</h3>
                      <button
                        className="client-profile-edit-icon-btn"
                        onClick={handleEditClick}
                        aria-label="Edit bio"
                      >
                        <Edit2 size={17} />
                      </button>
                    </div>
                    <p className="client-profile-bio-text">
                      {user?.bio || <span className="client-profile-empty-hint">No bio yet. Click edit to add one.</span>}
                    </p>
                  </div>

                  {/* Skills / Interests card */}
                  <div className="client-profile-detail-card">
                    <div className="client-profile-detail-header">
                      <h3 className="client-profile-section-title">Interests & Skills Needed</h3>
                      <button
                        className="client-profile-edit-icon-btn"
                        onClick={handleEditClick}
                        aria-label="Edit interests"
                      >
                        <Edit2 size={17} />
                      </button>
                    </div>
                    <div className="client-profile-skills-view">
                      {user?.skills?.length > 0 ? (
                        user.skills.map((skill, i) => (
                          <span key={i} className="client-profile-skill-tag-view">{skill}</span>
                        ))
                      ) : (
                        <span className="client-profile-empty-hint">No interests added yet.</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showFollowModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => setShowFollowModal(null)}
        >
          <div
            style={{
              background: '#1a2232', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px', width: '360px', maxHeight: '480px',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontWeight: '700', color: '#f3f4f6', fontSize: '0.95rem' }}>
                {showFollowModal === 'followers' ? 'Followers' : 'Following'}
              </span>
              <button
                onClick={() => setShowFollowModal(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8',
                  cursor: 'pointer', fontSize: '1.2rem' }}
              >×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
              {followListLoading ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Loading...</p>
              ) : followList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                  No {showFollowModal} yet.
                </p>
              ) : (
                followList.map((person) => (
                  <div key={person._id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 20px'
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: '#00a884', color: 'white', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontWeight: '600', flexShrink: 0
                    }}>
                      {(person.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#f3f4f6' }}>
                        {person.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {person.title || person.userType}
                      </div>
                    </div>
                    <button
                      onClick={() => unfollowFromModal(person._id)}
                      style={{
                        fontSize: '0.72rem', padding: '3px 10px',
                        background: 'transparent', color: '#f87171',
                        border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: '6px', cursor: 'pointer', flexShrink: 0
                      }}
                    >
                      {showFollowModal === 'followers' ? 'Remove' : 'Unfollow'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientProfilePage
