import React, { useState, useEffect } from 'react'
import TopNav from '../src/components/TopNav'
import { 
  TrendingUp, DollarSign, Target, Eye, Mail, MousePointerClick,
  FileText, Users, Award
} from 'lucide-react'
import './FreelancerStatsPage.css'

const FreelancerStatsPage = () => {
  const [user, setUser] = useState(null)
  const [profileMetricTab, setProfileMetricTab] = useState('views')
  const [profileTimeFilter, setProfileTimeFilter] = useState('7days')
  const [proposalsTimeFilter, setProposalsTimeFilter] = useState('7days')

  useEffect(() => {
    // Get user from localStorage
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        setUser(JSON.parse(userStr))
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }, [])

  const userName = user?.name || user?.firstName || 'Freelancer'

  // Placeholder data
  const profileMetrics = {
    views: { value: 0, label: 'profile views' },
    invites: { value: 0, label: 'invites received' },
    clicks: { value: 0, label: 'profile clicks' }
  }

  const currentMetric = profileMetrics[profileMetricTab]

  // Simple chart data placeholder (for visual representation)
  const chartData = [0, 0, 0, 0, 0, 0, 0] // 7 days of zeros

  return (
    <div className="freelancer-stats-page">
      <TopNav userName={userName} />

      <div className="stats-page-container">
        {/* Page Header */}
        <div className="stats-page-header">
          <div className="stats-header-content">
            <h1 className="stats-page-title">Stats & trends</h1>
            <p className="stats-page-subtitle">
              Track your proposals, earnings, profile activity, and performance over time.
            </p>
            <p className="stats-page-note">
              Stats may take time to update.
            </p>
          </div>
        </div>

        {/* Main Grid - 2 Columns */}
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
              <a href="#" className="stats-card-link" onClick={(e) => { e.preventDefault(); console.log('View transactions') }}>
                View transactions
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
              <button className="stats-card-button" onClick={() => console.log('View insights')}>
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

              {/* Main Stat */}
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
                    ></div>
                  ))}
                </div>
                <div className="chart-labels">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <span key={index} className="chart-label">{day}</span>
                  ))}
                </div>
              </div>

              {/* Hint Card */}
              <div className="stats-hint-card">
                <p className="hint-text">Complete your profile to improve visibility.</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="stats-right-column">
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
              <div className="proposals-subtitle">0 proposals sent</div>
              
              <div className="proposals-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Sent:</span>
                  <span className="breakdown-value">0</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Viewed:</span>
                  <span className="breakdown-value">0</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Interviews:</span>
                  <span className="breakdown-value">0</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Hires:</span>
                  <span className="breakdown-value">0</span>
                </div>
              </div>

              <a href="#" className="stats-card-link" onClick={(e) => { e.preventDefault(); console.log('View proposals') }}>
                View proposals
              </a>

              {/* Note Card */}
              <div className="stats-hint-card">
                <p className="hint-text">
                  Browse jobs and send proposals to get noticed.{' '}
                  <a href="#" className="hint-link" onClick={(e) => { e.preventDefault(); console.log('Search jobs') }}>
                    Search jobs
                  </a>
                </p>
              </div>
            </div>

            {/* Client Relationships Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <Users size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">Client relationships</h2>
                </div>
              </div>
              <p className="stats-card-description">
                Long-term relationships can improve your profile strength.
              </p>
              <div className="score-circle-wrapper">
                <div className="score-circle">
                  <span className="score-value">—</span>
                </div>
              </div>
              <div className="relationship-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#00a884' }}></div>
                  <span>90+ days</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#cbd5e1' }}></div>
                  <span>Under 90 days</span>
                </div>
              </div>
              <a href="#" className="stats-card-link" onClick={(e) => { e.preventDefault(); console.log('Learn more') }}>
                Learn more
              </a>
            </div>

            {/* Credits Card */}
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <DollarSign size={20} className="stats-card-icon" />
                  <h2 className="stats-card-title">Credits</h2>
                </div>
              </div>
              <div className="credits-value">Credits: 0</div>
              <p className="credits-description">
                Credits help you apply to premium postings.
              </p>
              <button className="stats-card-button" onClick={() => console.log('Get credits')}>
                Get credits
              </button>
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
              <a href="#" className="stats-card-link" onClick={(e) => { e.preventDefault(); console.log('Learn how to earn badges') }}>
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
