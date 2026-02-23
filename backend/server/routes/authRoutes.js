import express from 'express';
import { register, login, logout, sendVerifyOtp, verifyOtp, isAuthenticated, getProfile, updateProfile } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';


const authRouter = express.Router(); 

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);
authRouter.post('/verify-account', userAuth, verifyOtp);
authRouter.get('/is-auth', userAuth, isAuthenticated);
authRouter.get('/profile', userAuth, getProfile);
authRouter.put('/profile', userAuth, updateProfile);


export default authRouter;

