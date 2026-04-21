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
  const [profileChecks, setProfileChecks] = useState({
    bio: false, skills: false, education: false,
    languages: false, hoursPerWeek: false, profilePic: false,
  })
  const [peopleToFollow, setPeopleToFollow] = useState([])
  const [followStates, setFollowStates] = useState({})
  const [savedJobIds, setSavedJobIds] = useState(new Set())
  const [savedJobs, setSavedJobs] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const hasFetchedSaved = useRef(false)

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const u = JSON.parse(userStr)
        setUser(u)
        // 6 fields, ~17 points each = 100% when all complete
        const checks = {
          bio:         !!u.bio?.trim(),
          skills:      (u.skills?.length || 0) > 0,
          education:   (u.education?.length || 0) > 0,
          languages:   (u.languages?.length || 0) > 0,
          hoursPerWeek:!!u.hoursPerWeek,
          profilePic:  !!u.profilePicture?.trim(),
        }
        const completed = Object.values(checks).filter(Boolean).length
        setProfileProgress(Math.round((completed / 6) * 100))
        setProfileChecks(checks)
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

  useEffect(() => {
    const fetchSavedIds = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await fetch(`${API_BASE}/api/freelancer/saved-jobs`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setSavedJobIds(new Set(data.jobs.map(j => j._id || j.id)))
        }
      } catch (err) {
        console.error('Error loading saved job IDs:', err)
      }
    }
    fetchSavedIds()
  }, [])

  useEffect(() => {
    if (activeTab !== 'saved') return
    if (hasFetchedSaved.current) return
    hasFetchedSaved.current = true

    const fetchSavedJobs = async () => {
      setLoadingSaved(true)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/freelancer/saved-jobs`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setSavedJobs(data.jobs.map(formatJob))
        }
      } catch (err) {
        console.error('Error fetching saved jobs:', err)
      } finally {
        setLoadingSaved(false)
      }
    }
    fetchSavedJobs()
  }, [activeTab])

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

  const handleToggleSave = async (jobId) => {
    const token = localStorage.getItem('token')
    const wasSaved = savedJobIds.has(jobId)

    // Optimistic update for IDs
    setSavedJobIds(prev => {
      const next = new Set(prev)
      wasSaved ? next.delete(jobId) : next.add(jobId)
      return next
    })

    if (wasSaved) {
      // Remove from saved list immediately
      setSavedJobs(prev => prev.filter(j => (j._id || j.id) !== jobId))
    } else {
      // Add to saved list immediately using job data from the jobs feed
      const jobToAdd = jobs.find(j => (j._id || j.id) === jobId)
        || bestMatches.find(j => (j._id || j.id) === jobId)
      if (jobToAdd) {
        setSavedJobs(prev => [formatJob(jobToAdd), ...prev])
      }
    }

    try {
      await fetch(`${API_BASE}/api/freelancer/saved-jobs/${jobId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (err) {
      console.error('Toggle save error:', err)
      // Revert on error
      setSavedJobIds(prev => {
        const next = new Set(prev)
        wasSaved ? next.add(jobId) : next.delete(jobId)
        return next
      })
      if (!wasSaved) {
        setSavedJobs(prev => prev.filter(j => (j._id || j.id) !== jobId))
      }
    }
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
                    <JobCard
                      job={formatJob(job)}
                      isSaved={savedJobIds.has(job._id)}
                      onToggleSave={handleToggleSave}
                    />
                  </div>
                ))
              ) : (
                <div className="no-jobs-message">
                  <p>No matches found. Complete your profile with skills and a title to get better matches.</p>
                </div>
              )
            ) : activeTab === 'saved' ? (
              loadingSaved ? (
                renderSkeletonCards()
              ) : savedJobs.length > 0 ? (
                savedJobs.map(job => (
                  <JobCard
                    key={job._id || job.id}
                    job={job}
                    isSaved={true}
                    onToggleSave={handleToggleSave}
                  />
                ))
              ) : (
                <div className="no-jobs-message">
                  <p>No saved jobs yet. Click the bookmark icon on any job to save it.</p>
                </div>
              )
            ) : (
              loadingJobs ? (
                renderSkeletonCards()
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map(job => (
                  <JobCard
                    key={job._id || job.id}
                    job={job}
                    isSaved={savedJobIds.has(job._id || job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))
              ) : (
                <div className="no-jobs-message">
                  {searchQuery.trim() ? (
                    <p>No jobs found. Try adjusting your search or filters.</p>
                  ) : (
                    <p>No jobs available right now.</p>
                  )}
                </div>
              )
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
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={userName} />
                ) : (
                  <div className="avatar-placeholder-large">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h4 className="profile-name">{userName}</h4>
              <p className="profile-category">{user?.title || 'Freelancer'}</p>

              <div className="profile-progress-section">
                <div className="profile-progress-header">
                  <span>Profile strength:&nbsp;</span>
                  <span className="progress-percentage">{profileProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${profileProgress}%` }}
                  />
                </div>
                <p className="profile-progress-label">
                  {profileProgress === 100
                    ? '🎉 Profile complete!'
                    : profileProgress >= 66
                    ? 'Almost there — a few more sections to go.'
                    : profileProgress >= 33
                    ? 'Good start — keep filling in your profile.'
                    : 'Complete your profile to attract better clients.'}
                </p>
              </div>

              {/* Missing sections list — only shown when profile is incomplete */}
              {profileProgress < 100 && (
                <div className="profile-missing-list">
                  {!profileChecks.bio          && <span className="profile-missing-item">+ Bio</span>}
                  {!profileChecks.skills       && <span className="profile-missing-item">+ Skills</span>}
                  {!profileChecks.education    && <span className="profile-missing-item">+ Education</span>}
                  {!profileChecks.languages    && <span className="profile-missing-item">+ Languages</span>}
                  {!profileChecks.hoursPerWeek && <span className="profile-missing-item">+ Hours / week</span>}
                  {!profileChecks.profilePic   && <span className="profile-missing-item">+ Profile photo</span>}
                </div>
              )}

              <button
                className="sidebar-button-secondary"
                onClick={() => navigate('/freelancer/profile')}
                style={{ marginTop: '0.75rem', width: '100%' }}
              >
                Update profile
              </button>
            </div>
          </RightSidebarCard>
        </div>
      </div>
    </div>
  )
}

export default FreelancerHomePage
