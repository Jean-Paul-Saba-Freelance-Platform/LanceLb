import express from 'express'
import { incrementProfileViews } from '../controllers/authController.js'

const userRouter = express.Router()

userRouter.patch('/:id/view', incrementProfileViews)

export default userRouter
