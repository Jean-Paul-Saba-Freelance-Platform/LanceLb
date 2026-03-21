import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopNav from '../src/components/TopNav.jsx'
import './ProjectDetailPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

// ─── GitHub-like task calendar ────────────────────────────────────────────────
// Renders a 3-month rolling window of week columns × 7 day rows.
// Each cell is coloured by the tasks due on that day.

const TaskCalendar = ({ tasks, userType }) => {
  const [tooltip, setTooltip] = useState(null) // { date, tasks, x, y }

  // Build a map of dateKey -> tasks[]
  const tasksByDate = {}
  tasks.forEach(task => {
    if (!task.dueDate) return
    const key = new Date(task.dueDate).toISOString().slice(0, 10)
    if (!tasksByDate[key]) tasksByDate[key] = []
    tasksByDate[key].push(task)
  })

  // Generate 13 weeks × 7 days ending today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find start: go back to the nearest Sunday 13 weeks ago
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - today.getDay() - 12 * 7)

  const weeks = []
  const cursor = new Date(startDate)
  for (let w = 0; w < 14; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const cellColor = (dayTasks) => {
    if (!dayTasks || !dayTasks.length) return 'var(--cal-empty)'
    const allDone = dayTasks.every(t => t.validatedByClient)
    const anyOverdue = dayTasks.some(t => !t.validatedByClient && new Date(t.dueDate) < new Date())
    const anyPending = dayTasks.some(t => t.completedByFreelancer && !t.validatedByClient)
    if (allDone) return '#10b981'
    if (anyOverdue) return '#f87171'
    if (anyPending) return '#fbbf24'
    return '#38bdf8'
  }

  const formatDateLong = (d) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="task-calendar">
      <div className="task-cal-header">Task Calendar</div>
      <div className="task-cal-body">
        {/* Day labels column */}
        <div className="task-cal-day-labels">
          {dayLabels.map(d => (
            <span key={d} className="task-cal-day-label">{d}</span>
          ))}
        </div>

        {/* Week columns */}
        <div className="task-cal-grid">
          {weeks.map((week, wi) => (
            <div key={wi} className="task-cal-week">
              {week.map((day, di) => {
                const key = day.toISOString().slice(0, 10)
                const dayTasks = tasksByDate[key]
                const isToday = day.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)
                const isFuture = day > today

                return (
                  <div
                    key={di}
                    className={`task-cal-cell ${isToday ? 'cal-today' : ''} ${isFuture ? 'cal-future' : ''}`}
                    style={{ background: isFuture && !dayTasks ? 'var(--cal-future)' : cellColor(dayTasks) }}
                    onMouseEnter={e => {
                      if (dayTasks?.length) {
                        setTooltip({ date: key, tasks: dayTasks, x: e.clientX, y: e.clientY })
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    title={dayTasks ? `${dayTasks.length} task(s) due` : ''}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="task-cal-legend">
        <span className="cal-legend-item"><span style={{ background: '#38bdf8' }} />Upcoming</span>
        <span className="cal-legend-item"><span style={{ background: '#fbbf24' }} />Awaiting review</span>
        <span className="cal-legend-item"><span style={{ background: '#10b981' }} />Completed</span>
        <span className="cal-legend-item"><span style={{ background: '#f87171' }} />Overdue</span>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="cal-tooltip"
          style={{ top: tooltip.y + 12, left: tooltip.x + 8 }}
        >
          <strong>{formatDateLong(new Date(tooltip.date))}</strong>
          {tooltip.tasks.map((t, i) => (
            <div key={i} className="cal-tooltip-task">
              <span
                className="cal-tooltip-dot"
                style={{ background: t.validatedByClient ? '#10b981' : t.completedByFreelancer ? '#fbbf24' : '#38bdf8' }}
              />
              {t.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const ProjectDetailPage = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userType, setUserType] = useState('client')
  const [userId, setUserId] = useState('')

  // Edit launch date
  const [editingLaunch, setEditingLaunch] = useState(false)
  const [launchDateInput, setLaunchDateInput] = useState('')
  const [savingLaunch, setSavingLaunch] = useState(false)

  // Add task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  // Edit task
  const [editTaskId, setEditTaskId] = useState(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDesc, setEditTaskDesc] = useState('')
  const [editTaskDue, setEditTaskDue] = useState('')
  const [editTaskAssignee, setEditTaskAssignee] = useState('')
  const [savingTask, setSavingTask] = useState(false)

  // Start project
  const [starting, setStarting] = useState(false)
  const [startLaunchDate, setStartLaunchDate] = useState('')

  const authHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      setUserType(user.userType || 'client')
      setUserId(user._id || user.id || '')
    } catch {}
  }, [])

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
        credentials: 'include',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setProject(data.project)
        setLaunchDateInput(
          data.project.launchDate
            ? new Date(data.project.launchDate).toISOString().slice(0, 10)
            : ''
        )
      } else {
        setError(data.message || 'Failed to load project.')
      }
    } catch (err) {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchProject() }, [fetchProject])

  // Get all unique accepted freelancers across job slots
  const allFreelancers = project
    ? [...new Map(
        project.jobs.flatMap(j => j.freelancerIds || [])
          .filter(Boolean)
          .map(f => [f._id || f, f])
      ).values()]
    : []

  const saveLaunchDate = async () => {
    setSavingLaunch(true)
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({ launchDate: launchDateInput || null }),
      })
      const data = await res.json()
      if (data.success) {
        setProject(data.project)
        setEditingLaunch(false)
      }
    } catch {}
    setSavingLaunch(false)
  }

  const handleStartProject = async () => {
    setStarting(true)
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({ launchDate: startLaunchDate || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setProject(data.project)
      }
    } catch {}
    setStarting(false)
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    setAddingTask(true)
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          dueDate: taskDue || null,
          assignedTo: taskAssignee || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchProject()
        setTaskTitle(''); setTaskDesc(''); setTaskDue(''); setTaskAssignee('')
        setShowTaskForm(false)
      }
    } catch {}
    setAddingTask(false)
  }

  const openEditTask = (task) => {
    setEditTaskId(task._id)
    setEditTaskTitle(task.title)
    setEditTaskDesc(task.description || '')
    setEditTaskDue(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '')
    setEditTaskAssignee(task.assignedTo?._id || task.assignedTo || '')
  }

  const handleSaveTask = async () => {
    setSavingTask(true)
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks/${editTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          title: editTaskTitle.trim(),
          description: editTaskDesc.trim(),
          dueDate: editTaskDue || null,
          assignedTo: editTaskAssignee || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchProject()
        setEditTaskId(null)
      }
    } catch {}
    setSavingTask(false)
  }

  const handleCompleteTask = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: authHeaders(),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) await fetchProject()
    } catch {}
  }

  const handleValidateTask = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks/${taskId}/validate`, {
        method: 'PATCH',
        headers: authHeaders(),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) await fetchProject()
    } catch {}
  }

  const taskStatus = (task) => {
    if (task.validatedByClient) return 'completed'
    if (task.completedByFreelancer) return 'awaiting'
    if (task.dueDate && new Date(task.dueDate) < new Date()) return 'overdue'
    return 'pending'
  }

  const taskStatusLabel = { completed: 'Completed', awaiting: 'Awaiting Review', overdue: 'Overdue', pending: 'Pending' }
  const taskStatusColor = { completed: '#10b981', awaiting: '#fbbf24', overdue: '#f87171', pending: '#38bdf8' }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  const getUserName = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').name?.split(' ')[0] || 'User' } catch { return 'User' }
  }

  if (loading) return (
    <div className="pd-page"><TopNav userName={getUserName()} /><div className="pd-container"><p className="pd-loading">Loading project...</p></div></div>
  )

  if (error || !project) return (
    <div className="pd-page"><TopNav userName={getUserName()} /><div className="pd-container"><p className="pd-error">{error || 'Project not found.'}</p></div></div>
  )

  const isClient = userType === 'client'
  const totalTasks = project.tasks?.length || 0
  const doneTasks = project.tasks?.filter(t => t.validatedByClient).length || 0

  return (
    <div className="pd-page">
      <TopNav userName={getUserName()} />
      <div className="pd-container">
        <button className="pd-back" onClick={() => navigate(isClient ? '/client/projects' : '/freelancer/projects')}>
          ← Back to Projects
        </button>

        {/* Project header */}
        <div className="pd-header">
          <div className="pd-header-left">
            <h1 className="pd-title">{project.title}</h1>
            {project.description && <p className="pd-desc">{project.description}</p>}
          </div>
          <span className={`pd-status-badge pd-status-${project.status}`}>
            {project.status === 'planning' ? 'Planning' : project.status === 'active' ? 'Active' : 'Completed'}
          </span>
        </div>

        {/* Launch date + start */}
        <div className="pd-meta-bar">
          <div className="pd-meta-item">
            <span className="pd-meta-label">Launch Date</span>
            {isClient && editingLaunch ? (
              <div className="pd-launch-edit">
                <input
                  type="date"
                  className="pd-date-input"
                  value={launchDateInput}
                  onChange={e => setLaunchDateInput(e.target.value)}
                />
                <button className="pd-save-btn" onClick={saveLaunchDate} disabled={savingLaunch}>
                  {savingLaunch ? '...' : 'Save'}
                </button>
                <button className="pd-cancel-btn" onClick={() => setEditingLaunch(false)}>Cancel</button>
              </div>
            ) : (
              <div className="pd-launch-display">
                <span className="pd-meta-value">{formatDate(project.launchDate)}</span>
                {isClient && (
                  <button className="pd-edit-link" onClick={() => setEditingLaunch(true)}>Edit</button>
                )}
              </div>
            )}
          </div>

          <div className="pd-meta-item">
            <span className="pd-meta-label">Progress</span>
            <span className="pd-meta-value">{doneTasks}/{totalTasks} tasks</span>
          </div>

          {project.crewId && (
            <div className="pd-meta-item">
              <span className="pd-meta-label">Channel</span>
              <span
                className="pd-channel-link"
                onClick={() => navigate(isClient ? '/client/messages' : '/freelancer/messages')}
              >
                # {project.crewId.name || project.title}
              </span>
            </div>
          )}
        </div>

        {/* Start project (client only, planning status) */}
        {isClient && project.status === 'planning' && (
          <div className="pd-start-section">
            <p className="pd-start-hint">
              Starting the project will create a messaging channel for all team members and notify freelancers.
            </p>
            <div className="pd-start-row">
              <input
                type="date"
                className="pd-date-input"
                value={startLaunchDate}
                onChange={e => setStartLaunchDate(e.target.value)}
                placeholder="Launch date (optional)"
              />
              <button className="pd-start-btn" onClick={handleStartProject} disabled={starting}>
                {starting ? 'Starting...' : '▶ Start Project'}
              </button>
            </div>
          </div>
        )}

        {/* Job roles */}
        <div className="pd-section">
          <h2 className="pd-section-title">Team Roles</h2>
          <div className="pd-roles-list">
            {project.jobs.map((job, i) => (
              <div key={i} className="pd-role-card">
                <span className="pd-role-title">{job.title}</span>
                <div className="pd-role-members">
                  {(job.freelancerIds || []).map((f, fi) => (
                    <span key={fi} className="pd-member-chip">
                      {f.name || 'Freelancer'}
                    </span>
                  ))}
                  {(!job.freelancerIds || job.freelancerIds.length === 0) && (
                    <span className="pd-member-chip pd-chip-empty">No accepted freelancers</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GitHub-like calendar */}
        <div className="pd-section">
          <TaskCalendar tasks={project.tasks || []} userType={userType} />
        </div>

        {/* Task list */}
        <div className="pd-section">
          <div className="pd-tasks-header">
            <h2 className="pd-section-title">Tasks</h2>
            {isClient && (
              <button className="pd-add-task-btn" onClick={() => setShowTaskForm(f => !f)}>
                {showTaskForm ? '✕ Cancel' : '+ Add Task'}
              </button>
            )}
          </div>

          {/* Add task form */}
          {isClient && showTaskForm && (
            <form className="pd-task-form" onSubmit={handleAddTask}>
              <input
                className="pd-task-input"
                placeholder="Task title *"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                required
              />
              <input
                className="pd-task-input"
                placeholder="Description (optional)"
                value={taskDesc}
                onChange={e => setTaskDesc(e.target.value)}
              />
              <div className="pd-task-form-row">
                <div className="pd-field-group">
                  <label className="pd-field-label">Due Date</label>
                  <input
                    type="date"
                    className="pd-date-input"
                    value={taskDue}
                    onChange={e => setTaskDue(e.target.value)}
                  />
                </div>
                <div className="pd-field-group">
                  <label className="pd-field-label">Assign To</label>
                  <select
                    className="pd-date-input"
                    value={taskAssignee}
                    onChange={e => setTaskAssignee(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {allFreelancers.map(f => (
                      <option key={f._id || f} value={f._id || f}>{f.name || 'Freelancer'}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="pd-task-submit" type="submit" disabled={addingTask}>
                {addingTask ? 'Adding...' : 'Add Task'}
              </button>
            </form>
          )}

          {project.tasks?.length === 0 ? (
            <p className="pd-tasks-empty">No tasks yet.{isClient ? ' Add one above.' : ''}</p>
          ) : (
            <div className="pd-tasks-list">
              {project.tasks.map(task => {
                const st = taskStatus(task)
                const isEditing = editTaskId === task._id
                const assignedName = task.assignedTo?.name || null

                return (
                  <div key={task._id} className={`pd-task-card pd-task-${st}`}>
                    {isEditing ? (
                      <div className="pd-task-edit-form">
                        <input
                          className="pd-task-input"
                          value={editTaskTitle}
                          onChange={e => setEditTaskTitle(e.target.value)}
                        />
                        <input
                          className="pd-task-input"
                          value={editTaskDesc}
                          onChange={e => setEditTaskDesc(e.target.value)}
                          placeholder="Description"
                        />
                        <div className="pd-task-form-row">
                          <div className="pd-field-group">
                            <label className="pd-field-label">Due Date</label>
                            <input
                              type="date"
                              className="pd-date-input"
                              value={editTaskDue}
                              onChange={e => setEditTaskDue(e.target.value)}
                            />
                          </div>
                          <div className="pd-field-group">
                            <label className="pd-field-label">Assign To</label>
                            <select
                              className="pd-date-input"
                              value={editTaskAssignee}
                              onChange={e => setEditTaskAssignee(e.target.value)}
                            >
                              <option value="">Unassigned</option>
                              {allFreelancers.map(f => (
                                <option key={f._id || f} value={f._id || f}>{f.name || 'Freelancer'}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="pd-edit-actions">
                          <button className="pd-cancel-btn" onClick={() => setEditTaskId(null)}>Cancel</button>
                          <button className="pd-save-btn" onClick={handleSaveTask} disabled={savingTask}>
                            {savingTask ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="pd-task-top">
                          <div className="pd-task-left">
                            {/* Freelancer checkbox */}
                            {!isClient && st === 'pending' && (
                              <button
                                className="pd-check-btn"
                                title="Mark as done"
                                onClick={() => handleCompleteTask(task._id)}
                              >☐</button>
                            )}
                            {!isClient && st === 'awaiting' && (
                              <span className="pd-check-done" title="Awaiting client review">☑</span>
                            )}
                            {st === 'completed' && (
                              <span className="pd-check-validated" title="Validated">✓</span>
                            )}
                            <div className="pd-task-info">
                              <span className={`pd-task-title ${st === 'completed' ? 'pd-task-title-done' : ''}`}>
                                {task.title}
                              </span>
                              {task.description && (
                                <span className="pd-task-desc">{task.description}</span>
                              )}
                            </div>
                          </div>
                          <div className="pd-task-right">
                            <span
                              className="pd-task-status-pill"
                              style={{ color: taskStatusColor[st], borderColor: taskStatusColor[st] }}
                            >
                              {taskStatusLabel[st]}
                            </span>
                            {assignedName && (
                              <span className="pd-task-assignee">{assignedName}</span>
                            )}
                            {task.dueDate && (
                              <span className="pd-task-due">{formatDate(task.dueDate)}</span>
                            )}
                            {isClient && (
                              <button className="pd-task-edit-btn" onClick={() => openEditTask(task)}>Edit</button>
                            )}
                          </div>
                        </div>

                        {/* Client validate button */}
                        {isClient && st === 'awaiting' && (
                          <div className="pd-validate-row">
                            <span className="pd-validate-hint">Freelancer marked this as done.</span>
                            <button className="pd-validate-btn" onClick={() => handleValidateTask(task._id)}>
                              ✓ Validate
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetailPage
