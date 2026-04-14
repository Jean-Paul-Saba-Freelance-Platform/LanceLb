import express from 'express'
import { userAuth, isVerified } from '../middleware/userAuth.js'
import { submitReview, getUserReviews, getMyProjectReview } from '../controllers/reviewController.js'

const router = express.Router()

router.post('/', userAuth, isVerified, submitReview)
router.get('/user/:userId', getUserReviews)
router.get('/project/:projectId/mine', userAuth, isVerified, getMyProjectReview)

export default router
