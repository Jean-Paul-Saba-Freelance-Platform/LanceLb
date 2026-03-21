import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import JobCard from '../src/components/JobCard.jsx'
import RightSidebarCard from '../src/components/RightSidebarCard.jsx'
import './FreelancerHomePage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const FreelancerHomePage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [activeTab, setActiveTab] = useState('bestMatches')
  const [searchQuery, setSearchQuery] = useState('')
  const [profileProgress, setProfileProgress] = useState(40)
  const [peopleToFollow, setPeopleToFollow] = useState([])
  const [followStates, setFollowStates] = useState({})

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) setUser(JSON.parse(userStr))
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }, [])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/client/jobs/open`)
        const data = await res.json()
        if (data.success) {
          setJobs(data.jobs)
        }
      } catch (err) {
        console.error('Error fetching jobs:', err)
      } finally {
        setLoadingJobs(false)
      }
    }
    fetchJobs()
  }, [])

  useEffect(() => {
    const fetchSuggestedPeople = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await fetch(`${API_BASE}/api/follow/explore?limit=4`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          const people = data.users.slice(0, 4)
          setPeopleToFollow(people)
          const token = localStorage.getItem('token')
          const statuses = {}
          await Promise.all(people.map(async (person) => {
            try {
              const r = await fetch(`${API_BASE}/api/follow/status/${person._id}`, {
                credentials: 'include',
                headers: { Authorization: `Bearer ${token}` },
              })
              const d = await r.json()
              if (d.success) statuses[person._id] = d.outgoing
            } catch {}
          }))
          setFollowStates(statuses)
        }
      } catch {}
    }
    fetchSuggestedPeople()
  }, [])

  const handleWidgetFollow = async (personId) => {
    const current = followStates[personId]
    const token = localStorage.getItem('token')
    try {
      if (!current) {
        const res = await fetch(`${API_BASE}/api/follow/${personId}`, {
          method: 'POST', credentials: 'include',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        })
        const data = await res.json()
        if (data.success) setFollowStates(prev => ({ ...prev, [personId]: 'requested' }))
      } else {
        const res = await fetch(`${API_BASE}/api/follow/${personId}`, {
          method: 'DELETE', credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) setFollowStates(prev => ({ ...prev, [personId]: null }))
      }
    } catch {}
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Posted today'
    if (days === 1) return 'Posted yesterday'
    return `Posted ${days} days ago`
  }

  const formatJob = (job) => ({
    ...job,
    postedTime: timeAgo(job.createdAt),
    type: job.paymentType === 'hourly' ? 'Hourly' : 'Fixed-price',
    experience: job.experienceLevel,
    tags: job.requiredSkills || [],
  })

  const getFilteredJobs = () => {
    let filtered = jobs.map(formatJob)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }

    return filtered
  }

  const filteredJobs = getFilteredJobs()
  const userName = user?.name || user?.firstName || 'Freelancer'

  const renderSkeletonCards = () => (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="job-card skeleton-job-card">
          <div className="skeleton-line skeleton-short" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-medium" />
          <div className="skeleton-line skeleton-long" />
          <div className="skeleton-line skeleton-long" />
          <div className="skeleton-tags-row">
            <div className="skeleton-tag" />
            <div className="skeleton-tag" />
            <div className="skeleton-tag" />
          </div>
        </div>
      ))}
    </>
  )

  return (
    <div className="freelancer-home">
      <TopNav userName={userName} />

      <div className="freelancer-home-container">
        {/* Main Content */}
        <div className="freelancer-main-content">
          {/* Greeting Card */}
          <div className="greeting-card">
            <div className="greeting-content">
              <div className="greeting-date">{getCurrentDate()}</div>
              <h2 className="greeting-text">{getGreeting()}, {userName}.</h2>
            </div>
            <div className="greeting-illustration">
              <div className="illustration-placeholder">
                <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="40" fill="#00a884" opacity="0.2"/>
                  <path d="M30 50 L45 65 L70 35" stroke="#00a884" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="jobs-search-bar">
            <input
              type="text"
              placeholder="Search for jobs"
              className="jobs-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Section Title */}
          <h2 className="section-title">Jobs you might like</h2>

          {/* Tabs */}
          <div className="jobs-tabs">
            <button
              className={`tab-button ${activeTab === 'bestMatches' ? 'active' : ''}`}
              onClick={() => setActiveTab('bestMatches')}
            >
              Best Matches
            </button>
            <button
              className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveTab('recent')}
            >
              Most Recent
            </button>
            <button
              className={`tab-button ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved Jobs
            </button>
          </div>

          {/* Jobs Feed */}
          <div className="jobs-feed">
            {loadingJobs ? (
              renderSkeletonCards()
            ) : filteredJobs.length > 0 ? (
              filteredJobs.map(job => (
                <JobCard key={job._id || job.id} job={job} />
              ))
            ) : (
              <div className="no-jobs-message">
                {searchQuery.trim() ? (
                  <p>No jobs found. Try adjusting your search or filters.</p>
                ) : (
                  <p>No jobs available right now.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="freelancer-sidebar">
          {/* People You May Know Card */}
          <RightSidebarCard title="People You May Know">
            {peopleToFollow.length === 0 ? (
              <p className="sidebar-text">No suggestions right now.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {peopleToFollow.map((person) => (
                  <div key={person._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#00a884', color: 'white', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontWeight: '600', fontSize: '0.9rem', flexShrink: 0
                    }}>
                      {(person.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f3f4f6',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {person.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {person.title || person.userType}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleWidgetFollow(person._id)}
                        style={{
                          fontSize: '0.72rem', padding: '3px 8px',
                          background: followStates[person._id] ? 'transparent' : '#00a884',
                          color: followStates[person._id] ? '#94a3b8' : 'white',
                          border: followStates[person._id] ? '1px solid rgba(255,255,255,0.15)' : 'none',
                          borderRadius: '6px', cursor: 'pointer'
                        }}
                      >
                        {followStates[person._id] === 'accepted' ? 'Following'
                          : followStates[person._id] === 'requested' ? 'Requested'
                          : 'Follow'}
                      </button>
                      <button
                        onClick={() => {
                          const path = user?.userType === 'client'
                            ? `/client/freelancer-profile/${person._id}`
                            : `/freelancer/freelancer-profile/${person._id}`
                          navigate(path, { state: { backRoute: '/freelancer/home' } })
                        }}
                        style={{
                          fontSize: '0.72rem', padding: '3px 8px', background: 'transparent',
                          color: '#00a884', border: '1px solid #00a884', borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => window.location.href = '/freelancer/explore'}
                  style={{ fontSize: '0.8rem', color: '#00a884', background: 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0,
                    marginTop: '4px' }}
                >
                  See all →
                </button>
              </div>
            )}
          </RightSidebarCard>

          {/* Profile Strength Card */}
          <RightSidebarCard title="Profile Strength">
            <div className="profile-progress-content">
              <div className="profile-avatar-large">
                {user?.avatar ? (
                  <img src={user.avatar} alt={userName} />
                ) : (
                  <div className="avatar-placeholder-large">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h4 className="profile-name">{userName}</h4>
              <p className="profile-category">Freelancer</p>
              <p className="sidebar-text">Improve your profile to get better matches.</p>
              <div className="profile-progress-section">
                <div className="profile-progress-header">
                  <span>Profile strength: {profileProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${profileProgress}%` }}></div>
                </div>
              </div>
              <button className="sidebar-button-secondary">Update profile</button>
            </div>
          </RightSidebarCard>

          {/* Trust & Safety Card */}
          <RightSidebarCard title="Trust & Safety">
            <p className="sidebar-text">Add verification steps to increase trust.</p>
            <button className="sidebar-button-primary">Verify account</button>
          </RightSidebarCard>

          {/* Promote with Ads Card */}
          <RightSidebarCard title="Promote with ads" collapsible={true} defaultExpanded={true}>
            <div className="promote-options">
              <div className="promote-option">
                <div className="promote-option-content">
                  <span className="promote-option-label">Availability badge</span>
                  <span className="promote-option-desc">Show clients you're available</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="promote-option">
                <div className="promote-option-content">
                  <span className="promote-option-label">Boost your profile</span>
                  <span className="promote-option-desc">Get more visibility</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </RightSidebarCard>

          {/* Credits Card */}
          <RightSidebarCard title="Credits">
            <div className="credits-content">
              <div className="credits-amount">Credits: 0</div>
              <button className="sidebar-button-primary">Get Credits</button>
              <a href="#" className="sidebar-link">Learn more</a>
            </div>
          </RightSidebarCard>

          {/* Preferences Card */}
          <RightSidebarCard title="Preferences" collapsible={true} defaultExpanded={false}>
            <p className="sidebar-text">Manage your job preferences, notifications, and account settings.</p>
          </RightSidebarCard>
        </div>
      </div>
    </div>
  )
}

export default FreelancerHomePage
