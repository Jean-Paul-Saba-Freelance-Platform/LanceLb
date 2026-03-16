import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../src/components/TopNav'
import { Edit2, Save, X, User, Mail, MapPin, Shield, Bell } from 'lucide-react'
import './FreelancerSettingsPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const ClientSettingsPage = () => {
  const [user, setUser] = useState(null)
  const [activeSection, setActiveSection] = useState('contact')
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [contactSaveMsg, setContactSaveMsg] = useState('')
  const [locationSaveMsg, setLocationSaveMsg] = useState('')
  const [savingContact, setSavingContact] = useState(false)

  // Password section
  const [pwData, setPwData] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  const [contactData, setContactData] = useState({ name: '', email: '' })

  const [locationData, setLocationData] = useState({
    timezone: '',
    address: '',
    country: '',
    phone: '',
  })

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const u = JSON.parse(userStr)
        setUser(u)
        setContactData({
          name: u.name || u.firstName || '',
          email: u.email || '',
        })
        // Load saved location from localStorage if present
        const savedLoc = localStorage.getItem('userLocation')
        if (savedLoc) {
          try { setLocationData(JSON.parse(savedLoc)) } catch {}
        }
      }
    } catch (err) {
      console.error('Error loading user:', err)
    }
  }, [])

  const userName = user?.name || user?.firstName || 'Client'
  const userId = user?._id || user?.id || user?.userId
  const userIdDisplay = userId ? String(userId).substring(0, 8).toUpperCase() : '—'

  const handleSaveContact = async () => {
    setSavingContact(true)
    setContactSaveMsg('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ name: contactData.name }),
      })
      const data = await res.json()
      if (data.success || res.ok) {
        // Update localStorage
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}')
          const updated = { ...stored, name: contactData.name }
          localStorage.setItem('user', JSON.stringify(updated))
          setUser(updated)
        } catch {}
        setIsEditingContact(false)
        setContactSaveMsg('Contact info saved.')
        setTimeout(() => setContactSaveMsg(''), 3500)
      } else {
        setContactSaveMsg(data.message || 'Failed to save.')
      }
    } catch (err) {
      console.error('Save contact error:', err)
      setContactSaveMsg('Network error. Please try again.')
    } finally {
      setSavingContact(false)
    }
  }

  const handleCancelContact = () => {
    // Reset to current user values
    setContactData({
      name: user?.name || user?.firstName || '',
      email: user?.email || '',
    })
    setIsEditingContact(false)
    setContactSaveMsg('')
  }

  const handleSaveLocation = () => {
    try {
      localStorage.setItem('userLocation', JSON.stringify(locationData))
    } catch {}
    setIsEditingLocation(false)
    setLocationSaveMsg('Location saved locally.')
    setTimeout(() => setLocationSaveMsg(''), 3500)
  }

  const handleCancelLocation = () => {
    const savedLoc = localStorage.getItem('userLocation')
    if (savedLoc) {
      try { setLocationData(JSON.parse(savedLoc)) } catch {}
    }
    setIsEditingLocation(false)
    setLocationSaveMsg('')
  }

  const handleChangePassword = async () => {
    if (!pwData.current || !pwData.next || !pwData.confirm) {
      setPwMsg('All fields are required.')
      return
    }
    if (pwData.next !== pwData.confirm) {
      setPwMsg('New passwords do not match.')
      return
    }
    setSavingPw(true)
    setPwMsg('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: pwData.current, newPassword: pwData.next }),
      })
      if (res.status === 404) {
        setPwMsg('Coming soon.')
        return
      }
      const data = await res.json()
      if (data.success || res.ok) {
        setPwData({ current: '', next: '', confirm: '' })
        setPwMsg('Password changed successfully.')
      } else {
        setPwMsg(data.message || 'Failed to change password.')
      }
    } catch {
      setPwMsg('Coming soon.')
    } finally {
      setSavingPw(false)
    }
  }

  const handleCloseAccount = () => {
    const confirmed = window.confirm('Are you sure you want to close your account? This action cannot be undone.')
    if (confirmed) {
      alert('Not implemented yet.')
    }
  }

  return (
    <div className="freelancer-settings-page">
      <TopNav userName={userName} />

      <div className="settings-page-container">
        <div className="settings-page-header">
          <h1 className="settings-page-title">Settings</h1>
          <p className="settings-page-subtitle">Manage your account preferences and profile details.</p>
        </div>

        <div className="settings-layout">
          {/* Left Sidebar */}
          <div className="settings-sidebar">
            <nav className="settings-nav">
              <div className="settings-nav-section">
                <h3 className="settings-nav-section-title">User settings</h3>
                <button
                  className={`settings-nav-item ${activeSection === 'contact' ? 'active' : ''}`}
                  onClick={() => setActiveSection('contact')}
                >
                  <Mail size={18} />
                  <span>Contact info</span>
                </button>
                <Link to="/client/profile" className="settings-nav-item">
                  <User size={18} />
                  <span>My profile</span>
                </Link>
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

          {/* Right Content */}
          <div className="settings-content">

            {/* ── Contact info ── */}
            {activeSection === 'contact' && (
              <>
                {contactSaveMsg && (
                  <div className="settings-card" style={{ padding: '0.75rem 1.25rem', background: 'rgba(0,168,132,0.1)', borderColor: 'rgba(0,168,132,0.3)', color: '#34d399' }}>
                    {contactSaveMsg}
                  </div>
                )}
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
                        <div className="settings-field-value">{userIdDisplay}</div>
                        <p className="settings-field-hint">Read-only identifier</p>
                      </div>
                      <div className="settings-field">
                        <label className="settings-field-label">Name</label>
                        <div className="settings-field-value">{contactData.name || '—'}</div>
                      </div>
                      <div className="settings-field">
                        <label className="settings-field-label">Email</label>
                        <div className="settings-field-value">
                          {contactData.email
                            ? contactData.email.replace(/(.{2})(.*)(@)/, '$1*****$3')
                            : '—'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="settings-card-content">
                      <div className="settings-field">
                        <label className="settings-field-label">User ID</label>
                        <div className="settings-field-value">{userIdDisplay}</div>
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
                          disabled
                          style={{ opacity: 0.55, cursor: 'not-allowed' }}
                        />
                        <p className="settings-field-hint">To change your email, please contact support.</p>
                      </div>
                      <div className="settings-card-actions">
                        <button className="settings-button-secondary" onClick={handleCancelContact} disabled={savingContact}>
                          <X size={16} /> Cancel
                        </button>
                        <button className="settings-button-primary" onClick={handleSaveContact} disabled={savingContact}>
                          <Save size={16} /> {savingContact ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="settings-card-footer">
                    <button className="settings-link-danger" onClick={handleCloseAccount}>
                      Close my account
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Password & Security ── */}
            {activeSection === 'password' && (
              <div className="settings-card">
                <h2 className="settings-card-title" style={{ marginBottom: '1.25rem' }}>Password & Security</h2>
                <div className="settings-card-content">
                  {pwMsg && (
                    <p className="settings-field-hint" style={{ color: pwMsg.includes('success') ? '#34d399' : '#fca5a5', fontSize: '0.875rem' }}>
                      {pwMsg}
                    </p>
                  )}
                  <div className="settings-field">
                    <label className="settings-field-label">Current Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={pwData.current}
                      onChange={(e) => setPwData({ ...pwData, current: e.target.value })}
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-field-label">New Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={pwData.next}
                      onChange={(e) => setPwData({ ...pwData, next: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-field-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={pwData.confirm}
                      onChange={(e) => setPwData({ ...pwData, confirm: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="settings-card-actions">
                    <button className="settings-button-primary" onClick={handleChangePassword} disabled={savingPw}>
                      <Save size={16} /> {savingPw ? 'Saving...' : 'Change Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Location ── */}
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
                {locationSaveMsg && (
                  <p style={{ fontSize: '0.85rem', color: '#34d399', margin: '0 0 1rem 0' }}>{locationSaveMsg}</p>
                )}

                {!isEditingLocation ? (
                  <div className="settings-card-content">
                    <div className="settings-field">
                      <label className="settings-field-label">Time zone</label>
                      <div className="settings-field-value">{locationData.timezone || '—'}</div>
                    </div>
                    <div className="settings-field">
                      <label className="settings-field-label">Address</label>
                      <div className="settings-field-value">{locationData.address || '—'}</div>
                    </div>
                    <div className="settings-field">
                      <label className="settings-field-label">Country</label>
                      <div className="settings-field-value">{locationData.country || '—'}</div>
                    </div>
                    <div className="settings-field">
                      <label className="settings-field-label">Phone</label>
                      <div className="settings-field-value">{locationData.phone || '—'}</div>
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
                        placeholder="e.g. UTC+02:00 Beirut"
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
                      <button className="settings-button-secondary" onClick={handleCancelLocation}>
                        <X size={16} /> Cancel
                      </button>
                      <button className="settings-button-primary" onClick={handleSaveLocation}>
                        <Save size={16} /> Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Notifications ── */}
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

export default ClientSettingsPage
