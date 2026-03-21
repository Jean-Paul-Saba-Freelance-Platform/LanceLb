import User from '../models/userModels.js'
import Job from '../models/jobModel.js'
import Application from '../models/applicationModel.js'
import Project from '../models/projectModel.js'

// Returns platform-wide KPI counts in a single parallel query
export const getStats = async (req, res) => {
  try {
    const [
      totalFreelancers,
      totalClients,
      activeJobs,
      totalJobs,
      totalApplications,
      totalProjects,
      hiredApplications,
    ] = await Promise.all([
      User.countDocuments({ userType: 'freelancer' }),
      User.countDocuments({ userType: 'client' }),
      Job.countDocuments({ status: 'open' }),
      Job.countDocuments(),
      Application.countDocuments(),
      Project.countDocuments(),
      Application.countDocuments({ status: 'accepted' }),
    ])

    return res.json({
      success: true,
      stats: {
        totalFreelancers,
        totalClients,
        activeJobs,
        totalJobs,
        totalApplications,
        totalProjects,
        hiredApplications,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// Aggregates new user registrations grouped by month for the last 6 months
export const getUserGrowth = async (req, res) => {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const growth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ])

    return res.json({ success: true, growth })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// Aggregates the top 8 most requested skills across all job postings
export const getJobCategories = async (req, res) => {
  try {
    const categories = await Job.aggregate([
      { $unwind: '$requiredSkills' },
      { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { skill: '$_id', count: 1, _id: 0 } },
    ])

    return res.json({ success: true, categories })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// Returns the top 5 freelancers ranked by number of accepted applications
export const getTopFreelancers = async (req, res) => {
  try {
    const topFreelancers = await Application.aggregate([
      { $match: { status: 'accepted' } },
      { $group: { _id: '$freelancerId', hiredCount: { $sum: 1 } } },
      { $sort: { hiredCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'freelancerInfo',
        },
      },
      { $unwind: '$freelancerInfo' },
      {
        $project: {
          _id: 0,
          name: '$freelancerInfo.name',
          email: '$freelancerInfo.email',
          title: '$freelancerInfo.title',
          hiredCount: 1,
        },
      },
    ])

    return res.json({ success: true, topFreelancers })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
