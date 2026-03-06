import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HelpCircle, Bell } from 'lucide-react'
import ProfileDropdown from './ProfileDropdown'
import './TopNav.css'

const TopNav = ({ userName, userAvatar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const location = useLocation()
  
  // Get user from localStorage to determine the brand link
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
      { label: 'Messages', to: '/freelancer/messages' },
      { label: 'My Proposals', to: '/freelancer/proposals' },
      { label: 'Deliver Work', to: '/freelancer/deliver-work' }
    ]
    : [
      { label: 'Home', to: '/client/home' },
      { label: 'Messages', to: '/client/messages' },
      { label: 'Manage Jobs', to: '/client/jobs' },
      { label: 'Post Job', to: '/client/post-job' }
    ]

  const handleAvatarClick = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false)
  }

  return (
    <nav className="top-nav">
      <div className="top-nav-container">
        {/* Left: Brand */}
        <Link to={brandLink} className="top-nav-brand">
          LanceLB
        </Link>

        {/* Center: Menu Links */}
        <div className="top-nav-menu">
          {menuLinks.map((item) => (
            <Link key={item.to} to={item.to} className={`top-nav-link${location.pathname === item.to ? ' active' : ''}`}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right: Search, Icons, Avatar */}
        <div className="top-nav-right">
          {/* Search with Dropdown */}
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

          {/* Icons */}
          <div className="top-nav-icons">
            <button
              className="top-nav-icon-button"
              aria-label="Help & Support"
              title="Help & Support"
              onClick={() => console.log('Help clicked')}
            >
              <HelpCircle size={20} />
            </button>

            <button
              className="top-nav-icon-button"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => console.log('Notifications clicked')}
            >
              <Bell size={20} />
            </button>
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
