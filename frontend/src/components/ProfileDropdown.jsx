import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LineChart, Shield, CreditCard, Sun, Settings, LogOut, ChevronRight } from 'lucide-react'
import './ProfileDropdown.css'

const ProfileDropdown = ({ userName, userAvatar, isOpen, onClose, onToggle }) => {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const [isOnline, setIsOnline] = useState(false)

  // Handle click outside and Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleMenuItemClick = (action) => {
    console.log(`${action} clicked`)
    onClose()
    
    if (action === 'Your profile') {
      navigate('/freelancer/profile')
    } else if (action === 'Stats & trends') {
      navigate('/freelancer/stats')
    } else if (action === 'Account settings') {
      navigate('/freelancer/settings')
    } else if (action === 'Log out') {
      // Clear localStorage and navigate to login
      localStorage.removeItem('user')
      navigate('/login')
    }
  }

  const displayName = userName || 'Freelancer'
  const userInitial = displayName.charAt(0).toUpperCase()

  if (!isOpen) return null

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      {/* User Info Section */}
      <div className="dropdown-user-info">
        <div className="dropdown-avatar">
          {userAvatar ? (
            <img src={userAvatar} alt={displayName} />
          ) : (
            <div className="dropdown-avatar-placeholder">
              {userInitial}
            </div>
          )}
        </div>
        <div className="dropdown-user-details">
          <div className="dropdown-user-name">{displayName}</div>
          <div className="dropdown-user-role">Freelancer</div>
        </div>
      </div>

      {/* Online Toggle */}
      <div className="dropdown-toggle-row">
        <span className="dropdown-toggle-label">Online for messages</span>
        <label className="dropdown-toggle-switch">
          <input
            type="checkbox"
            checked={isOnline}
            onChange={(e) => setIsOnline(e.target.checked)}
          />
          <span className="dropdown-toggle-slider"></span>
        </label>
      </div>

      {/* Menu Items */}
      <div className="dropdown-menu">
        <button
          className="dropdown-menu-item"
          onClick={() => handleMenuItemClick('Your profile')}
        >
          <User size={18} />
          <span>Your profile</span>
        </button>

        <button
          className="dropdown-menu-item"
          onClick={() => handleMenuItemClick('Stats & trends')}
        >
          <LineChart size={18} />
          <span>Stats & trends</span>
        </button>

        <div className="dropdown-divider"></div>

        <button
          className="dropdown-menu-item"
          onClick={() => handleMenuItemClick('Account health')}
        >
          <Shield size={18} />
          <span>Account health</span>
        </button>

        <button
          className="dropdown-menu-item"
          onClick={() => handleMenuItemClick('Membership plan')}
        >
          <CreditCard size={18} />
          <span>Membership plan</span>
        </button>

        <button
          className="dropdown-menu-item"
          onClick={() => handleMenuItemClick('Credits')}
        >
          <CreditCard size={18} />
          <span>Credits</span>
        </button>

        <button
          className="dropdown-menu-item"
          onClick={() => handleMenuItemClick('Theme')}
        >
          <Sun size={18} />
          <span>Theme: Light</span>
          <ChevronRight size={16} className="dropdown-arrow" />
        </button>

        <button
          className="dropdown-menu-item"
          onClick={() => handleMenuItemClick('Account settings')}
        >
          <Settings size={18} />
          <span>Account settings</span>
        </button>

        <div className="dropdown-divider"></div>

        <button
          className="dropdown-menu-item dropdown-menu-item-danger"
          onClick={() => handleMenuItemClick('Log out')}
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )
}

export default ProfileDropdown
