import User from '../models/userModels.js'
import Job from '../models/jobModel.js'
import Application from '../models/applicationModel.js'
import Project from '../models/projectModel.js'

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.userId
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const [activeJobsCount, contractsCount] = await Promise.all([
      Job.countDocuments({ clientId: userId, status: { $in: ['open', 'in_progress'] } }),
      Project.countDocuments({ clientId: userId, status: 'active' })
    ])

    return res.json({
      success: true,
      activeJobsCount,
      contractsCount,
      emailVerified: user.isAccountVerified || false,
      phoneVerified: false,
      billingMethodAdded: false
    })
  } catch (error) {
    console.error('getDashboardSummary error:', error)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const getClientStats = async (req, res) => {
  try {
    const clientId = req.userId

    const [jobs, projects] = await Promise.all([
      Job.find({ clientId }).select('status').lean(),
      Project.find({ clientId }).select('status').lean()
    ])

    const jobsPosted = jobs.length
    const openJobs = jobs.filter(j => j.status === 'open').length
    const inProgressJobs = jobs.filter(j => j.status === 'in_progress').length
    const closedJobs = jobs.filter(j => j.status === 'closed').length
    const activeProjects = projects.filter(p => p.status === 'active').length
    const completedProjects = projects.filter(p => p.status === 'completed').length

    const jobIds = jobs.map(j => j._id)
    const [totalApplications, freelancersHired, applicationsReviewed] = await Promise.all([
      Application.countDocuments({ jobId: { $in: jobIds } }),
      Application.countDocuments({ jobId: { $in: jobIds }, status: 'accepted' }),
      Application.countDocuments({ jobId: { $in: jobIds }, viewedByClient: true })
    ])

    const avgApplicationsPerJob = jobsPosted ? Math.round(totalApplications / jobsPosted) : 0

    return res.json({
      success: true,
      jobsPosted,
      openJobs,
      inProgressJobs,
      closedJobs,
      totalApplications,
      applicationsReviewed,
      freelancersHired,
      activeProjects,
      completedProjects,
      avgApplicationsPerJob
    })
  } catch (err) {
    console.error('getClientStats error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}
