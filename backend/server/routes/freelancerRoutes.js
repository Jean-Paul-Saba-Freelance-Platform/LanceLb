import express from 'express'
import { getFreelancerStats, toggleSaveJob, getSavedJobs } from '../controllers/freelancerController.js'
import { userAuth, isVerified } from '../middleware/userAuth.js'

const freelancerRouter = express.Router()

freelancerRouter.get('/stats', userAuth, getFreelancerStats)
freelancerRouter.post('/saved-jobs/:jobId', userAuth, toggleSaveJob)
freelancerRouter.get('/saved-jobs', userAuth, getSavedJobs)

export default freelancerRouter
