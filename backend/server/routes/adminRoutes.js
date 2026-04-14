import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import {
  adminLogin,
  getStats,
  getUserGrowth,
  getJobCategories,
  getTopFreelancers,
} from '../controllers/adminController.js'

const router = express.Router()

router.post('/login', adminLogin)

// Protect all admin routes — requires valid JWT with isAdmin === true
router.use(adminAuth)

router.get('/stats', getStats)
router.get('/user-growth', getUserGrowth)
router.get('/job-categories', getJobCategories)
router.get('/top-freelancers', getTopFreelancers)

export default router
