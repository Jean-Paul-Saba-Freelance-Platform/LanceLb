import jwt from 'jsonwebtoken'
import User from '../models/userModels.js'
import Job from '../models/jobModel.js'
import Application from '../models/applicationModel.js'
import Project from '../models/projectModel.js'

// Authenticates admin credentials and returns a signed JWT with isAdmin: true
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body

    console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME, '| ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD)

    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' })
    }

    const token = jwt.sign({ isAdmin: true }, process.env.ADMIN_JWT_SECRET, { expiresIn: '7d' })

    return res.json({ success: true, token })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

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
      pendingApplications,
      totalVerifiedUsers,
      activeProjects,
    ] = await Promise.all([
      User.countDocuments({ userType: 'freelancer' }),
      User.countDocuments({ userType: 'client' }),
      Job.countDocuments({ status: 'open' }),
      Job.countDocuments(),
      Application.countDocuments(),
      Project.countDocuments(),
      Application.countDocuments({ status: 'accepted' }),
      Application.countDocuments({ status: 'pending' }),
      User.countDocuments({ isAccountVerified: true }),
      Project.countDocuments({ status: 'active' }),
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
        pendingApplications,
        totalVerifiedUsers,
        activeProjects,
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

// Returns all users with optional search and role filters, sorted by createdAt descending
export const getAllUsers = async (req, res) => {
  try {
    const { search, role } = req.query
    const filter = {}

    if (search) {
      const regex = new RegExp(search, 'i')
      filter.$or = [{ name: regex }, { email: regex }]
    }

    if (role === 'client' || role === 'freelancer') {
      filter.userType = role
    }

    const users = await User.find(filter)
      .select('_id name email userType status banReason timeoutUntil createdAt profilePicture')
      .sort({ createdAt: -1 })
      .lean()

    return res.json({ success: true, users })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// Sets the target user's status to banned with an optional reason
export const banUser = async (req, res) => {
  try {
    const { reason = 'Banned by admin' } = req.body
    await User.findByIdAndUpdate(req.params.id, { status: 'banned', banReason: reason })
    return res.json({ success: true })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// Sets the target user's status to timeout until the calculated future date
export const timeoutUser = async (req, res) => {
  try {
    const { duration, unit } = req.body
    const ms = unit === 'days' ? duration * 24 * 60 * 60 * 1000 : duration * 60 * 60 * 1000
    const timeoutUntil = new Date(Date.now() + ms)
    await User.findByIdAndUpdate(req.params.id, { status: 'timeout', timeoutUntil })
    return res.json({ success: true })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// Clears any ban or timeout on the target user and restores active status
export const unbanUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      status: 'active',
      banReason: '',
      timeoutUntil: null,
    })
    return res.json({ success: true })
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
