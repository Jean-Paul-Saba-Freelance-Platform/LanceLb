import jwt from 'jsonwebtoken'
import User from '../models/userModels.js'

// Middleware to protect admin-only routes — verifies JWT and checks isAdmin flag
const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const { userId } = decoded

    const user = await User.findById(userId).select('isAdmin')

    if (!user || user.isAdmin !== true) {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    req.userId = userId
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message })
  }
}

export default adminAuth
