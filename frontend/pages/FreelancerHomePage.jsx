import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import TopNav from '../src/components/TopNav.jsx'
import JobCard from '../src/components/JobCard.jsx'
import RightSidebarCard from '../src/components/RightSidebarCard.jsx'
import './FreelancerHomePage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: 'easeOut', delay: i * 0.06 }
  })
}

const FreelancerHomePage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [bestMatches, setBestMatches] = useState([])
  const [loadingBestMatches, setLoadingBestMatches] = useState(false)
  const [activeTab, setActiveTab] = useState('bestMatches')
  const [searchQuery, setSearchQuery] = useState('')
  const [profileProgress, setProfileProgress] = useState(0)
  const [peopleToFollow, setPeopleToFollow] = useState([])
  const [followStates, setFollowStates] = useState({})

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const u = JSON.parse(userStr)
        setUser(u)
        // Calculate real profile completeness
        let score = 0
        if (u.name || u.firstName) score += 25      // name always exists if registered
        if (u.bio) score += 25
        if (u.skills?.length > 0) score += 25
        if (u.title) score += 25
        setProfileProgress(score)
      }
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

  const hasFetchedBestMatches = useRef(false);

  useEffect(() => {
    if (activeTab !== 'bestMatches') return;
    if (hasFetchedBestMatches.current) return;

    hasFetchedBestMatches.current = true;

    const fetchBestMatches = async () => {
      setLoadingBestMatches(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/client/jobs/best-matches', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (data.success) {
          setBestMatches(data.data);
        }
      } catch (err) {
        console.error('Best matches fetch error:', err);
      } finally {
        setLoadingBestMatches(false);
      }
    };

    fetchBestMatches();
  }, [activeTab]);

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
          <motion.div className="greeting-card" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <div className="greeting-content">
              <div className="greeting-date">{getCurrentDate()}</div>
              <h2 className="greeting-text">{getGreeting()}, {userName}.</h2>
            </div>
          </motion.div>

          {/* Section Title */}
          <motion.h2 className="section-title" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            Jobs you might like
          </motion.h2>

          {/* Tabs */}
          <motion.div className="jobs-tabs-wrap" variants={fadeUp} initial="hidden" animate="visible" custom={3}>
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
          </motion.div>

          {/* Jobs Feed */}
          <div className="jobs-feed">
            {activeTab === 'bestMatches' ? (
              loadingBestMatches ? (
                renderSkeletonCards()
              ) : bestMatches.length > 0 ? (
                bestMatches.map(job => (
                  <div key={job._id} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'linear-gradient(135deg, #3eb591, #2d9b7a)',
                      color: 'white',
                      borderRadius: '20px',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      zIndex: 2,
                      boxShadow: '0 2px 8px rgba(62,181,145,0.4)',
                    }}>
                      {job.matchScore}% Match
                    </div>
                    <JobCard job={formatJob(job)} />
                  </div>
                ))
              ) : (
                <div className="no-jobs-message">
                  <p>No matches found. Complete your profile with skills and a title to get better matches.</p>
                </div>
              )
            ) : loadingJobs ? (
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

          {/* People You May Know */}
          {peopleToFollow.length > 0 && (
            <div className="fh-people-section">
              <h2 className="section-title">People You May Know</h2>
              <div className="fh-people-grid">
                {peopleToFollow.map((person) => (
                  <div key={person._id} className="fh-person-card">
                    <div className="fh-person-avatar">
                      {(person.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="fh-person-name">{person.name}</div>
                    <div className="fh-person-role">{person.title || person.userType || 'Member'}</div>
                    <div className="fh-person-actions">
                      <button
                        onClick={() => handleWidgetFollow(person._id)}
                        className={`fh-person-follow-btn ${followStates[person._id] ? 'following' : 'active'}`}
                      >
                        {followStates[person._id] === 'accepted' ? 'Following'
                          : followStates[person._id] === 'requested' ? 'Requested'
                          : 'Follow'}
                      </button>
                      <button
                        onClick={() => navigate(
                          `/freelancer/freelancer-profile/${person._id}`,
                          { state: { backRoute: '/freelancer/home' } }
                        )}
                        className="fh-person-view-btn"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
                <div className="fh-people-see-all-wrap">
                  <button
                    className="fh-people-see-all"
                    onClick={() => navigate('/freelancer/explore')}
                  >
                    See all →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="freelancer-sidebar">
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

          {/* Complete Your Profile Card */}
          <RightSidebarCard title="Complete Your Profile">
            <div className="complete-profile-card">
              <div className="complete-profile-checklist">
                <div className="complete-profile-item">
                  <div className={`complete-profile-check ${user?.bio ? 'done' : ''}`}>
                    {user?.bio ? '✓' : ''}
                  </div>
                  <span className={`complete-profile-label ${user?.bio ? 'done' : ''}`}>
                    Add a bio
                  </span>
                </div>
                <div className="complete-profile-item">
                  <div className={`complete-profile-check ${user?.skills?.length > 0 ? 'done' : ''}`}>
                    {user?.skills?.length > 0 ? '✓' : ''}
                  </div>
                  <span className={`complete-profile-label ${user?.skills?.length > 0 ? 'done' : ''}`}>
                    Add your skills
                  </span>
                </div>
                <div className="complete-profile-item">
                  <div className={`complete-profile-check ${user?.title ? 'done' : ''}`}>
                    {user?.title ? '✓' : ''}
                  </div>
                  <span className={`complete-profile-label ${user?.title ? 'done' : ''}`}>
                    Set your title
                  </span>
                </div>
              </div>
              <button
                className="sidebar-button-primary"
                onClick={() => navigate('/freelancer/profile')}
                style={{ marginTop: '0.75rem' }}
              >
                Go to profile
              </button>
            </div>
          </RightSidebarCard>
        </div>
      </div>
    </div>
  )
}

export default FreelancerHomePage
