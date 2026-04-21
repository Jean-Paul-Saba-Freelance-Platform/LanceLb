import Application from '../models/applicationModel.js'
import Project from '../models/projectModel.js'
import User from '../models/userModels.js'
import Job from '../models/jobModel.js'

export const getFreelancerStats = async (req, res) => {
  try {
    const freelancerId = req.userId

    // --- Range filter for proposals (default: all time) ---
    const range = req.query.range // '7days' | '30days' | '90days' | undefined
    let createdAtFilter = {}
    if (range) {
      const days = range === '7days' ? 7 : range === '30days' ? 30 : 90
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      createdAtFilter = { createdAt: { $gte: cutoff } }
    }

    // --- Proposals breakdown ---
    const apps = await Application.find({ freelancerId, ...createdAtFilter })
      .select('status aiScore atsScore clientId')
    const total = apps.length
    const byStatus = { pending: 0, shortlisted: 0, accepted: 0, rejected: 0, withdrawn: 0 }
    let aiScoreSum = 0, aiScoreCount = 0, atsScoreSum = 0, atsScoreCount = 0
    const uniqueClientIds = new Set()

    for (const a of apps) {
      if (byStatus[a.status] !== undefined) byStatus[a.status]++
      if (a.aiScore != null) { aiScoreSum += a.aiScore; aiScoreCount++ }
      if (a.atsScore != null) { atsScoreSum += a.atsScore; atsScoreCount++ }
      if (a.clientId) uniqueClientIds.add(a.clientId.toString())
    }

    const successRate = total ? Math.round((byStatus.accepted / total) * 100) : 0
    const shortlistRate = total ? Math.round(((byStatus.shortlisted + byStatus.accepted) / total) * 100) : 0
    const avgAiScore = aiScoreCount ? Math.round(aiScoreSum / aiScoreCount) : null
    const avgAtsScore = atsScoreCount ? Math.round(atsScoreSum / atsScoreCount) : null

    // --- Active / Completed contracts ---
    const activeProjects = await Project.find({
      'jobs.freelancerIds': freelancerId,
      status: 'active'
    }).select('title status launchDate tasks').lean()

    const completedProjects = await Project.find({
      'jobs.freelancerIds': freelancerId,
      status: 'completed'
    }).countDocuments()

    const activeContractsList = activeProjects.map(p => {
      const t = p.tasks?.length ?? 0
      const done = p.tasks?.filter(tk => tk.validatedByClient).length ?? 0
      return { _id: p._id, title: p.title, launchDate: p.launchDate, tasksTotal: t, tasksDone: done }
    })

    // --- Profile views ---
    const user = await User.findById(freelancerId).select('profileViews').lean()
    const profileViews = user?.profileViews ?? 0

    // --- Achievements ---
    const achievements = []
    if (completedProjects >= 1) {
      achievements.push({ id: 'starter', label: 'Starter', description: 'Completed your first project' })
    }
    if (byStatus.accepted >= 5) {
      achievements.push({ id: 'hired5', label: 'In Demand', description: 'Accepted on 5+ proposals' })
    }

    return res.json({
      success: true,
      proposals: { total, ...byStatus },
      successRate,
      shortlistRate,
      avgAiScore,
      avgAtsScore,
      activeContracts: activeProjects.length,
      completedContracts: completedProjects,
      activeContractsList,
      uniqueClients: uniqueClientIds.size,
      profileViews,
      achievements,
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
