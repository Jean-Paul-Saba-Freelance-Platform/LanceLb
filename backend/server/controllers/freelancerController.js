import Application from '../models/applicationModel.js'
import Project from '../models/projectModel.js'
import User from '../models/userModels.js'
import Job from '../models/jobModel.js'

export const getFreelancerStats = async (req, res) => {
  try {
    const freelancerId = req.userId

    // --- Proposals breakdown ---
    const apps = await Application.find({ freelancerId }).select('status aiScore atsScore')
    const total = apps.length
    const byStatus = { pending: 0, shortlisted: 0, accepted: 0, rejected: 0, withdrawn: 0 }
    let aiScoreSum = 0, aiScoreCount = 0, atsScoreSum = 0, atsScoreCount = 0
    for (const a of apps) {
      if (byStatus[a.status] !== undefined) byStatus[a.status]++
      if (a.aiScore != null) { aiScoreSum += a.aiScore; aiScoreCount++ }
      if (a.atsScore != null) { atsScoreSum += a.atsScore; atsScoreCount++ }
    }
    const successRate = total ? Math.round((byStatus.accepted / total) * 100) : 0
    const shortlistRate = total ? Math.round(((byStatus.shortlisted + byStatus.accepted) / total) * 100) : 0
    const avgAiScore = aiScoreCount ? Math.round(aiScoreSum / aiScoreCount) : null
    const avgAtsScore = atsScoreCount ? Math.round(atsScoreSum / atsScoreCount) : null

    // --- Active / Completed contracts (projects where this freelancer is a member) ---
    const activeProjects = await Project.find({
      'jobs.freelancerIds': freelancerId,
      status: 'active'
    }).select('title status launchDate tasks').lean()

    const completedProjects = await Project.find({
      'jobs.freelancerIds': freelancerId,
      status: 'completed'
    }).countDocuments()

    // Compute task stats per active project
    const activeContractsList = activeProjects.map(p => {
      const total = p.tasks.length
      const done = p.tasks.filter(t => t.validatedByClient).length
      return { _id: p._id, title: p.title, launchDate: p.launchDate, tasksTotal: total, tasksDone: done }
    })

    return res.json({
      success: true,
      proposals: { total, ...byStatus },
      successRate,
      shortlistRate,
      avgAiScore,
      avgAtsScore,
      activeContracts: activeProjects.length,
      completedContracts: completedProjects,
      activeContractsList
    })
  } catch (err) {
    console.error('getFreelancerStats error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/freelancer/saved-jobs/:jobId — toggle save/unsave
export const toggleSaveJob = async (req, res) => {
  try {
    const { jobId } = req.params
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const alreadySaved = user.savedJobs.some(id => id.toString() === jobId)
    if (alreadySaved) {
      user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId)
    } else {
      user.savedJobs.push(jobId)
    }
    await user.save()
    return res.json({ success: true, saved: !alreadySaved })
  } catch (err) {
    console.error('toggleSaveJob error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/freelancer/saved-jobs — return saved jobs with full job data
export const getSavedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: 'savedJobs',
      match: { status: { $ne: 'deleted' } },
    })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    return res.json({ success: true, jobs: user.savedJobs })
  } catch (err) {
    console.error('getSavedJobs error:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}
