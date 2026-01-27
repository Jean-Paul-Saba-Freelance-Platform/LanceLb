import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../src/components/TopNav'
import { 
  Edit2, Plus, Share2, CheckCircle, XCircle, 
  Video, Clock, Globe, Shield, Award, GraduationCap,
  Briefcase, FolderOpen, History, Tag, Package
} from 'lucide-react'
import './FreelancerProfilePage.css'

const FreelancerProfilePage = () => {
  const [user, setUser] = useState(null)
  const [portfolioTab, setPortfolioTab] = useState('published')
  const [availabilityBadge, setAvailabilityBadge] = useState(false)
  const [boostProfile, setBoostProfile] = useState(false)

  useEffect(() => {
    // Get user from localStorage
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        setUser(JSON.parse(userStr))
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }, [])

  const userName = user?.name || user?.firstName || 'Saba A.'
  const userInitial = userName.charAt(0).toUpperCase()
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })

  const skills = ['Digital Marketing', 'React', 'Node.js', 'TypeScript', 'UI/UX Design', 'Content Writing']

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
            {/* Title + Rate */}
            <div className="main-section-card">
              <div className="section-header-row">
                <div className="section-title-group">
                  <h2 className="section-title">Full Stack Developer</h2>
                  <span className="section-rate">$100.00/hr</span>
                </div>
                <button className="section-edit-button" aria-label="Edit">
                  <Edit2 size={18} />
                </button>
              </div>
            </div>

            {/* Overview / Bio */}
            <div className="main-section-card">
              <div className="section-header-row">
                <h2 className="section-title">Overview</h2>
                <button className="section-edit-button" aria-label="Edit">
                  <Edit2 size={18} />
                </button>
              </div>
              <p className="bio-text">
                Experienced full stack developer with a passion for building scalable web applications. 
                I specialize in React, Node.js, and modern JavaScript frameworks. With over 5 years of 
                experience, I've helped numerous clients bring their ideas to life through clean, 
                maintainable code and intuitive user interfaces. I'm committed to delivering high-quality 
                solutions that exceed expectations.
              </p>
            </div>

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

            {/* Skills */}
            <div className="main-section-card">
              <div className="section-header-row">
                <h2 className="section-title">Skills</h2>
                <button className="section-edit-button" aria-label="Edit">
                  <Edit2 size={18} />
                </button>
              </div>
              <div className="skills-list">
                {skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
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
