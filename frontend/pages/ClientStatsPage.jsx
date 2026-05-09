import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav'
import { Briefcase, FileText, FolderOpen, Users } from 'lucide-react'
import './FreelancerStatsPage.css'
import './ClientStatsPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const getRatePillClass = (rate) => {
  if (rate > 50) return 'rate-pill rate-pill--green'
  if (rate > 25) return 'rate-pill rate-pill--yellow'
  return 'rate-pill rate-pill--red'
}

const ClientStatsPage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [statsData, setStatsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) setUser(JSON.parse(userStr))
    } catch (err) {
      console.error('Error loading user:', err)
    }
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/client/stats`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
        if (!res.ok) throw new Error(`Server returned ${res.status}`)
        const json = await res.json()
        setStatsData(json)
      } catch (err) {
        console.error('Failed to fetch client stats:', err)
        setError(err.message || 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const userName = user?.name?.split(' ')[0] || user?.firstName || 'Client'

  if (loading) {
    return (
      <div className="client-stats-page">
        <TopNav userName={userName} />
        <div className="stats-page-container">
          <div className="stats-skeleton-header">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-subtitle" />
          </div>
          <div className="stats-grid">
            <div className="stats-left-column">
              {[1, 2].map((i) => (
                <div key={i} className="stats-card skeleton-card">
                  <div className="skeleton skeleton-card-title" />
                  <div className="skeleton skeleton-card-body" />
                  <div className="skeleton skeleton-card-body short" />
                </div>
              ))}
            </div>
            <div className="stats-right-column">
              {[1, 2, 3].map((i) => (
                <div key={i} className="stats-card skeleton-card">
                  <div className="skeleton skeleton-card-title" />
                  <div className="skeleton skeleton-card-body" />
                  <div className="skeleton skeleton-card-body short" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="client-stats-page">
        <TopNav userName={userName} />
        <div className="stats-page-container">
          <div className="stats-error-state">
            <p className="stats-error-text">Could not load stats: {error}</p>
            <button
              className="stats-card-button"
              style={{ width: 'auto', marginTop: '1rem' }}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const {
    jobsPosted = 0,
    openJobs = 0,
    inProgressJobs = 0,
    closedJobs = 0,
    totalApplications = 0,
    applicationsReviewed = 0,
    freelancersHired = 0,
    activeProjects = 0,
    completedProjects = 0,
    avgApplicationsPerJob = 0
  } = statsData || {}

  const reviewRate = totalApplications > 0
    ? Math.round((applicationsReviewed / totalApplications) * 100)
    : 0
  const hireRate = totalApplications > 0
    ? Math.round((freelancersHired / totalApplications) * 100)
    : 0

  const totalProjects = activeProjects + completedProjects
  const planningProjects = Math.max(0, jobsPosted - totalProjects)

  const avatarCount = Math.min(freelancersHired, 5)
  const avatarOverflow = freelancersHired > 5 ? freelancersHired - 5 : 0

  return (
    <div className="client-stats-page">
      <TopNav userName={userName} />

      <div className="stats-page-container">
        {/* Page Header */}
        <div className="stats-page-header">
          <div className="stats-header-content">
            <h1 className="stats-page-title">Stats &amp; trends</h1>
            <p className="stats-page-subtitle">
              Track your job postings, applicants, projects, and hiring activity over time.
            </p>
            <p className="stats-page-note">Stats may take time to update.</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="stats-grid">
          {/* LEFT COLUMN */}
          <div className="stats-left-column">
            {/* Jobs Overview Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <Briefcase size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">Jobs Posted</h2>
                </div>
              </div>

              <div className="earnings-value">{jobsPosted}</div>

              <div className="proposals-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Open:</span>
                  <span className="breakdown-value">
                    <span className="rate-pill rate-pill--green">{openJobs}</span>
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">In Progress:</span>
                  <span className="breakdown-value">
                    <span className="client-pill client-pill--blue">{inProgressJobs}</span>
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Closed:</span>
                  <span className="breakdown-value">
                    <span className="client-pill client-pill--gray">{closedJobs}</span>
                  </span>
                </div>
              </div>

              <a
                href="#"
                className="stats-card-link"
                onClick={(e) => { e.preventDefault(); navigate('/client/jobs') }}
              >
                Manage jobs
              </a>
            </div>

            {/* Applicants Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <FileText size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">Applications Received</h2>
                </div>
              </div>

              <div className="earnings-value">{totalApplications}</div>

              <div className="proposals-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Reviewed:</span>
                  <span className="breakdown-value">{applicationsReviewed}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Hired:</span>
                  <span className="breakdown-value">{freelancersHired}</span>
                </div>
              </div>

              <div className="proposals-rates">
                <div className="rate-row">
                  <span className="rate-label">Review rate:</span>
                  <span className={getRatePillClass(reviewRate)}>{reviewRate}%</span>
                </div>
                <div className="rate-row">
                  <span className="rate-label">Hire rate:</span>
                  <span className={getRatePillClass(hireRate)}>{hireRate}%</span>
                </div>
                <div className="rate-row">
                  <span className="rate-label">Avg per job:</span>
                  <span className="breakdown-value">{avgApplicationsPerJob} applications</span>
                </div>
              </div>

              <a
                href="#"
                className="stats-card-link"
                onClick={(e) => { e.preventDefault(); navigate('/client/jobs') }}
              >
                View applications
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="stats-right-column">
            {/* Projects Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <FolderOpen size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">Projects</h2>
                </div>
              </div>

              <div className="earnings-value">{activeProjects}</div>
              <p className="stats-card-description" style={{ marginTop: '0.25rem' }}>active projects</p>

              <div className="proposals-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Completed:</span>
                  <span className="breakdown-value">{completedProjects}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Planning:</span>
                  <span className="breakdown-value">{planningProjects}</span>
                </div>
              </div>

              <a
                href="#"
                className="stats-card-link"
                onClick={(e) => { e.preventDefault(); navigate('/client/projects') }}
              >
                View projects
              </a>
            </div>

            {/* Freelancers Hired Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <Users size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">Freelancers Hired</h2>
                </div>
              </div>

              <div className="earnings-value">{freelancersHired}</div>
              <p className="stats-card-description" style={{ marginTop: '0.25rem' }}>
                across {jobsPosted} job posting{jobsPosted !== 1 ? 's' : ''}
              </p>

              {freelancersHired > 0 && (
                <div className="hired-avatars-row">
                  {Array.from({ length: avatarCount }).map((_, i) => (
                    <div key={i} className="hired-avatar-circle">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  {avatarOverflow > 0 && (
                    <div className="hired-avatar-overflow">+{avatarOverflow}</div>
                  )}
                </div>
              )}

              {freelancersHired === 0 && (
                <div className="stats-hint-card" style={{ marginTop: '0.75rem' }}>
                  <p className="hint-text">You haven't hired anyone yet. Review your applicants to get started.</p>
                </div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <h2 className="stats-card-title">Quick Actions</h2>
                </div>
              </div>

              <button
                className="stats-card-button"
                onClick={() => navigate('/client/post-job/title')}
              >
                Post a New Job
              </button>

              <button
                className="stats-card-button client-action-button--secondary"
                onClick={() => navigate('/client/jobs')}
              >
                View Applications
              </button>

              <button
                className="stats-card-button client-action-button--outline"
                onClick={() => navigate('/client/projects')}
              >
                View Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientStatsPage
