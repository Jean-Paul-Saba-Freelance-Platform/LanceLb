import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../src/components/TopNav'
import { CheckCircle, Clock, AlertTriangle, CheckSquare, ChevronRight } from 'lucide-react'
import './FreelancerDeliverWorkPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const getTaskStatus = (task) => {
  if (task.validatedByClient) return 'completed'
  if (task.completedByFreelancer) return 'awaiting review'
  if (task.dueDate && new Date(task.dueDate) < new Date()) return 'overdue'
  return 'pending'
}

const getLoggedInUserId = () => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const u = JSON.parse(userStr)
      return u._id || u.id || u.userId || null
    }
  } catch {
    return null
  }
  return null
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const FreelancerDeliverWorkPage = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [completingTask, setCompletingTask] = useState(null)
  const [error, setError] = useState(null)

  const userId = getLoggedInUserId()

  const userName = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      return u.name?.split(' ')[0] || u.firstName || 'Freelancer'
    } catch {
      return 'Freelancer'
    }
  })()

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to fetch projects')
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.projects || data.data || [])

        // Filter active projects where current user is a team member (appears in any job's freelancerIds)
        const active = list.filter((proj) => {
          if (proj.status !== 'active') return false
          if (!userId) return false
          const jobs = proj.jobs || []
          return jobs.some((job) => {
            const ids = job.freelancerIds || []
            return ids.some((id) => {
              const strId = typeof id === 'object' ? (id._id || id.id || String(id)) : String(id)
              return strId === String(userId)
            })
          })
        })

        setProjects(active)
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Could not load projects. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleMarkDone = async (projectId, taskId) => {
    const key = `${projectId}-${taskId}`
    setCompletingTask(key)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to mark task done')
      await res.json()

      // Update local state optimistically
      setProjects((prev) =>
        prev.map((proj) => {
          if (String(proj._id || proj.id) !== String(projectId)) return proj
          const updatedJobs = (proj.jobs || []).map((job) => ({
            ...job,
            tasks: (job.tasks || []).map((task) => {
              if (String(task._id || task.id) !== String(taskId)) return task
              return { ...task, completedByFreelancer: true }
            }),
          }))
          return { ...proj, jobs: updatedJobs }
        })
      )
    } catch (err) {
      console.error('Error completing task:', err)
    } finally {
      setCompletingTask(null)
    }
  }

  // Flatten all tasks from a project (across all jobs)
  const getProjectTasks = (proj) => {
    return (proj.jobs || []).flatMap((job) => (job.tasks || []))
  }

  const getProgressCounts = (tasks) => {
    const total = tasks.length
    const done = tasks.filter((t) => t.validatedByClient).length
    return { done, total }
  }

  const isMyTask = (task) => {
    if (!userId) return false
    const assignees = task.assignedTo || task.assignees || task.freelancerIds || []
    return assignees.some((a) => {
      const strA = typeof a === 'object' ? (a._id || a.id || String(a)) : String(a)
      return strA === String(userId)
    })
  }

  const canMarkDone = (task) => {
    const status = getTaskStatus(task)
    return (status === 'pending' || status === 'overdue') && isMyTask(task)
  }

  return (
    <div className="deliver-page">
      <TopNav userName={userName} />

      <div className="deliver-container">
        <div className="deliver-header">
          <h1 className="deliver-title">Active Contracts</h1>
          <p className="deliver-subtitle">Manage your ongoing projects and mark tasks complete.</p>
        </div>

        {loading && (
          <div className="deliver-skeleton-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="deliver-skeleton-card">
                <div className="deliver-skeleton-line deliver-skeleton-title" />
                <div className="deliver-skeleton-line deliver-skeleton-bar" />
                <div className="deliver-skeleton-line deliver-skeleton-short" />
                <div className="deliver-skeleton-line deliver-skeleton-short" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="deliver-error-banner">{error}</div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="deliver-empty-state">
            <CheckSquare size={56} className="deliver-empty-icon" />
            <h2 className="deliver-empty-title">No active contracts</h2>
            <p className="deliver-empty-text">
              You have no active projects assigned to you right now. Check back once a client activates a project.
            </p>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="deliver-cards-list">
            {projects.map((proj) => {
              const projId = proj._id || proj.id
              const tasks = getProjectTasks(proj)
              const { done, total } = getProgressCounts(tasks)
              const progressPct = total > 0 ? Math.round((done / total) * 100) : 0

              return (
                <div key={projId} className="deliver-card">
                  <div className="deliver-card-top">
                    <div className="deliver-card-title-row">
                      <h2 className="deliver-card-title">{proj.title || proj.name || 'Untitled Project'}</h2>
                      <span className="deliver-status-badge deliver-status-active">Active</span>
                    </div>
                    <Link
                      to={`/freelancer/projects/${projId}`}
                      className="deliver-view-link"
                    >
                      View project <ChevronRight size={16} />
                    </Link>
                  </div>

                  {total > 0 && (
                    <div className="deliver-progress-section">
                      <div className="deliver-progress-label">
                        <span>Task Progress</span>
                        <span className="deliver-progress-count">{done}/{total} completed</span>
                      </div>
                      <div className="deliver-progress-track">
                        <div
                          className="deliver-progress-fill"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {tasks.length === 0 ? (
                    <p className="deliver-no-tasks">No tasks assigned to this project yet.</p>
                  ) : (
                    <div className="deliver-tasks-list">
                      {tasks.map((task) => {
                        const taskId = task._id || task.id
                        const status = getTaskStatus(task)
                        const key = `${projId}-${taskId}`
                        const marking = completingTask === key

                        return (
                          <div key={taskId} className={`deliver-task-row deliver-task-${status.replace(' ', '-')}`}>
                            <div className="deliver-task-left">
                              <span className={`deliver-task-status-icon deliver-icon-${status.replace(' ', '-')}`}>
                                {status === 'completed' && <CheckCircle size={16} />}
                                {status === 'awaiting review' && <Clock size={16} />}
                                {status === 'overdue' && <AlertTriangle size={16} />}
                                {status === 'pending' && <Clock size={16} />}
                              </span>
                              <div className="deliver-task-info">
                                <span className="deliver-task-title">{task.title || task.name || 'Untitled Task'}</span>
                                {task.dueDate && (
                                  <span className="deliver-task-due">Due: {formatDate(task.dueDate)}</span>
                                )}
                              </div>
                            </div>
                            <div className="deliver-task-right">
                              <span className={`deliver-task-badge deliver-badge-${status.replace(' ', '-')}`}>
                                {status}
                              </span>
                              {canMarkDone(task) && (
                                <button
                                  className="deliver-mark-done-btn"
                                  onClick={() => handleMarkDone(projId, taskId)}
                                  disabled={marking}
                                  aria-label="Mark task as done"
                                >
                                  {marking ? 'Saving...' : 'Mark done'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default FreelancerDeliverWorkPage
