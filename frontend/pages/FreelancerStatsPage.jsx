import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav'
import {
  TrendingUp, DollarSign, Target, Eye, Mail, MousePointerClick,
  FileText, Award, Briefcase, Bot
} from 'lucide-react'
import './FreelancerStatsPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const getRatePillClass = (rate) => {
  if (rate > 20) return 'rate-pill rate-pill--green'
  if (rate > 10) return 'rate-pill rate-pill--yellow'
  return 'rate-pill rate-pill--red'
}

const getScoreColor = (score) => {
  if (score >= 70) return '#00a884'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

const FreelancerStatsPage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [statsData, setStatsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profileMetricTab, setProfileMetricTab] = useState('views')
  const [profileTimeFilter, setProfileTimeFilter] = useState('7days')
  const [proposalsTimeFilter, setProposalsTimeFilter] = useState('7days')

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
        const res = await fetch(`${API_BASE}/api/freelancer/stats`, {
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
        console.error('Failed to fetch freelancer stats:', err)
        setError(err.message || 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const userName = user?.name || user?.firstName || 'Freelancer'

  const profileMetrics = {
    views: { value: 0, label: 'profile views' },
    invites: { value: 0, label: 'invites received' },
    clicks: { value: 0, label: 'profile clicks' }
  }
  const currentMetric = profileMetrics[profileMetricTab]
  const chartData = [0, 0, 0, 0, 0, 0, 0]

  const proposals = statsData?.proposals || {}
  const totalProposals = proposals.total ?? 0
  const successRate = statsData?.successRate ?? 0
  const shortlistRate = statsData?.shortlistRate ?? 0
  const activeContracts = statsData?.activeContracts ?? 0
  const completedContracts = statsData?.completedContracts ?? 0
  const contractList = statsData?.activeContractList || []
  const avgAiScore = statsData?.avgAiScore ?? null
  const avgAtsScore = statsData?.avgAtsScore ?? null

  if (loading) {
    return (
      <div className="freelancer-stats-page">
        <TopNav userName={userName} />
        <div className="stats-page-container">
          <div className="stats-skeleton-header">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-subtitle" />
          </div>
          <div className="stats-grid">
            <div className="stats-left-column">
              {[1, 2, 3].map((i) => (
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
      <div className="freelancer-stats-page">
        <TopNav userName={userName} />
        <div className="stats-page-container">
          <div className="stats-error-state">
            <p className="stats-error-text">Could not load stats: {error}</p>
            <button className="stats-card-button" style={{ width: 'auto', marginTop: '1rem' }} onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="freelancer-stats-page">
      <TopNav userName={userName} />

      <div className="stats-page-container">
        {/* Page Header */}
        <div className="stats-page-header">
          <div className="stats-header-content">
            <h1 className="stats-page-title">Stats &amp; trends</h1>
            <p className="stats-page-subtitle">
              Track your proposals, earnings, profile activity, and performance over time.
            </p>
            <p className="stats-page-note">Stats may take time to update.</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="stats-grid">
          {/* LEFT COLUMN */}
          <div className="stats-left-column">
            {/* Earnings Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <DollarSign size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">12-month earnings</h2>
                </div>
              </div>
              <div className="earnings-value">$0</div>
              <a
                href="#"
                className="stats-card-link"
                onClick={(e) => { e.preventDefault() }}
              >
                View transactions
              </a>
            </div>

            {/* Proposals Card */}
            <div className="stats-card">
              <div className="stats-card-header-row">
                <div className="stats-card-title-group">
                  <FileText size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">Proposals</h2>
                </div>
                <div className="stats-filter-dropdown">
                  <select
                    value={proposalsTimeFilter}
                    onChange={(e) => setProposalsTimeFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                    <option value="90days">Last 90 days</option>
                  </select>
                </div>
              </div>

              <div className="proposals-subtitle">{totalProposals} proposals sent</div>

              <div className="proposals-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Pending:</span>
                  <span className="breakdown-value">{proposals.pending ?? 0}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Shortlisted:</span>
                  <span className="breakdown-value">{proposals.shortlisted ?? 0}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Accepted:</span>
                  <span className="breakdown-value">{proposals.accepted ?? 0}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Rejected:</span>
                  <span className="breakdown-value">{proposals.rejected ?? 0}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Withdrawn:</span>
                  <span className="breakdown-value">{proposals.withdrawn ?? 0}</span>
                </div>
              </div>

              <div className="proposals-rates">
                <div className="rate-row">
                  <span className="rate-label">Success rate:</span>
                  <span className={getRatePillClass(successRate)}>{successRate}%</span>
                </div>
                <div className="rate-row">
                  <span className="rate-label">Shortlist rate:</span>
                  <span className={getRatePillClass(shortlistRate)}>{shortlistRate}%</span>
                </div>
              </div>

              <a
                href="#"
                className="stats-card-link"
                onClick={(e) => { e.preventDefault(); navigate('/freelancer/proposals') }}
              >
                View proposals
              </a>

              <div className="stats-hint-card">
                <p className="hint-text">
                  Browse jobs and send proposals to get noticed.{' '}
                  <a
                    href="#"
                    className="hint-link"
                    onClick={(e) => { e.preventDefault(); navigate('/freelancer/jobs') }}
                  >
                    Search jobs
                  </a>
                </p>
              </div>
            </div>

            {/* AI & ATS Scores Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <Bot size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">AI &amp; ATS Scores</h2>
                </div>
              </div>

              <div className="score-metric">
                <div className="score-metric-header">
                  <span className="score-metric-label">Average AI Score</span>
                  <span
                    className="score-metric-value"
                    style={{ color: avgAiScore != null ? getScoreColor(avgAiScore) : '#94a3b8' }}
                  >
                    {avgAiScore != null ? `${avgAiScore}/100` : '—'}
                  </span>
                </div>
                <div className="score-progress-track">
                  <div
                    className="score-progress-fill"
                    style={{
                      width: avgAiScore != null ? `${avgAiScore}%` : '0%',
                      background: avgAiScore != null ? getScoreColor(avgAiScore) : '#374151'
                    }}
                  />
                </div>
              </div>

              <div className="score-metric">
                <div className="score-metric-header">
                  <span className="score-metric-label">Average ATS Score</span>
                  <span
                    className="score-metric-value"
                    style={{ color: avgAtsScore != null ? getScoreColor(avgAtsScore) : '#94a3b8' }}
                  >
                    {avgAtsScore != null ? `${avgAtsScore}/100` : '—'}
                  </span>
                </div>
                <div className="score-progress-track">
                  <div
                    className="score-progress-fill"
                    style={{
                      width: avgAtsScore != null ? `${avgAtsScore}%` : '0%',
                      background: avgAtsScore != null ? getScoreColor(avgAtsScore) : '#374151'
                    }}
                  />
                </div>
              </div>

              <div className="stats-hint-card" style={{ marginTop: '1rem' }}>
                <p className="hint-text">Scores are averaged across your submitted proposals.</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="stats-right-column">
            {/* Active Contracts Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <Briefcase size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">Active Contracts</h2>
                </div>
              </div>

              <div className="earnings-value">{activeContracts}</div>
              <p className="stats-card-description" style={{ marginTop: '0.25rem' }}>
                {completedContracts} completed
              </p>

              {contractList.length > 0 && (
                <div className="contract-list">
                  {contractList.slice(0, 3).map((contract, idx) => (
                    <div key={idx} className="contract-item">
                      <span className="contract-title">{contract.title}</span>
                      {contract.tasksDone != null && contract.tasksTotal != null && (
                        <span className="contract-progress">
                          {contract.tasksDone}/{contract.tasksTotal} tasks
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {contractList.length === 0 && activeContracts === 0 && (
                <div className="stats-hint-card" style={{ marginTop: '0.75rem' }}>
                  <p className="hint-text">No active contracts yet. Keep applying!</p>
                </div>
              )}

              <a
                href="#"
                className="stats-card-link"
                onClick={(e) => { e.preventDefault(); navigate('/freelancer/deliver-work') }}
              >
                View contracts
              </a>
            </div>

            {/* Reliability Score Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <Target size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">Reliability Score</h2>
                </div>
              </div>
              <p className="stats-card-description">
                Your reliability is based on responsiveness and project outcomes.
              </p>
              <div className="score-circle-wrapper">
                <div className="score-circle">
                  <span className="score-value">—</span>
                </div>
              </div>
              <button
                className="stats-card-button"
                onClick={() => console.log('View insights')}
              >
                View insights
              </button>
            </div>

            {/* Profile Metrics Card */}
            <div className="stats-card">
              <div className="stats-card-header-row">
                <div className="stats-card-title-group">
                  <TrendingUp size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">Profile metrics</h2>
                </div>
                <div className="stats-filter-dropdown">
                  <select
                    value={profileTimeFilter}
                    onChange={(e) => setProfileTimeFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                    <option value="90days">Last 90 days</option>
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div className="metrics-tabs">
                <button
                  className={`metric-tab ${profileMetricTab === 'views' ? 'active' : ''}`}
                  onClick={() => setProfileMetricTab('views')}
                >
                  <Eye size={16} />
                  <span>Profile views</span>
                </button>
                <button
                  className={`metric-tab ${profileMetricTab === 'invites' ? 'active' : ''}`}
                  onClick={() => setProfileMetricTab('invites')}
                >
                  <Mail size={16} />
                  <span>Invites</span>
                </button>
                <button
                  className={`metric-tab ${profileMetricTab === 'clicks' ? 'active' : ''}`}
                  onClick={() => setProfileMetricTab('clicks')}
                >
                  <MousePointerClick size={16} />
                  <span>Clicks</span>
                </button>
              </div>

              <div className="metric-main-value">
                {currentMetric.value} {currentMetric.label}
              </div>

              {/* Simple Chart Placeholder */}
              <div className="chart-placeholder">
                <div className="chart-bars">
                  {chartData.map((value, index) => (
                    <div
                      key={index}
                      className="chart-bar"
                      style={{ height: `${Math.max(10, value)}%` }}
                    />
                  ))}
                </div>
                <div className="chart-labels">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <span key={index} className="chart-label">{day}</span>
                  ))}
                </div>
              </div>

              <div className="stats-hint-card">
                <p className="hint-text">Profile metrics coming soon. Complete your profile to improve visibility.</p>
              </div>
            </div>

            {/* Achievements Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <Award size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">Achievements</h2>
                </div>
              </div>
              <div className="achievement-badge">
                <Award size={24} />
                <span>Starter badge</span>
              </div>
              <a
                href="#"
                className="stats-card-link"
                onClick={(e) => { e.preventDefault() }}
              >
                Learn how to earn badges
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FreelancerStatsPage
