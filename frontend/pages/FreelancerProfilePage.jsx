import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../src/components/TopNav'
import { 
  Edit2, Plus, Share2, CheckCircle, XCircle, X,
  Video, Clock, Globe, Shield, Award, GraduationCap,
  Briefcase, FolderOpen, History, Tag, Package, Save
} from 'lucide-react'
import './FreelancerProfilePage.css'

const API_BASE = 'http://127.0.0.1:4000'

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
        <div className="profile-header">
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
            </div>
          </div>
          <div className="profile-header-right">
            <button className="profile-header-button-secondary">
              See public view
            </button>
            <button className="profile-header-button-primary">
              Profile settings
            </button>
            <button className="profile-header-share" aria-label="Share profile">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="profile-content-grid">
          {/* Left Sidebar */}
          <div className="profile-sidebar">
            {/* Pro Offer Card */}
            <div className="sidebar-card">
              <h3 className="sidebar-card-title">Pro Offer</h3>
              <p className="sidebar-card-text">
                Unlock premium features and boost your visibility on FreelanceHub.
              </p>
              <button className="sidebar-card-link">Learn more</button>
            </div>

            {/* Promote Profile Card */}
            <div className="sidebar-card">
              <div className="sidebar-card-header-row">
                <h3 className="sidebar-card-title">Promote your profile</h3>
                <button className="sidebar-edit-icon" aria-label="Edit">
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
            <div className="sidebar-card">
              <h3 className="sidebar-card-title">Credits</h3>
              <div className="credits-display">Credits: 0</div>
              <div className="sidebar-card-links">
                <a href="#" className="sidebar-card-link">View details</a>
                <a href="#" className="sidebar-card-link">Get credits</a>
              </div>
            </div>

            {/* Video Introduction */}
            <div className="sidebar-card sidebar-card-collapsed">
              <div className="sidebar-card-header-row">
                <div className="sidebar-card-title-with-icon">
                  <Video size={18} />
                  <span>Video introduction</span>
                </div>
                <button className="sidebar-edit-icon" aria-label="Edit">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Hours per Week */}
            <div className="sidebar-card">
              <div className="sidebar-card-header-row">
                <div className="sidebar-card-title-with-icon">
                  <Clock size={18} />
                  <span>Hours per week</span>
                </div>
                <button className="sidebar-edit-icon" aria-label="Edit">
                  <Edit2 size={16} />
                </button>
              </div>
              <p className="sidebar-card-text">Not set</p>
            </div>

            {/* Languages */}
            <div className="sidebar-card">
              <div className="sidebar-card-header-row">
                <div className="sidebar-card-title-with-icon">
                  <Globe size={18} />
                  <span>Languages</span>
                </div>
                <button className="sidebar-edit-icon" aria-label="Edit">
                  <Plus size={16} />
                </button>
              </div>
              <p className="sidebar-card-text">Not set</p>
            </div>

            {/* Verifications */}
            <div className="sidebar-card">
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
            <div className="sidebar-card">
              <div className="sidebar-card-header-row">
                <div className="sidebar-card-title-with-icon">
                  <Award size={18} />
                  <span>Licenses</span>
                </div>
                <button className="sidebar-edit-icon" aria-label="Edit">
                  <Plus size={16} />
                </button>
              </div>
              <p className="sidebar-card-text">No licenses added</p>
            </div>

            {/* Education */}
            <div className="sidebar-card">
              <div className="sidebar-card-header-row">
                <div className="sidebar-card-title-with-icon">
                  <GraduationCap size={18} />
                  <span>Education</span>
                </div>
                <button className="sidebar-edit-icon" aria-label="Edit">
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
              <div className="main-section-card profile-edit-card">
                <div className="section-header-row">
                  <h2 className="section-title">Edit Profile</h2>
                  <div className="profile-edit-actions">
                    <button className="profile-cancel-btn" onClick={() => setEditingProfile(false)} disabled={savingProfile}>
                      Cancel
                    </button>
                    <button className="profile-save-btn" onClick={handleSaveProfile} disabled={savingProfile}>
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
                            <button className="profile-skill-remove" onClick={() => removeSkill(skill)}>
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
                        <button className="profile-skill-add-btn" onClick={addSkill} type="button">Add</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── View Mode ─── */
              <>
                {/* Title + Rate */}
                <div className="main-section-card">
                  <div className="section-header-row">
                    <div className="section-title-group">
                      <h2 className="section-title">{user?.title || 'No title set'}</h2>
                      {user?.experienceLevel && (
                        <span className="section-rate">
                          {user.experienceLevel === 'entry' ? 'Entry Level' : user.experienceLevel === 'intermediate' ? 'Intermediate' : 'Expert'}
                        </span>
                      )}
                    </div>
                    <button className="section-edit-button" onClick={() => setEditingProfile(true)} aria-label="Edit">
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Overview / Bio */}
                <div className="main-section-card">
                  <div className="section-header-row">
                    <h2 className="section-title">Overview</h2>
                    <button className="section-edit-button" onClick={() => setEditingProfile(true)} aria-label="Edit">
                      <Edit2 size={18} />
                    </button>
                  </div>
                  <p className="bio-text">
                    {user?.bio || 'No bio set. Click edit to add your overview.'}
                  </p>
                </div>

                {/* Skills */}
                <div className="main-section-card">
                  <div className="section-header-row">
                    <h2 className="section-title">Skills</h2>
                    <button className="section-edit-button" onClick={() => setEditingProfile(true)} aria-label="Edit">
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
            <div className="main-section-card">
              <div className="section-header-row">
                <h2 className="section-title">Portfolio</h2>
                <button className="section-edit-button" aria-label="Edit">
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
            <div className="main-section-card">
              <div className="section-header-row">
                <h2 className="section-title">Work history</h2>
                <button className="section-edit-button" aria-label="Edit">
                  <Edit2 size={18} />
                </button>
              </div>
              <div className="empty-state-simple">
                <History size={32} className="empty-state-icon-small" />
                <p className="empty-state-text">No items</p>
              </div>
            </div>

            {/* Project Catalog */}
            <div className="main-section-card">
              <div className="section-header-row">
                <h2 className="section-title">Project catalog</h2>
                <button className="section-edit-button" aria-label="Edit">
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
    </div>
  )
}

export default FreelancerProfilePage
