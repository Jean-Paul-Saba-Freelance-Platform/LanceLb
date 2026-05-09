import express from 'express'
import { profilePictureUpload, videoIntroUpload } from '../config/cloudinary.js'
import userAuth from '../middleware/userAuth.js'
import User from '../models/userModels.js'

const router = express.Router()

// Upload a profile picture to Cloudinary and persist the URL on the user document
router.post('/profile-picture', userAuth, (req, res, next) => {
  profilePictureUpload.single('profilePicture')(req, res, async (err) => {
    if (err) {
      console.error('Multer/Cloudinary upload error:', err)
      return res.status(500).json({ success: false, message: err.message })
    }
    try {
      const url = req.file?.path
      if (!url) return res.status(400).json({ success: false, message: 'No file uploaded' })

      await User.findByIdAndUpdate(req.userId, { profilePicture: url })
      return res.json({ success: true, url })
    } catch (error) {
      console.error('Upload error:', error)
      return res.status(500).json({ success: false, message: error.message })
    }
  })
})

// Upload a video intro to Cloudinary and persist the URL on the user document
router.post('/video-intro', userAuth, videoIntroUpload.single('videoIntro'), async (req, res) => {
  try {
    const url = req.file?.path
    if (!url) return res.status(400).json({ success: false, message: 'No file uploaded' })

    await User.findByIdAndUpdate(req.userId, { videoIntro: url })
    return res.json({ success: true, url })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
})

export default router
