import express from 'express'
import { getFreelancerStats } from '../controllers/freelancerController.js'
import {userAuth,isVerified} from '../middleware/userAuth.js'

const freelancerRouter = express.Router()

freelancerRouter.get('/stats', userAuth, getFreelancerStats)

export default freelancerRouter
