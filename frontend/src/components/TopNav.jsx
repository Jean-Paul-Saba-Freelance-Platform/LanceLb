import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, Bell } from 'lucide-react'
import ProfileDropdown from './ProfileDropdown'
import './TopNav.css'

const TopNav = ({ userName, userAvatar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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
        <Link to="/" className="top-nav-brand">
          FreelanceHub
        </Link>

        {/* Center: Menu Links */}
        <div className="top-nav-menu">
          <a href="#" className="top-nav-link">Find work</a>
          <a href="#" className="top-nav-link">Deliver work</a>
          <a href="#" className="top-nav-link">Manage finances</a>
          <a href="#" className="top-nav-link">Messages</a>
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
