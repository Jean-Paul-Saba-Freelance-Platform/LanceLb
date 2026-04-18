import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { Search } from 'lucide-react'
import TopNav from '../src/components/TopNav.jsx'
import JobCard from '../src/components/JobCard.jsx'
import './FreelancerFindWorkPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: 'easeOut', delay: i * 0.05 }
  })
}

export default function FreelancerFindWorkPage() {
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()
  const userName = user?.name?.split(' ')[0] || 'Freelancer'

  const [allJobs, setAllJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [paymentType, setPaymentType] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchJobs = useCallback(async (kw, exp) => {
    setLoading(true)
    setError('')
    try {
      let url = `${API_BASE}/api/client/jobs/open`
      const params = []
      if (kw) params.push(`search=${encodeURIComponent(kw)}`)
      if (exp) params.push(`experienceLevel=${encodeURIComponent(exp)}`)
      if (params.length) url += `?${params.join('&')}`
      const res = await fetch(url)
      const data = await res.json()
      const normalized = (data.jobs || []).map(job => {
        const rawClient = job.clientId
        if (rawClient && typeof rawClient === 'object') {
          return {
            ...job,
            clientId: rawClient._id || rawClient.id || null,
            client: rawClient,
          }
        }
        return job
      })
setAllJobs(normalized)
    } catch {
      setError('Failed to load jobs. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs('', '')
  }, [fetchJobs])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs(keyword, experienceLevel)
    }, keyword ? 400 : 0)
    return () => clearTimeout(timer)
  }, [keyword, experienceLevel, fetchJobs])

  const filteredJobs = allJobs.filter(job => {
    if (paymentType && job.paymentType !== paymentType) return false
    if (budgetMin || budgetMax) {
      const min = budgetMin ? Number(budgetMin) : 0
      const max = budgetMax ? Number(budgetMax) : Infinity
      if (job.paymentType === 'hourly') {
        const jobMax = job.hourlyMax ?? job.hourlyMin ?? 0
        const jobMin = job.hourlyMin ?? 0
        if (budgetMax && jobMin > max) return false
        if (budgetMin && jobMax < min) return false
      } else {
        const fixed = job.fixedBudget ?? 0
        if (budgetMax && fixed > max) return false
        if (budgetMin && fixed < min) return false
      }
    }
    return true
  })

  const activeFilters = []
  if (keyword) activeFilters.push({ key: 'keyword', label: `"${keyword}"`, clear: () => setKeyword('') })
  if (experienceLevel) activeFilters.push({ key: 'exp', label: experienceLevel, clear: () => setExperienceLevel('') })
  if (paymentType) activeFilters.push({ key: 'type', label: paymentType === 'hourly' ? 'Hourly' : 'Fixed-price', clear: () => setPaymentType('') })
  if (budgetMin) activeFilters.push({ key: 'bmin', label: `Min $${budgetMin}`, clear: () => setBudgetMin('') })
  if (budgetMax) activeFilters.push({ key: 'bmax', label: `Max $${budgetMax}`, clear: () => setBudgetMax('') })

  const hasActiveFilters = activeFilters.length > 0

  const clearAll = () => {
    setKeyword('')
    setExperienceLevel('')
    setPaymentType('')
    setBudgetMin('')
    setBudgetMax('')
  }

  return (
    <div className="ffw-page">
      <TopNav userName={userName} />
      <div className="ffw-container">

        <motion.div className="ffw-header" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <h1 className="ffw-title">Find Work</h1>
          <p className="ffw-subtitle">
            {loading ? 'Loading jobs...' : `${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''} available`}
          </p>
        </motion.div>

        <button className="ffw-filter-toggle" onClick={() => setShowFilters(p => !p)}>
          ⚙ Filters {hasActiveFilters ? `(${activeFilters.length})` : ''}
        </button>

        <div className="ffw-body">

          <motion.aside
            className={`ffw-sidebar ${showFilters ? 'ffw-sidebar--open' : ''}`}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="ffw-filter-section">
              <div className="ffw-search-wrap">
                <Search className="ffw-search-icon" size={15} />
                <input
                  className="ffw-search-input"
                  type="text"
                  placeholder="Search jobs..."
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                />
                {keyword && (
                  <button className="ffw-search-clear" onClick={() => setKeyword('')}>×</button>
                )}
              </div>
            </div>

            <div className="ffw-filter-divider" />

            <div className="ffw-filter-section">
              <p className="ffw-filter-label">Experience Level</p>
              {['', 'entry', 'intermediate', 'expert'].map(val => (
                <label key={val} className="ffw-radio-label">
                  <input
                    type="radio"
                    name="exp"
                    value={val}
                    checked={experienceLevel === val}
                    onChange={() => setExperienceLevel(val)}
                  />
                  <span className="ffw-radio-dot" />
                  <span>{val === '' ? 'Any' : val.charAt(0).toUpperCase() + val.slice(1)}</span>
                </label>
              ))}
            </div>

            <div className="ffw-filter-divider" />

            <div className="ffw-filter-section">
              <p className="ffw-filter-label">Project Type</p>
              {[{ val: '', label: 'Any' }, { val: 'hourly', label: 'Hourly' }, { val: 'fixed', label: 'Fixed-price' }].map(({ val, label }) => (
                <label key={val} className="ffw-radio-label">
                  <input
                    type="radio"
                    name="type"
                    value={val}
                    checked={paymentType === val}
                    onChange={() => setPaymentType(val)}
                  />
                  <span className="ffw-radio-dot" />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="ffw-filter-divider" />

            <div className="ffw-filter-section">
              <p className="ffw-filter-label">Budget Range ($)</p>
              <div className="ffw-budget-row">
                <input
                  className="ffw-budget-input"
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={budgetMin}
                  onChange={e => setBudgetMin(e.target.value)}
                />
                <span className="ffw-budget-sep">–</span>
                <input
                  className="ffw-budget-input"
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={budgetMax}
                  onChange={e => setBudgetMax(e.target.value)}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <>
                <div className="ffw-filter-divider" />
                <button className="ffw-clear-all" onClick={clearAll}>
                  Clear all filters
                </button>
              </>
            )}
          </motion.aside>

          <div className="ffw-content">

            {hasActiveFilters && (
              <div className="ffw-chips">
                {activeFilters.map(f => (
                  <span key={f.key} className="ffw-chip">
                    {f.label}
                    <button className="ffw-chip-x" onClick={f.clear}>×</button>
                  </span>
                ))}
              </div>
            )}

            {loading && (
              <div className="ffw-jobs-list">
                {[1, 2, 3].map(i => (
                  <div key={i} className="job-card skeleton-job-card">
                    <div className="skeleton-line skeleton-short" />
                    <div className="skeleton-line skeleton-title" />
                    <div className="skeleton-line skeleton-medium" />
                    <div className="skeleton-line skeleton-long" />
                    <div className="skeleton-tags-row">
                      <div className="skeleton-tag" />
                      <div className="skeleton-tag" />
                      <div className="skeleton-tag" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && !loading && (
              <div className="ffw-error">
                <p>{error}</p>
                <button className="ffw-retry-btn" onClick={() => fetchJobs(keyword, experienceLevel)}>Retry</button>
              </div>
            )}

            {!loading && !error && filteredJobs.length === 0 && (
              <div className="ffw-empty">
                <p className="ffw-empty-title">No jobs match your filters</p>
                <p className="ffw-empty-sub">Try adjusting your search or clearing some filters.</p>
                {hasActiveFilters && (
                  <button className="ffw-retry-btn" onClick={clearAll}>
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {!loading && !error && filteredJobs.length > 0 && (
              <div className="ffw-jobs-list">
                {filteredJobs.map((job, i) => (
                  <motion.div key={job._id} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
                    <JobCard job={job} />
                  </motion.div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
