import Review from '../models/reviewModel.js'
import Project from '../models/projectModel.js'
import User from '../models/userModels.js'
import Notification from '../models/notificationModel.js'
import { io } from '../lib/realtime.js'

// POST /api/reviews — Submit a review for a completed project
export const submitReview = async (req, res) => {
  try {
    const { projectId, rating, comment } = req.body
    const reviewerId = req.userId

    if (!projectId || !rating) {
      return res.status(400).json({ success: false, message: 'projectId and rating are required' })
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' })
    }

    const project = await Project.findById(projectId)
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }
    if (project.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Project must be completed before leaving a review' })
    }

    // Determine reviewer type and reviewee
    const isClient = project.clientId.toString() === reviewerId
    const isFreelancer = project.jobs.some((j) =>
      j.freelancerIds.some((fid) => fid.toString() === reviewerId)
    )

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    // Client reviews the freelancer(s), freelancer reviews the client
    let revieweeId
    if (isClient) {
      const allFreelancerIds = project.jobs.flatMap((j) => j.freelancerIds.map((fid) => fid.toString()))
      if (!allFreelancerIds.length) {
        return res.status(400).json({ success: false, message: 'No freelancer found on this project' })
      }
      revieweeId = allFreelancerIds[0]
    } else {
      revieweeId = project.clientId.toString()
    }

    // Check for duplicate review
    const existing = await Review.findOne({ projectId, reviewerId })
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this project' })
    }

    const review = await Review.create({
      projectId,
      reviewerId,
      revieweeId,
      rating,
      comment: comment?.trim() || '',
      reviewerType: isClient ? 'client' : 'freelancer',
    })

    // Recalculate reviewee average rating
    const allReviews = await Review.find({ revieweeId })
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    await User.findByIdAndUpdate(revieweeId, {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: allReviews.length,
    })

    // Notify the reviewee
    const reviewer = await User.findById(reviewerId).select('name')
    const notif = await Notification.create({
      userId: revieweeId,
      type: 'review_received',
      title: 'New review received',
      message: `${reviewer?.name || 'Someone'} left you a ${rating}-star review for "${project.title}".`,
      relatedId: project._id,
      relatedType: 'project',
    })
    io.to(`user:${revieweeId}`).emit('notification', notif.toObject())

    return res.status(201).json({ success: true, review })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this project' })
    }
    return res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/reviews/user/:userId — Get all reviews received by a user
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params
    const reviews = await Review.find({ revieweeId: userId })
      .populate('reviewerId', 'name profilePicture userType')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 })
      .lean()

    return res.json({ success: true, reviews })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/reviews/project/:projectId/mine — Check if current user already reviewed
export const getMyProjectReview = async (req, res) => {
  try {
    const { projectId } = req.params
    const review = await Review.findOne({ projectId, reviewerId: req.userId }).lean()
    return res.json({ success: true, review: review || null })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
