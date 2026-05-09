import jwt from 'jsonwebtoken'

// Stateless admin auth middleware — verifies ADMIN_JWT_SECRET and checks isAdmin in payload
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ success: false, message: 'No admin token provided' })
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET)

    if (decoded.isAdmin !== true) {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message })
  }
}

export default adminAuth
