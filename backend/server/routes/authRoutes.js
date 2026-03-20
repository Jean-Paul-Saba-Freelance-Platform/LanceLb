import express from 'express';
import { register, login, logout, sendVerifyOtp, verifyOtp, isAuthenticated, getProfile, updateProfile, googleAuth, googleCallback } from '../controllers/authController.js';
import {userAuth,isVerified} from '../middleware/userAuth.js';


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


export default authRouter;

