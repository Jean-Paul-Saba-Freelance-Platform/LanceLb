import express from 'express';
import { register, login, logout, sendVerifyOtp, verifyOtp, isAuthenticated, getProfile, updateProfile, googleAuth, googleCallback } from '../controllers/authController.js';
import {userAuth,isVerified} from '../middleware/userAuth.js';
import User from '../models/userModels.js';


const authRouter = express.Router(); 

authRouter.post('/register', register);
authRouter.get('/google', googleAuth);
authRouter.get('/google/callback', googleCallback);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/send-verify-otp', userAuth,  sendVerifyOtp);
authRouter.post('/verify-account',  userAuth, verifyOtp);
authRouter.get('/is-auth', userAuth,  isAuthenticated);
authRouter.get('/profile', userAuth, isVerified, getProfile);
authRouter.put('/profile', userAuth, isVerified, updateProfile);

// PATCH /api/auth/onboarding-dismiss — mark phone or billing as dismissed
authRouter.patch('/onboarding-dismiss', userAuth, async (req, res) => {
  try {
    const { field } = req.body  // expects field: 'phone' | 'billing'
    if (!['phone', 'billing'].includes(field)) {
      return res.status(400).json({ success: false, message: 'Invalid field' })
    }
    await User.findByIdAndUpdate(req.userId, {
      [`onboardingDismissed.${field}`]: true
    })
    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

export default authRouter;

