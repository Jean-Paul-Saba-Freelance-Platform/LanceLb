import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Briefcase,
  FileText,
  Building2,
  BarChart2,
  ArrowLeft,
} from 'lucide-react'
import './AdminDashboard.css'

const API_BASE = 'http://127.0.0.1:4000'
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Returns the bar color based on percentage value thresholds
const healthColor = (pct) => {
  if (pct >= 50) return '#10b981'
  if (pct >= 20) return '#fbbf24'
  return '#f87171'
}

// Fetches all admin data in parallel on mount and renders the full dashboard
const AdminDashboard = () => {
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [growth, setGrowth] = useState([])
  const [categories, setCategories] = useState([])
  const [topFreelancers, setTopFreelancers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) setUser(JSON.parse(raw))
    } catch (_) {}
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }

        const [statsRes, growthRes, categoriesRes, freelancersRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/stats`, { headers, credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/user-growth`, { headers, credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/job-categories`, { headers, credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/top-freelancers`, { headers, credentials: 'include' }),
        ])

        const [statsData, growthData, categoriesData, freelancersData] = await Promise.all([
          statsRes.json(),
          growthRes.json(),
          categoriesRes.json(),
          freelancersRes.json(),
        ])

        if (!statsData.success) throw new Error(statsData.message || 'Failed to load stats')

        setStats(statsData.stats)
        setGrowth(growthData.growth || [])
        setCategories(categoriesData.categories || [])
        setTopFreelancers(freelancersData.topFreelancers || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
        // Delay to let DOM paint before triggering CSS transitions
        requestAnimationFrame(() => setTimeout(() => setLoaded(true), 50))
      }
    }

    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="adm-shell">
        <Sidebar navigate={navigate} />
        <div className="adm-body">
          <div className="adm-fullscreen-center">
            <div className="adm-spinner" />
            <p className="adm-spinner-label">Loading dashboard…</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="adm-shell">
        <Sidebar navigate={navigate} />
        <div className="adm-body">
          <div className="adm-fullscreen-center">
            <span className="adm-error-icon">⚠</span>
            <p className="adm-error-msg">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const maxSkillCount = categories.length > 0 ? categories[0].count : 1
  const maxGrowthCount = growth.length > 0 ? Math.max(...growth.map(g => g.count)) : 1

  const hireRate = stats.totalApplications > 0
    ? Math.round((stats.hiredApplications / stats.totalApplications) * 100)
    : 0
  const jobFillRate = stats.totalJobs > 0
    ? Math.round((stats.hiredApplications / stats.totalJobs) * 100)
    : 0
  const clientRatio = (stats.totalClients + stats.totalFreelancers) > 0
    ? Math.round((stats.totalClients / (stats.totalClients + stats.totalFreelancers)) * 100)
    : 0

  return (
    <div className="adm-shell">
      <Sidebar navigate={navigate} />

      <div className="adm-body">
        {/* Top navbar */}
        <header className="adm-topbar">
          <span className="adm-topbar-title">Overview</span>
          <div className="adm-topbar-user">
            <span className="adm-topbar-name">{user?.name || 'Admin'}</span>
            <div className="adm-avatar">
              {(user?.name?.[0] || 'A').toUpperCase()}
            </div>
          </div>
        </header>

        <main className="adm-main">

          {/* KPI Cards */}
          <section className="adm-section">
            <h2 className="adm-section-title">Key Metrics</h2>
            <div className="adm-kpi-grid">
              <KpiCard
                label="Total Freelancers"
                value={stats.totalFreelancers}
                Icon={Users}
                accent="#00a884"
              />
              <KpiCard
                label="Total Clients"
                value={stats.totalClients}
                Icon={Building2}
                accent="#3b82f6"
              />
              <KpiCard
                label="Active Jobs"
                value={stats.activeJobs}
                Icon={Briefcase}
                accent="#fbbf24"
              />
              <KpiCard
                label="Total Applications"
                value={stats.totalApplications}
                Icon={FileText}
                accent="#a78bfa"
              />
            </div>
          </section>

          {/* Platform Health */}
          <section className="adm-section">
            <div className="adm-card adm-health-card">
              <h3 className="adm-card-title">Platform Health</h3>
              <div className="adm-health-list">
                <HealthBar label="Hire Rate" pct={hireRate} loaded={loaded} />
                <HealthBar label="Job Fill Rate" pct={jobFillRate} loaded={loaded} />
                <HealthBar label="Client / User Ratio" pct={clientRatio} loaded={loaded} />
              </div>
            </div>
          </section>

          {/* Top Skills */}
          <section className="adm-section">
            <h2 className="adm-section-title">Top Skills in Demand</h2>
            <div className="adm-card">
              {categories.length === 0 ? (
                <p className="adm-empty">No job postings yet — skill data will appear here.</p>
              ) : (
                <div className="adm-skills-list">
                  {categories.map((cat) => (
                    <div key={cat.skill} className="adm-skill-row">
                      <span className="adm-skill-name">{cat.skill}</span>
                      <div className="adm-skill-track">
                        <div
                          className="adm-skill-fill"
                          style={{
                            width: loaded ? `${(cat.count / maxSkillCount) * 100}%` : '0%',
                          }}
                        />
                      </div>
                      <span className="adm-skill-count">{cat.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Top Freelancers */}
          <section className="adm-section">
            <h2 className="adm-section-title">Top Freelancers</h2>
            <div className="adm-card adm-card-flush">
              {topFreelancers.length === 0 ? (
                <p className="adm-empty">No accepted applications yet.</p>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Title</th>
                      <th>Hired</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topFreelancers.map((fl, i) => (
                      <tr key={fl.email} className={i % 2 === 0 ? 'adm-row-even' : 'adm-row-odd'}>
                        <td className="adm-rank">#{i + 1}</td>
                        <td>
                          <div className="adm-fl-name-cell">
                            <div className="adm-fl-avatar">
                              {(fl.name?.[0] || '?').toUpperCase()}
                            </div>
                            <span className="adm-fl-name">{fl.name || '—'}</span>
                          </div>
                        </td>
                        <td className="adm-email">{fl.email}</td>
                        <td className="adm-title-cell">
                          {fl.title || <span className="adm-muted">No title</span>}
                        </td>
                        <td className="adm-hired">
                          <span className="adm-hired-badge">{fl.hiredCount}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* User Growth */}
          <section className="adm-section">
            <h2 className="adm-section-title">User Growth — Last 6 Months</h2>
            <div className="adm-card">
              {growth.length === 0 ? (
                <div className="adm-growth-empty">
                  <BarChart2 size={32} color="#8696a0" />
                  <p>No new signups in the last 6 months — growth data will appear here as users register.</p>
                </div>
              ) : (
                <div className="adm-growth-chart">
                  {growth.map((g) => (
                    <div key={`${g._id.year}-${g._id.month}`} className="adm-growth-col">
                      <span className="adm-growth-count">{g.count}</span>
                      <div className="adm-growth-track">
                        <div
                          className="adm-growth-fill"
                          style={{
                            height: loaded ? `${(g.count / maxGrowthCount) * 100}%` : '0%',
                          }}
                        />
                      </div>
                      <span className="adm-growth-label">
                        {MONTH_NAMES[(g._id.month - 1) % 12]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}

// Fixed left sidebar with logo and back link
const Sidebar = ({ navigate }) => (
  <aside className="adm-sidebar">
    <div className="adm-sidebar-logo">
      <span className="adm-sidebar-brand">LanceLB</span>
      <span className="adm-sidebar-sub">Admin Panel</span>
    </div>

    <div className="adm-sidebar-spacer" />

    <button className="adm-back-btn" onClick={() => navigate('/client/home')}>
      <ArrowLeft size={15} />
      <span>Back to App</span>
    </button>
  </aside>
)

// KPI card with icon in a translucent circle, large number, bottom border accent
const KpiCard = ({ label, value, Icon, accent }) => (
  <div className="adm-kpi-card" style={{ '--accent': accent }}>
    <div className="adm-kpi-top">
      <div className="adm-kpi-icon-wrap" style={{ background: `${accent}22` }}>
        <Icon size={18} color={accent} />
      </div>
    </div>
    <span className="adm-kpi-value">{value?.toLocaleString() ?? '—'}</span>
    <span className="adm-kpi-label">{label}</span>
    <div className="adm-kpi-bottom-bar" style={{ background: accent }} />
  </div>
)

// Animated horizontal progress bar for Platform Health section
const HealthBar = ({ label, pct, loaded }) => {
  const color = healthColor(pct)
  return (
    <div className="adm-health-row">
      <span className="adm-health-label">{label}</span>
      <div className="adm-health-track">
        <div
          className="adm-health-fill"
          style={{
            width: loaded ? `${pct}%` : '0%',
            background: color,
          }}
        />
      </div>
      <span className="adm-health-pct" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default AdminDashboard
