/**
 * FreelancerFindWorkPage
 *
 * Full job-browse page for freelancers.
 * - Reads ?category=<slug> from the URL on mount and pre-selects that filter.
 * - Maps each category slug to a representative skill keyword sent to the
 *   backend as ?skills=<keyword> (GET /api/client/jobs/open).
 * - Lets the user search by text and switch/clear the category chip.
 * - Renders jobs using the shared JobCard component.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Code2, Palette, TrendingUp, Headphones, PenTool,
  DollarSign, Wrench, Scale, Users, BarChart2, Globe, Camera, X
} from 'lucide-react'
import TopNav from '../src/components/TopNav.jsx'
import JobCard from '../src/components/JobCard.jsx'
import './FreelancerFindWorkPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: 'easeOut', delay: i * 0.06 }
  })
}

// Must match the slugs in Home.jsx CATEGORIES exactly
const CATEGORIES = [
  { icon: <Code2 size={16} />,      label: 'Development & IT',    slug: 'development',  skill: 'development' },
  { icon: <Palette size={16} />,    label: 'Design & Creative',   slug: 'design',       skill: 'design' },
  { icon: <TrendingUp size={16} />, label: 'Sales & Marketing',   slug: 'marketing',    skill: 'marketing' },
  { icon: <Headphones size={16} />, label: 'Admin & Support',     slug: 'admin',        skill: 'admin' },
  { icon: <PenTool size={16} />,    label: 'Writing & Content',   slug: 'writing',      skill: 'writing' },
  { icon: <DollarSign size={16} />, label: 'Finance & Accounting',slug: 'finance',      skill: 'finance' },
  { icon: <Wrench size={16} />,     label: 'Engineering',         slug: 'engineering',  skill: 'engineering' },
  { icon: <Scale size={16} />,      label: 'Legal',               slug: 'legal',        skill: 'legal' },
  { icon: <Users size={16} />,      label: 'HR & Training',       slug: 'hr',           skill: 'HR' },
  { icon: <BarChart2 size={16} />,  label: 'Data Science & AI',   slug: 'data-science', skill: 'data' },
  { icon: <Globe size={16} />,      label: 'Translation',         slug: 'translation',  skill: 'translation' },
  { icon: <Camera size={16} />,     label: 'Photography & Video', slug: 'media',        skill: 'video' },
]

const SLUG_TO_SKILL = Object.fromEntries(CATEGORIES.map(c => [c.slug, c.skill]))

const FreelancerFindWorkPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialise category from URL on first render
  const [activeCategory, setActiveCategory] = useState(
    () => searchParams.get('category') || null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getUserName = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      return u.name?.split(' ')[0] || u.firstName || 'Freelancer'
    } catch { return 'Freelancer' }
  }

  // Fetch whenever category or search changes
  const fetchJobs = useCallback(async (category, query) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('search', query.trim())
      if (category && SLUG_TO_SKILL[category]) {
        params.set('skills', SLUG_TO_SKILL[category])
      }
      const url = `${API_BASE}/api/client/jobs/open${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setJobs(data.jobs || [])
      } else {
        setError('Failed to load jobs.')
      }
    } catch (err) {
      console.error('fetchJobs error:', err)
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }, [])

  // On mount and whenever activeCategory changes, re-fetch
  useEffect(() => {
    fetchJobs(activeCategory, searchQuery)
    // Keep URL in sync with the active category chip
    if (activeCategory) {
      setSearchParams({ category: activeCategory }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory])

  // Debounced text search — fire 400 ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      fetchJobs(activeCategory, searchQuery)
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const handleCategoryClick = (slug) => {
    setActiveCategory(prev => prev === slug ? null : slug)
  }

  const clearFilters = () => {
    setActiveCategory(null)
    setSearchQuery('')
  }

  const formatJob = (job) => ({
    ...job,
    id: job._id,
    rate: job.paymentType === 'hourly'
      ? `$${job.hourlyMin || 0}–$${job.hourlyMax || 0}/hr`
      : `$${job.fixedBudget || job.budget || 0}`,
    type: job.paymentType === 'hourly' ? 'Hourly' : 'Fixed-price',
    experience: job.experienceLevel,
    tags: job.requiredSkills || [],
  })

  const activeCategoryLabel = activeCategory
    ? CATEGORIES.find(c => c.slug === activeCategory)?.label
    : null

  const renderSkeletons = () => (
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
    <div className="fw-page">
      <TopNav userName={getUserName()} />

      <div className="fw-container">
        {/* ── Page header ── */}
        <motion.div className="fw-header" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <h1 className="fw-title">Find Work</h1>
          <p className="fw-subtitle">Browse open jobs from clients across Lebanon and beyond.</p>
        </motion.div>

        {/* ── Search bar ── */}
        <motion.div className="fw-search-wrap" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <svg className="fw-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="fw-search-input"
            type="text"
            placeholder="Search by title, skill, or keyword…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="fw-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </motion.div>

        {/* ── Category chips ── */}
        <motion.div className="fw-chips-wrap" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              className={`fw-chip ${activeCategory === cat.slug ? 'fw-chip--active' : ''}`}
              onClick={() => handleCategoryClick(cat.slug)}
            >
              <span className="fw-chip-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* ── Active filter indicator ── */}
        {(activeCategoryLabel || searchQuery.trim()) && (
          <motion.div className="fw-active-filter" variants={fadeUp} initial="hidden" animate="visible">
            <span>
              {activeCategoryLabel && <strong>{activeCategoryLabel}</strong>}
              {activeCategoryLabel && searchQuery.trim() && ' · '}
              {searchQuery.trim() && <span>"{searchQuery.trim()}"</span>}
            </span>
            <button className="fw-clear-btn" onClick={clearFilters}>
              <X size={13} /> Clear filters
            </button>
          </motion.div>
        )}

        {/* ── Results count ── */}
        {!loading && !error && (
          <motion.p className="fw-result-count" variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            {jobs.length === 0 ? 'No jobs found' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`}
          </motion.p>
        )}

        {/* ── Job feed ── */}
        <div className="fw-feed">
          {loading ? renderSkeletons()
            : error ? (
              <div className="fw-error">
                <p>{error}</p>
                <button className="fw-retry-btn" onClick={() => fetchJobs(activeCategory, searchQuery)}>
                  Retry
                </button>
              </div>
            )
            : jobs.length === 0 ? (
              <div className="fw-empty">
                <p>No jobs match your current filters.</p>
                <button className="fw-retry-btn" onClick={clearFilters}>Clear filters</button>
              </div>
            )
            : jobs.map((job, i) => (
              <motion.div key={job._id} variants={fadeUp} initial="hidden" animate="visible" custom={i * 0.3 + 4}>
                <JobCard job={formatJob(job)} />
              </motion.div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default FreelancerFindWorkPage
