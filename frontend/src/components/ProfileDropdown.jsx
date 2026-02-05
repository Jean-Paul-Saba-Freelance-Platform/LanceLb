/**
 * ProfileDropdown Component
 * 
 * Role-aware dropdown menu that displays different menu items based on userType.
 * 
 * DATA SOURCE:
 * - Reads user data from localStorage (same source as greeting "Good afternoon, Saba")
 * - userType comes from user.userType field stored during login
 * - Falls back to "User" if userType is missing
 * 
 * ROLE-BASED MENUS:
 * - Shared items: Profile, Stats, Theme, Settings, Log out
 * - Client-only: Post a job, Manage jobs
 * - Freelancer-only: Find work, My proposals, Deliver work
 * 
 * ROUTING:
 * - Profile routes: /client/profile (client) or /freelancer/profile (freelancer)
 * - Stats routes: /client/stats (client) or /freelancer/stats (freelancer)
 * - Settings routes: /client/settings (client) or /freelancer/settings (freelancer)
 * 
 * TO EXTEND MENU ITEMS:
 * - Add new items to the appropriate array in getMenuItems() function
 * - Format: { label: string, icon: ReactComponent, route: string, role?: 'client' | 'freelancer' | 'both' }
 * - If role is not specified, item appears for both roles
 */

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, LineChart, Sun, Settings, LogOut, ChevronRight,
  Briefcase, FileText, Search, Send, Package
} from 'lucide-react'
import './ProfileDropdown.css'

const ProfileDropdown = ({ userName, userAvatar, isOpen, onClose, onToggle }) => {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const [isOnline, setIsOnline] = useState(false)
  const [userType, setUserType] = useState(null)

  // Get user data from localStorage (same source as greeting)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setUserType(user.userType || null)
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error)
    }
  }, [])

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

  /**
   * Get role-appropriate menu items
   * Returns array of menu items based on userType
   */
  const getMenuItems = () => {
    const sharedItems = [
      { 
        label: 'Your profile', 
        icon: User, 
        route: userType === 'client' ? '/client/profile' : '/freelancer/profile',
        dividerAfter: false
      },
      { 
        label: 'Stats & trends', 
        icon: LineChart, 
        route: userType === 'client' ? '/client/stats' : '/freelancer/stats',
        dividerAfter: true
      }
    ]

    const clientOnlyItems = [
      { 
        label: 'Post a job', 
        icon: Briefcase, 
        route: '/client/jobs/new',
        dividerAfter: false
      },
      { 
        label: 'Manage jobs', 
        icon: FileText, 
        route: '/client/jobs',
        dividerAfter: true
      }
    ]

    const freelancerOnlyItems = [
      { 
        label: 'Find work', 
        icon: Search, 
        route: '/freelancer/find-work',
        dividerAfter: false
      },
      { 
        label: 'My proposals', 
        icon: Send, 
        route: '/freelancer/proposals',
        dividerAfter: false
      },
      { 
        label: 'Deliver work', 
        icon: Package, 
        route: '/freelancer/deliver-work',
        dividerAfter: true
      }
    ]

    const settingsItems = [
      { 
        label: 'Theme: Light', 
        icon: Sun, 
        route: null, // Theme toggle - no navigation
        action: 'theme',
        showArrow: true,
        dividerAfter: false
      },
      { 
        label: 'Account settings', 
        icon: Settings, 
        route: userType === 'client' ? '/client/settings' : '/freelancer/settings',
        dividerAfter: true
      }
    ]

    const logoutItem = [
      { 
        label: 'Log out', 
        icon: LogOut, 
        route: null,
        action: 'logout',
        isDanger: true,
        dividerAfter: false
      }
    ]

    // Build menu based on role
    let menuItems = [...sharedItems]

    if (userType === 'client') {
      menuItems = [...menuItems, ...clientOnlyItems]
    } else if (userType === 'freelancer') {
      menuItems = [...menuItems, ...freelancerOnlyItems]
    }

    menuItems = [...menuItems, ...settingsItems, ...logoutItem]

    return menuItems
  }

  /**
   * Get role label for display
   * Shows "Client", "Freelancer", or "User" as fallback
   */
  const getRoleLabel = () => {
    if (userType === 'client') return 'Client'
    if (userType === 'freelancer') return 'Freelancer'
    return 'User'
  }

  const handleMenuItemClick = (item) => {
    onClose()

    if (item.action === 'logout') {
      // Clear localStorage and navigate to login
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      navigate('/login')
    } else if (item.action === 'theme') {
      // TODO: Implement theme toggle
      console.log('Theme toggle clicked')
    } else if (item.route) {
      navigate(item.route)
    }
  }

  const displayName = userName || (userType === 'client' ? 'Client' : 'Freelancer')
  const userInitial = displayName.charAt(0).toUpperCase()
  const roleLabel = getRoleLabel()
  const menuItems = getMenuItems()

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
          <div className="dropdown-user-role">{roleLabel}</div>
        </div>
      </div>

      {/* Online Toggle - Only show for freelancers */}
      {userType === 'freelancer' && (
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
      )}

      {/* Menu Items */}
      <div className="dropdown-menu">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon
          const showDivider = item.dividerAfter && index < menuItems.length - 1

          return (
            <React.Fragment key={item.label}>
              <button
                className={`dropdown-menu-item ${item.isDanger ? 'dropdown-menu-item-danger' : ''}`}
                onClick={() => handleMenuItemClick(item)}
              >
                <IconComponent size={18} />
                <span>{item.label}</span>
                {item.showArrow && (
                  <ChevronRight size={16} className="dropdown-arrow" />
                )}
              </button>
              {showDivider && <div className="dropdown-divider"></div>}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default ProfileDropdown
