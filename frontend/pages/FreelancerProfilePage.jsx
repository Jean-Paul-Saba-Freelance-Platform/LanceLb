import React, { useState, useEffect } from 'react'
import TopNav from '../src/components/TopNav'
import { 
  Edit2, Plus, Share2, X,
  Video, Clock, Globe, Shield, Award, GraduationCap,
  FolderOpen, History, Save
} from 'lucide-react'
import './FreelancerProfilePage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const FreelancerProfilePage = () => {
  const [user, setUser] = useState(null)
  const [portfolioTab, setPortfolioTab] = useState('published')
  const [availabilityBadge, setAvailabilityBadge] = useState(false)
  const [boostProfile, setBoostProfile] = useState(false)

  const [editingProfile, setEditingProfile] = useState(false)
  const [profileTitle, setProfileTitle] = useState('')
  const [profileBio, setProfileBio] = useState('')
  const [profileSkills, setProfileSkills] = useState([])
  const [profileExperience, setProfileExperience] = useState('entry')
  const [newSkill, setNewSkill] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [showFollowModal, setShowFollowModal] = useState(null) // null | 'followers' | 'following'
  const [followList, setFollowList] = useState([])
  const [followListLoading, setFollowListLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) setUser(JSON.parse(userStr))

        const token = localStorage.getItem('token')
        if (!token) return

        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        })
        const data = await res.json()
        if (data.success && data.user) {
          setUser(data.user)
          setProfileTitle(data.user.title || '')
          setProfileBio(data.user.bio || '')
          setProfileSkills(data.user.skills || [])
          setProfileExperience(data.user.experienceLevel || 'entry')

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
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }
    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setSaveMessage('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: profileTitle,
          bio: profileBio,
          skills: profileSkills,
          experienceLevel: profileExperience,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        setEditingProfile(false)
        setSaveMessage('Profile saved!')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessage(data.message || 'Failed to save')
      }
    } catch (err) {
      setSaveMessage('Network error')
    } finally {
      setSavingProfile(false)
    }
  }

  const addSkill = () => {
    const trimmed = newSkill.trim()
    if (trimmed && !profileSkills.includes(trimmed)) {
      setProfileSkills(prev => [...prev, trimmed])
    }
    setNewSkill('')
  }

  const removeSkill = (skillToRemove) => {
    setProfileSkills(prev => prev.filter(s => s !== skillToRemove))
  }

  // Unfollow a person directly from the modal list
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

  // Open followers/following modal and load the list
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

  const userName = user?.name || user?.firstName || 'Freelancer'
  const userInitial = userName.charAt(0).toUpperCase()
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })

  const skills = user?.skills?.length ? user.skills : []

  return (
    <div className="freelancer-profile-page">
      <TopNav userName={userName} />

      <div className="profile-page-container">
        {/* Top Profile Header */}
        <div className="profile-header fh-glass-card">
          <div className="profile-header-left">
            <div className="profile-header-avatar-wrapper">
              <div className="profile-header-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={userName} />
                ) : (
                  <div className="profile-header-avatar-placeholder">
                    {userInitial}
                  </div>
                )}
              </div>
              <div className="online-indicator"></div>
            </div>
            <div className="profile-header-info">
              <div className="profile-header-name-row">
                <h1 className="profile-header-name">{userName}</h1>
                <span className="verification-status unverified">Unverified</span>
              </div>
              <div className="profile-header-location">
                Amioun, Lebanon • {currentTime} local time
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                <button
                  onClick={() => openFollowModal('followers')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: '#f3f4f6', fontSize: '0.88rem' }}
                >
                  <strong>{followersCount}</strong>
                  <span style={{ color: '#94a3b8', marginLeft: '4px' }}>followers</span>
                </button>
                <button
                  onClick={() => openFollowModal('following')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: '#f3f4f6', fontSize: '0.88rem' }}
                >
                  <strong>{followingCount}</strong>
                  <span style={{ color: '#94a3b8', marginLeft: '4px' }}>following</span>
                </button>
              </div>
            </div>
          </div>
          <div className="profile-header-right">
            <button className="fh-btn fh-btn-secondary">
              See public view
            </button>
            <button className="fh-btn fh-btn-primary">
              Profile settings
            </button>
            <button className="fh-btn fh-btn-icon profile-header-share" aria-label="Share profile">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="profile-content-grid">
          {/* Left Sidebar */}
          <div className="profile-sidebar">
            {/* Pro Offer Card */}
            <div className="sidebar-card fh-glass-card">
              <h3 className="sidebar-card-title">Pro Offer</h3>
              <p className="sidebar-card-text">
                Unlock premium features and boost your visibility on FreelanceHub.
              </p>
              <button className="sidebar-card-link">Learn more</button>
            </div>

            {/* Promote Profile Card */}
            <div className="sidebar-card fh-glass-card">
              <div className="sidebar-card-header-row">
                <h3 className="sidebar-card-title">Promote your profile</h3>
                <button className="sidebar-edit-icon fh-icon-button" aria-label="Edit promote profile">
                  <Edit2 size={16} />
                </button>
              </div>
              <div className="promote-options-list">
                <div className="promote-option-row">
                  <div className="promote-option-info">
                    <span className="promote-option-label">Availability badge</span>
                    <span className={`promote-option-status ${availabilityBadge ? 'on' : 'off'}`}>
                      {availabilityBadge ? 'On' : 'Off'}
                    </span>
                  </div>
                  <label className="promote-toggle-switch">
                    <input
                      type="checkbox"
                      checked={availabilityBadge}
                      onChange={(e) => setAvailabilityBadge(e.target.checked)}
                    />
                    <span className="promote-toggle-slider"></span>
                  </label>
                </div>
                <div className="promote-option-row">
                  <div className="promote-option-info">
                    <span className="promote-option-label">Boost your profile</span>
                    <span className={`promote-option-status ${boostProfile ? 'on' : 'off'}`}>
                      {boostProfile ? 'On' : 'Off'}
                    </span>
                  </div>
                  <label className="promote-toggle-switch">
                    <input
                      type="checkbox"
                      checked={boostProfile}
                      onChange={(e) => setBoostProfile(e.target.checked)}
                    />
                    <span className="promote-toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Credits Card */}
            <div className="sidebar-card fh-glass-card">
              <h3 className="sidebar-card-title">Credits</h3>
              <div className="credits-display">Credits: 0</div>
              <div className="sidebar-card-links">
                <a href="#" className="sidebar-card-link">View details</a>
                <a href="#" className="sidebar-card-link">Get credits</a>
              </div>
            </div>

            {/* Video Introduction */}
            <div className="sidebar-card sidebar-card-collapsed fh-glass-card">
              <div className="sidebar-card-header-row">
                <div className="sidebar-card-title-with-icon">
                  <Video size={18} />
                  <span>Video introduction</span>
                </div>
                <button className="sidebar-edit-icon fh-icon-button" aria-label="Add video introduction">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Hours per Week */}
            <div className="sidebar-card fh-glass-card">
              <div className="sidebar-card-header-row">
                <div className="sidebar-card-title-with-icon">
                  <Clock size={18} />
                  <span>Hours per week</span>
                </div>
                <button className="sidebar-edit-icon fh-icon-button" aria-label="Edit hours per week">
                  <Edit2 size={16} />
                </button>
              </div>
              <p className="sidebar-card-text">Not set</p>
            </div>

            {/* Languages */}
            <div className="sidebar-card fh-glass-card">
              <div className="sidebar-card-header-row">
                <div className="sidebar-card-title-with-icon">
                  <Globe size={18} />
                  <span>Languages</span>
                </div>
                <button className="sidebar-edit-icon fh-icon-button" aria-label="Add language">
                  <Plus size={16} />
                </button>
              </div>
              <p className="sidebar-card-text">Not set</p>
            </div>

            {/* Verifications */}
            <div className="sidebar-card fh-glass-card">
              <div className="sidebar-card-header-row">
                <div className="sidebar-card-title-with-icon">
                  <Shield size={18} />
                  <span>Verifications</span>
                </div>
              </div>
              <div className="verification-item">
                <div className="verification-item-row">
                  <span>ID</span>
                  <span className="verification-badge unverified">Unverified</span>
                </div>
                <a href="#" className="verification-link">Verify your identity</a>
              </div>
            </div>

            {/* Licenses */}
            <div className="sidebar-card fh-glass-card">
              <div className="sidebar-card-header-row">
                <div className="sidebar-card-title-with-icon">
                  <Award size={18} />
                  <span>Licenses</span>
                </div>
                <button className="sidebar-edit-icon fh-icon-button" aria-label="Add license">
                  <Plus size={16} />
                </button>
              </div>
              <p className="sidebar-card-text">No licenses added</p>
            </div>

            {/* Education */}
            <div className="sidebar-card fh-glass-card">
              <div className="sidebar-card-header-row">
                <div className="sidebar-card-title-with-icon">
                  <GraduationCap size={18} />
                  <span>Education</span>
                </div>
                <button className="sidebar-edit-icon fh-icon-button" aria-label="Add education">
                  <Plus size={16} />
                </button>
              </div>
              <p className="sidebar-card-text">No education added</p>
            </div>
          </div>

          {/* Right Main Column */}
          <div className="profile-main-content">
            {saveMessage && (
              <div className="profile-save-banner">{saveMessage}</div>
            )}

            {editingProfile ? (
              /* ─── Editing Mode ─── */
              <div className="main-section-card profile-edit-card fh-glass-card">
                <div className="section-header-row">
                  <h2 className="section-title">Edit Profile</h2>
                  <div className="profile-edit-actions">
                    <button className="profile-cancel-btn fh-btn fh-btn-secondary" onClick={() => setEditingProfile(false)} disabled={savingProfile}>
                      Cancel
                    </button>
                    <button className="profile-save-btn fh-btn fh-btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
                      <Save size={16} />
                      {savingProfile ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                <div className="profile-edit-form">
                  <label className="profile-edit-field">
                    <span className="profile-edit-label">Professional Title</span>
                    <input
                      type="text"
                      className="profile-edit-input"
                      placeholder="e.g., Full Stack Developer"
                      value={profileTitle}
                      onChange={(e) => setProfileTitle(e.target.value)}
                      maxLength={120}
                    />
                  </label>

                  <label className="profile-edit-field">
                    <span className="profile-edit-label">Experience Level</span>
                    <select
                      className="profile-edit-input profile-edit-select"
                      value={profileExperience}
                      onChange={(e) => setProfileExperience(e.target.value)}
                    >
                      <option value="entry">Entry Level</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </label>

                  <label className="profile-edit-field">
                    <span className="profile-edit-label">Bio / Overview</span>
                    <textarea
                      className="profile-edit-input profile-edit-textarea"
                      placeholder="Tell clients about your experience and what you bring to the table..."
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      maxLength={1000}
                      rows={5}
                    />
                    <span className="profile-edit-hint">{profileBio.length}/1000</span>
                  </label>

                  <div className="profile-edit-field">
                    <span className="profile-edit-label">Skills</span>
                    <div className="profile-skills-editor">
                      <div className="profile-skills-tags">
                        {profileSkills.map((skill, i) => (
                          <span key={i} className="profile-skill-tag-editable">
                            {skill}
                            <button className="profile-skill-remove fh-icon-button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="profile-skill-add-row">
                        <input
                          type="text"
                          className="profile-edit-input"
                          placeholder="Add a skill..."
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                        />
                        <button className="profile-skill-add-btn fh-btn fh-btn-secondary" onClick={addSkill} type="button">Add</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── View Mode ─── */
              <>
                {/* Title + Rate */}
                <div className="main-section-card fh-glass-card">
                  <div className="section-header-row">
                    <div className="section-title-group">
                      <h2 className="section-title">{user?.title || 'No title set'}</h2>
                      {user?.experienceLevel && (
                        <span className="section-rate">
                          {user.experienceLevel === 'entry' ? 'Entry Level' : user.experienceLevel === 'intermediate' ? 'Intermediate' : 'Expert'}
                        </span>
                      )}
                    </div>
                    <button className="section-edit-button fh-icon-button" onClick={() => setEditingProfile(true)} aria-label="Edit profile title">
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Overview / Bio */}
                <div className="main-section-card fh-glass-card">
                  <div className="section-header-row">
                    <h2 className="section-title">Overview</h2>
                    <button className="section-edit-button fh-icon-button" onClick={() => setEditingProfile(true)} aria-label="Edit overview">
                      <Edit2 size={18} />
                    </button>
                  </div>
                  <p className="bio-text">
                    {user?.bio || 'No bio set. Click edit to add your overview.'}
                  </p>
                </div>

                {/* Skills */}
                <div className="main-section-card fh-glass-card">
                  <div className="section-header-row">
                    <h2 className="section-title">Skills</h2>
                    <button className="section-edit-button fh-icon-button" onClick={() => setEditingProfile(true)} aria-label="Edit skills">
                      <Edit2 size={18} />
                    </button>
                  </div>
                  <div className="skills-list">
                    {skills.length > 0 ? skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                      </span>
                    )) : (
                      <p className="section-placeholder-text">No skills added yet. Click edit to add your skills.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Portfolio */}
            <div className="main-section-card fh-glass-card">
              <div className="section-header-row">
                <h2 className="section-title">Portfolio</h2>
                <button className="section-edit-button fh-icon-button" aria-label="Edit portfolio">
                  <Edit2 size={18} />
                </button>
              </div>
              <div className="portfolio-tabs">
                <button
                  className={`portfolio-tab ${portfolioTab === 'published' ? 'active' : ''}`}
                  onClick={() => setPortfolioTab('published')}
                >
                  Published
                </button>
                <button
                  className={`portfolio-tab ${portfolioTab === 'drafts' ? 'active' : ''}`}
                  onClick={() => setPortfolioTab('drafts')}
                >
                  Drafts
                </button>
              </div>
              <div className="portfolio-empty-state">
                <FolderOpen size={48} className="empty-state-icon" />
                <p className="empty-state-text">No {portfolioTab === 'published' ? 'published' : 'draft'} items</p>
              </div>
            </div>

            {/* Work History */}
            <div className="main-section-card fh-glass-card">
              <div className="section-header-row">
                <h2 className="section-title">Work history</h2>
                <button className="section-edit-button fh-icon-button" aria-label="Edit work history">
                  <Edit2 size={18} />
                </button>
              </div>
              <div className="empty-state-simple">
                <History size={32} className="empty-state-icon-small" />
                <p className="empty-state-text">No items</p>
              </div>
            </div>

            {/* Project Catalog */}
            <div className="main-section-card fh-glass-card">
              <div className="section-header-row">
                <h2 className="section-title">Project catalog</h2>
                <button className="section-edit-button fh-icon-button" aria-label="Edit project catalog">
                  <Edit2 size={18} />
                </button>
              </div>
              <p className="section-placeholder-text">
                Showcase your best work with a project catalog. Add projects to help clients understand your expertise.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showFollowModal && (
        <div
          onClick={() => setShowFollowModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1b2730', border: '1px solid #2a3942', borderRadius: '12px',
              width: '360px', maxHeight: '480px', display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem', borderBottom: '1px solid #2a3942',
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e9edef', textTransform: 'capitalize' }}>
                {showFollowModal}
              </h3>
              <button
                onClick={() => setShowFollowModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8696a0', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ overflowY: 'auto', padding: '0.5rem 0' }}>
              {followListLoading ? (
                <p style={{ textAlign: 'center', color: '#8696a0', padding: '2rem', margin: 0 }}>Loading...</p>
              ) : followList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#8696a0', padding: '2rem', margin: 0 }}>No {showFollowModal} yet</p>
              ) : (
                followList.map((person) => {
                  const name = person.name || 'User'
                  const initial = name.charAt(0).toUpperCase()
                  return (
                    <div key={person._id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '0.65rem 1.25rem',
                    }}>
                      {person.profilePicture ? (
                        <img src={person.profilePicture} alt={name}
                          style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: '#00a884', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700, color: '#fff',
                          flexShrink: 0,
                        }}>
                          {initial}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#e9edef', fontSize: '0.9rem', fontWeight: 500 }}>{name}</div>
                        {person.title && (
                          <div style={{ color: '#8696a0', fontSize: '0.78rem' }}>{person.title}</div>
                        )}
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
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FreelancerProfilePage
