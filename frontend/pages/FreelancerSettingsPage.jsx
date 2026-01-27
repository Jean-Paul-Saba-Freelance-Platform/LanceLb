import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../src/components/TopNav'
import { Edit2, Save, X, User, Mail, MapPin, Phone, Globe, CreditCard, Shield, Bell } from 'lucide-react'
import './FreelancerSettingsPage.css'

const FreelancerSettingsPage = () => {
  const [user, setUser] = useState(null)
  const [activeSection, setActiveSection] = useState('contact')
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [isEditingLocation, setIsEditingLocation] = useState(false)

  // Contact info state
  const [contactData, setContactData] = useState({
    userId: 'USR-123456789',
    name: 'Saba Arab',
    email: 'saba.arab@example.com'
  })

  // Location state
  const [locationData, setLocationData] = useState({
    timezone: 'UTC+02:00 Beirut',
    address: '123 Main Street',
    country: 'Lebanon',
    phone: '+961 3 123 456'
  })

  useEffect(() => {
    // Get user from localStorage
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        setUser(userData)
        // Use user data if available
        if (userData.name) {
          setContactData(prev => ({ ...prev, name: userData.name }))
        }
        if (userData.email) {
          setContactData(prev => ({ ...prev, email: userData.email }))
        }
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }, [])

  const userName = user?.name || user?.firstName || 'Freelancer'

  const handleSaveContact = () => {
    console.log('Saving contact info:', contactData)
    setIsEditingContact(false)
    // In real app, would call API here
  }

  const handleCancelContact = () => {
    setIsEditingContact(false)
    // Reset to original values if needed
  }

  const handleSaveLocation = () => {
    console.log('Saving location info:', locationData)
    setIsEditingLocation(false)
    // In real app, would call API here
  }

  const handleCancelLocation = () => {
    setIsEditingLocation(false)
    // Reset to original values if needed
  }

  const handleCreateClientAccount = () => {
    console.log('Create client account clicked')
    alert('Not implemented yet')
  }

  const handleCreateAgencyAccount = () => {
    console.log('Create agency account clicked')
    alert('Not implemented yet')
  }

  const handleCloseAccount = () => {
    const confirmed = window.confirm('Are you sure you want to close your account? This action cannot be undone.')
    if (confirmed) {
      console.log('Closing account...')
      alert('Not implemented yet')
    }
  }

  return (
    <div className="freelancer-settings-page">
      <TopNav userName={userName} />

      <div className="settings-page-container">
        {/* Page Header */}
        <div className="settings-page-header">
          <h1 className="settings-page-title">Settings</h1>
          <p className="settings-page-subtitle">
            Manage your account preferences and profile details.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="settings-layout">
          {/* Left Sidebar */}
          <div className="settings-sidebar">
            <nav className="settings-nav">
              <div className="settings-nav-section">
                <h3 className="settings-nav-section-title">Billing</h3>
                <button
                  className={`settings-nav-item ${activeSection === 'billing' ? 'active' : ''}`}
                  onClick={() => setActiveSection('billing')}
                >
                  <CreditCard size={18} />
                  <span>Billing & Payments</span>
                </button>
              </div>

              <div className="settings-nav-section">
                <h3 className="settings-nav-section-title">User settings</h3>
                <button
                  className={`settings-nav-item ${activeSection === 'contact' ? 'active' : ''}`}
                  onClick={() => setActiveSection('contact')}
                >
                  <Mail size={18} />
                  <span>Contact info</span>
                </button>
                <Link
                  to="/freelancer/profile"
                  className="settings-nav-item"
                >
                  <User size={18} />
                  <span>My profile</span>
                </Link>
                <button
                  className={`settings-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveSection('profile')}
                >
                  <User size={18} />
                  <span>Profile settings</span>
                </button>
                <button
                  className={`settings-nav-item ${activeSection === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveSection('password')}
                >
                  <Shield size={18} />
                  <span>Password & security</span>
                </button>
                <button
                  className={`settings-nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveSection('notifications')}
                >
                  <Bell size={18} />
                  <span>Notifications</span>
                </button>
                <button
                  className={`settings-nav-item ${activeSection === 'location' ? 'active' : ''}`}
                  onClick={() => setActiveSection('location')}
                >
                  <MapPin size={18} />
                  <span>Location</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="settings-content">
            {activeSection === 'contact' && (
              <>
                {/* Account Card */}
                <div className="settings-card">
                  <div className="settings-card-header">
                    <h2 className="settings-card-title">Account</h2>
                    {!isEditingContact && (
                      <button
                        className="settings-card-edit-button"
                        onClick={() => setIsEditingContact(true)}
                        aria-label="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </div>

                  {!isEditingContact ? (
                    <div className="settings-card-content">
                      <div className="settings-field">
                        <label className="settings-field-label">User ID</label>
                        <div className="settings-field-value">{contactData.userId}</div>
                      </div>
                      <div className="settings-field">
                        <label className="settings-field-label">Name</label>
                        <div className="settings-field-value">{contactData.name}</div>
                      </div>
                      <div className="settings-field">
                        <label className="settings-field-label">Email</label>
                        <div className="settings-field-value">
                          {contactData.email.replace(/(.{2})(.*)(@)/, '$1*****$3')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="settings-card-content">
                      <div className="settings-field">
                        <label className="settings-field-label">User ID</label>
                        <div className="settings-field-value">{contactData.userId}</div>
                        <p className="settings-field-hint">User ID cannot be changed</p>
                      </div>
                      <div className="settings-field">
                        <label className="settings-field-label">Name</label>
                        <input
                          type="text"
                          className="settings-input"
                          value={contactData.name}
                          onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                        />
                      </div>
                      <div className="settings-field">
                        <label className="settings-field-label">Email</label>
                        <input
                          type="email"
                          className="settings-input"
                          value={contactData.email}
                          onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                        />
                      </div>
                      <div className="settings-card-actions">
                        <button
                          className="settings-button-secondary"
                          onClick={handleCancelContact}
                        >
                          <X size={16} />
                          Cancel
                        </button>
                        <button
                          className="settings-button-primary"
                          onClick={handleSaveContact}
                        >
                          <Save size={16} />
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="settings-card-footer">
                    <button
                      className="settings-link-danger"
                      onClick={handleCloseAccount}
                    >
                      Close my account
                    </button>
                  </div>
                </div>

                {/* Additional Accounts Card */}
                <div className="settings-card">
                  <h2 className="settings-card-title">Additional accounts</h2>
                  <div className="settings-card-content">
                    <div className="additional-account-block">
                      <div className="additional-account-info">
                        <h3 className="additional-account-title">Client account</h3>
                        <p className="additional-account-desc">
                          Create a client account to hire freelancers and manage projects.
                        </p>
                      </div>
                      <button
                        className="settings-button-primary"
                        onClick={handleCreateClientAccount}
                      >
                        Create client account
                      </button>
                    </div>
                    <div className="additional-account-block">
                      <div className="additional-account-info">
                        <h3 className="additional-account-title">Agency account</h3>
                        <p className="additional-account-desc">
                          Create an agency account to manage a team and collaborate on projects.
                        </p>
                      </div>
                      <button
                        className="settings-button-primary"
                        onClick={handleCreateAgencyAccount}
                      >
                        Create agency account
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'location' && (
              <div className="settings-card">
                <div className="settings-card-header">
                  <h2 className="settings-card-title">Location</h2>
                  {!isEditingLocation && (
                    <button
                      className="settings-card-edit-button"
                      onClick={() => setIsEditingLocation(true)}
                      aria-label="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>

                {!isEditingLocation ? (
                  <div className="settings-card-content">
                    <div className="settings-field">
                      <label className="settings-field-label">Time zone</label>
                      <div className="settings-field-value">{locationData.timezone}</div>
                    </div>
                    <div className="settings-field">
                      <label className="settings-field-label">Address</label>
                      <div className="settings-field-value">{locationData.address}</div>
                    </div>
                    <div className="settings-field">
                      <label className="settings-field-label">Country</label>
                      <div className="settings-field-value">{locationData.country}</div>
                    </div>
                    <div className="settings-field">
                      <label className="settings-field-label">Phone</label>
                      <div className="settings-field-value">{locationData.phone}</div>
                    </div>
                  </div>
                ) : (
                  <div className="settings-card-content">
                    <div className="settings-field">
                      <label className="settings-field-label">Time zone</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={locationData.timezone}
                        onChange={(e) => setLocationData({ ...locationData, timezone: e.target.value })}
                      />
                    </div>
                    <div className="settings-field">
                      <label className="settings-field-label">Address</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={locationData.address}
                        onChange={(e) => setLocationData({ ...locationData, address: e.target.value })}
                      />
                    </div>
                    <div className="settings-field">
                      <label className="settings-field-label">Country</label>
                      <input
                        type="text"
                        className="settings-input"
                        value={locationData.country}
                        onChange={(e) => setLocationData({ ...locationData, country: e.target.value })}
                      />
                    </div>
                    <div className="settings-field">
                      <label className="settings-field-label">Phone</label>
                      <input
                        type="tel"
                        className="settings-input"
                        value={locationData.phone}
                        onChange={(e) => setLocationData({ ...locationData, phone: e.target.value })}
                      />
                    </div>
                    <div className="settings-card-actions">
                      <button
                        className="settings-button-secondary"
                        onClick={handleCancelLocation}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        className="settings-button-primary"
                        onClick={handleSaveLocation}
                      >
                        <Save size={16} />
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Placeholder sections */}
            {activeSection === 'billing' && (
              <div className="settings-card">
                <h2 className="settings-card-title">Billing & Payments</h2>
                <div className="settings-card-content">
                  <p className="settings-placeholder">Billing settings coming soon.</p>
                </div>
              </div>
            )}

            {activeSection === 'profile' && (
              <div className="settings-card">
                <h2 className="settings-card-title">Profile Settings</h2>
                <div className="settings-card-content">
                  <p className="settings-placeholder">Profile settings coming soon.</p>
                </div>
              </div>
            )}

            {activeSection === 'password' && (
              <div className="settings-card">
                <h2 className="settings-card-title">Password & Security</h2>
                <div className="settings-card-content">
                  <p className="settings-placeholder">Password and security settings coming soon.</p>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="settings-card">
                <h2 className="settings-card-title">Notifications</h2>
                <div className="settings-card-content">
                  <p className="settings-placeholder">Notification preferences coming soon.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FreelancerSettingsPage
