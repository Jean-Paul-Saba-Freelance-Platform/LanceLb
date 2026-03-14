import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './EditJobPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const SIZE_LABELS   = { small: 'Small', medium: 'Medium', large: 'Large' }
const DURATION_LABELS = {
  '1_to_3_months': '1–3 months',
  '3_to_6_months': '3–6 months',
  'more_than_6_months': 'More than 6 months',
}
const EXPERIENCE_LABELS = { entry: 'Entry level', intermediate: 'Intermediate', expert: 'Expert' }

const PROJECT_SIZE_OPTIONS   = Object.entries(SIZE_LABELS).map(([v, l]) => ({ value: v, label: l }))
const DURATION_OPTIONS       = Object.entries(DURATION_LABELS).map(([v, l]) => ({ value: v, label: l }))
const EXPERIENCE_OPTIONS     = Object.entries(EXPERIENCE_LABELS).map(([v, l]) => ({ value: v, label: l }))
const CONTRACT_HIRE_OPTIONS  = [{ value: true, label: 'Yes' }, { value: false, label: 'No' }]

const EditJobPage = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requiredSkills, setRequiredSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [projectSize, setProjectSize] = useState('')
  const [duration, setDuration] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [contractToHire, setContractToHire] = useState(false)
  const [paymentType, setPaymentType] = useState('')
  const [hourlyMin, setHourlyMin] = useState('')
  const [hourlyMax, setHourlyMax] = useState('')
  const [fixedBudget, setFixedBudget] = useState('')

  const getUserName = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.name?.split(' ')[0] || user.firstName || 'Client'
      }
    } catch { /* ignore */ }
    return 'Client'
  }

  const populateForm = (job) => {
    setTitle(job.title || '')
    setDescription(job.description || '')
    setRequiredSkills(job.requiredSkills || [])
    setProjectSize(job.projectSize || '')
    setDuration(job.duration || '')
    setExperienceLevel(job.experienceLevel || '')
    setContractToHire(job.contractToHire === true || job.contractToHire === 'yes')
    setPaymentType(job.paymentType || '')
    setHourlyMin(job.hourlyMin != null ? String(job.hourlyMin) : '')
    setHourlyMax(job.hourlyMax != null ? String(job.hourlyMax) : '')
    setFixedBudget(job.fixedBudget != null ? String(job.fixedBudget) : '')
  }

  useEffect(() => {
    if (location.state?.job) {
      populateForm(location.state.job)
      setLoading(false)
      return
    }

    const fetchJob = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/client/jobs`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: 'include',
        })
        const data = await res.json()
        if (res.ok && data.success) {
          const job = (data.data || []).find(j => (j.id || j._id) === jobId)
          if (job) {
            populateForm(job)
          } else {
            setError('Job not found.')
          }
        } else {
          setError(data.message || 'Failed to load job')
        }
      } catch {
        setError('Network error — make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId, location.state])

  /* ----- Skills management ----- */
  const addSkill = () => {
    const s = skillInput.trim()
    if (!s) return
    if (requiredSkills.length >= 30) return
    const dup = requiredSkills.some(sk => sk.toLowerCase() === s.toLowerCase())
    if (dup) return
    setRequiredSkills([...requiredSkills, s])
    setSkillInput('')
  }

  const removeSkill = (idx) => {
    setRequiredSkills(requiredSkills.filter((_, i) => i !== idx))
  }

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill() }
  }

  /* ----- Validation ----- */
  const titleErr = title.trim().length > 0 && title.trim().length < 5
    ? 'Title must be at least 5 characters' : ''
  const descErr = description.trim().length > 0 && description.trim().length < 20
    ? 'Description must be at least 20 characters' : ''
  const descMaxErr = description.length > 5000 ? 'Description cannot exceed 5000 characters' : ''
  const skillsErr = requiredSkills.length === 0 ? 'At least 1 skill is required' : ''

  const hourlyMinNum = parseFloat(hourlyMin)
  const hourlyMaxNum = parseFloat(hourlyMax)
  const fixedNum     = parseFloat(fixedBudget)

  const budgetValid = paymentType === 'hourly'
    ? hourlyMin !== '' && hourlyMax !== '' && hourlyMinNum > 0 && hourlyMaxNum > 0 && hourlyMinNum <= hourlyMaxNum
    : paymentType === 'fixed'
      ? fixedBudget !== '' && fixedNum > 0
      : false

  const formValid =
    title.trim().length >= 5 &&
    description.trim().length >= 20 &&
    description.length <= 5000 &&
    requiredSkills.length >= 1 &&
    requiredSkills.length <= 30 &&
    projectSize && duration && experienceLevel &&
    budgetValid

  /* ----- Save ----- */
  const handleSave = async () => {
    if (!formValid || saving) return
    setSaving(true)
    setError('')
    setSuccess('')

    const budget = paymentType === 'fixed' ? fixedNum : hourlyMinNum

    const payload = {
      title: title.trim(),
      description: description.trim(),
      requiredSkills,
      projectSize,
      duration,
      experienceLevel,
      contractToHire,
      paymentType,
      hourlyMin: paymentType === 'hourly' ? hourlyMinNum : undefined,
      hourlyMax: paymentType === 'hourly' ? hourlyMaxNum : undefined,
      fixedBudget: paymentType === 'fixed' ? fixedNum : undefined,
      budget,
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/client/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Job updated successfully!')
        setTimeout(() => navigate('/client/jobs'), 1200)
      } else {
        setError(data.message || 'Failed to update job')
      }
    } catch {
      setError('Network error — make sure the backend is running.')
    } finally {
      setSaving(false)
    }
  }

  /* ----- Render ----- */
  if (loading) {
    return (
      <div className="edit-job-page">
        <TopNav userName={getUserName()} />
        <div className="edit-job-container">
          <div className="edit-loading">
            <div className="edit-skeleton" style={{ height: 36, width: 200 }} />
            <div className="edit-skeleton" style={{ height: 48 }} />
            <div className="edit-skeleton" style={{ height: 120 }} />
            <div className="edit-skeleton" style={{ height: 48 }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="edit-job-page">
      <TopNav userName={getUserName()} />
      <div className="edit-job-container">
        <div className="edit-header">
          <button className="edit-back-link" onClick={() => navigate('/client/jobs')}>
            ← Back to Manage Jobs
          </button>
          <h1 className="edit-title">Edit Job Post</h1>
        </div>

        {error && (
          <div className="edit-banner error">
            <span>{error}</span>
            <button className="edit-banner-dismiss" onClick={() => setError('')}>×</button>
          </div>
        )}

        {success && (
          <div className="edit-banner success">
            <span>{success}</span>
          </div>
        )}

        <div className="edit-form">
          {/* Title */}
          <div className="edit-field">
            <label className="edit-label">Job Title</label>
            <input
              type="text"
              className="edit-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Full-Stack React Developer"
            />
            {titleErr && <p className="edit-field-error">{titleErr}</p>}
            <span className="edit-char-count">{title.length}/120</span>
          </div>

          {/* Skills */}
          <div className="edit-field">
            <label className="edit-label">Required Skills</label>
            <div className="edit-skills-input-row">
              <input
                type="text"
                className="edit-input"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill and press Enter"
                disabled={requiredSkills.length >= 30}
              />
              <button
                type="button"
                className="edit-skills-add-btn"
                onClick={addSkill}
                disabled={!skillInput.trim() || requiredSkills.length >= 30}
              >
                Add
              </button>
            </div>
            {requiredSkills.length > 0 && (
              <div className="edit-skills-chips">
                {requiredSkills.map((s, i) => (
                  <span key={i} className="edit-skill-chip">
                    <span>{s}</span>
                    <button
                      type="button"
                      className="edit-skill-remove"
                      onClick={() => removeSkill(i)}
                    >×</button>
                  </span>
                ))}
              </div>
            )}
            <span className="edit-char-count">{requiredSkills.length}/30 skills</span>
          </div>

          {/* Description */}
          <div className="edit-field">
            <label className="edit-label">Description</label>
            <textarea
              className="edit-textarea"
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              placeholder="Describe the work, deliverables, and expectations..."
            />
            {descErr && <p className="edit-field-error">{descErr}</p>}
            {descMaxErr && <p className="edit-field-error">{descMaxErr}</p>}
            <span className="edit-char-count">{description.length}/5000</span>
          </div>

          {/* Scope */}
          <div className="edit-field">
            <label className="edit-label">Project Size</label>
            <div className="edit-option-row">
              {PROJECT_SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`edit-option-btn ${projectSize === opt.value ? 'selected' : ''}`}
                  onClick={() => setProjectSize(opt.value)}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="edit-field">
            <label className="edit-label">Duration</label>
            <div className="edit-option-row">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`edit-option-btn ${duration === opt.value ? 'selected' : ''}`}
                  onClick={() => setDuration(opt.value)}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="edit-field">
            <label className="edit-label">Experience Level</label>
            <div className="edit-option-row">
              {EXPERIENCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`edit-option-btn ${experienceLevel === opt.value ? 'selected' : ''}`}
                  onClick={() => setExperienceLevel(opt.value)}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="edit-field">
            <label className="edit-label">Contract-to-Hire</label>
            <div className="edit-option-row">
              {CONTRACT_HIRE_OPTIONS.map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`edit-option-btn ${contractToHire === opt.value ? 'selected' : ''}`}
                  onClick={() => setContractToHire(opt.value)}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="edit-field">
            <label className="edit-label">Payment Type</label>
            <div className="edit-option-row">
              <button
                type="button"
                className={`edit-option-btn ${paymentType === 'hourly' ? 'selected' : ''}`}
                onClick={() => setPaymentType('hourly')}
              >Hourly</button>
              <button
                type="button"
                className={`edit-option-btn ${paymentType === 'fixed' ? 'selected' : ''}`}
                onClick={() => setPaymentType('fixed')}
              >Fixed Price</button>
            </div>
          </div>

          {paymentType === 'hourly' && (
            <div className="edit-field">
              <label className="edit-label">Hourly Rate Range</label>
              <div className="edit-budget-row">
                <div className="edit-budget-field">
                  <span className="edit-budget-prefix">$</span>
                  <input
                    type="number"
                    className="edit-input edit-budget-input"
                    value={hourlyMin}
                    onChange={(e) => setHourlyMin(e.target.value)}
                    placeholder="Min"
                    min="0"
                    step="any"
                  />
                </div>
                <span className="edit-budget-divider">–</span>
                <div className="edit-budget-field">
                  <span className="edit-budget-prefix">$</span>
                  <input
                    type="number"
                    className="edit-input edit-budget-input"
                    value={hourlyMax}
                    onChange={(e) => setHourlyMax(e.target.value)}
                    placeholder="Max"
                    min="0"
                    step="any"
                  />
                </div>
                <span className="edit-budget-suffix">/hr</span>
              </div>
              {hourlyMin !== '' && hourlyMax !== '' && hourlyMinNum > hourlyMaxNum && (
                <p className="edit-field-error">Min rate cannot exceed max rate.</p>
              )}
            </div>
          )}

          {paymentType === 'fixed' && (
            <div className="edit-field">
              <label className="edit-label">Fixed Budget</label>
              <div className="edit-budget-field edit-budget-field-wide">
                <span className="edit-budget-prefix">$</span>
                <input
                  type="number"
                  className="edit-input edit-budget-input"
                  value={fixedBudget}
                  onChange={(e) => setFixedBudget(e.target.value)}
                  placeholder="e.g. 2500"
                  min="0"
                  step="any"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="edit-actions">
            <button
              type="button"
              className="edit-cancel-btn"
              onClick={() => navigate('/client/jobs')}
            >
              Cancel
            </button>
            <button
              type="button"
              className="edit-save-btn"
              onClick={handleSave}
              disabled={!formValid || saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditJobPage
