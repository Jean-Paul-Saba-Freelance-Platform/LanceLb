import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModels.js';
import transporter from '../config/nodemailer.js';

// ---------------------------------------------------------------------------
// Cookie options helper
// ---------------------------------------------------------------------------

/**
 * cookieOptions — Shared auth cookie configuration used by register, login,
 * and logout so all three handlers stay in sync.
 *
 * BUG RISK: The browser only accepts a clearCookie() call when the options
 * (httpOnly, secure, sameSite, domain, path) exactly match what was used
 * when the cookie was first set. Mismatched options across handlers cause
 * logout to silently fail — the user appears logged out on the frontend but
 * the token cookie persists in the browser. Define options once here to
 * prevent that class of bug.
 *
 * Production:  secure=true  + sameSite='None'  (required for cross-origin cookies over HTTPS)
 * Development: secure=false + sameSite='Lax'   (works on localhost without HTTPS)
 */
const IS_PROD = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,                        // inaccessible to client-side JavaScript (XSS protection)
    secure: IS_PROD,                       // HTTPS only in production
    sameSite: IS_PROD ? 'None' : 'Lax',   // cross-origin in prod, same-site relaxed in dev
    maxAge: 7 * 24 * 60 * 60 * 1000,      // 7 days in milliseconds
};

// ---------------------------------------------------------------------------
// POST /api/auth/register — Create a new user account
// ---------------------------------------------------------------------------

export const register = async (req, res) => {
    const { name, email, password, userType } = req.body;

    // Validate that all required registration fields are present
    if (!name || !email || !password || !userType) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Reject duplicate emails before attempting to create a new account
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        // Hash the plain-text password with bcrypt before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a 6-digit numeric OTP for email verification
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // Create and persist the new user document
        const user = new User({
            name,
            email,
            password: hashedPassword,
            userType,
            verifyOtp: otp,
            verifyOtpExpiry: Date.now() + 24 * 60 * 60 * 1000, // OTP valid for 24 hours
        });
        await user.save();

        // Sign a JWT so the user is immediately authenticated after registration
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Set the token as an httpOnly cookie — this prevents JavaScript from
        // reading it, protecting against XSS token theft
        res.cookie('token', token, cookieOptions);

        // Send the verification OTP email. This is non-blocking: if the mail
        // transport fails, registration still succeeds and the user can request
        // a new OTP later via the resend endpoint.
        try {
            await transporter.sendMail({
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: 'Verify your email for LanceLB',
                text: `Welcome to LanceLB! Your account has been created. Your verification OTP is ${otp}.`,
            });
            // SECURITY: never log the OTP value — it is a credential
            console.log('Verification OTP email sent to:', email);
        } catch (mailError) {
            console.error('Mail sending failed:', mailError.message);
        }

        // Strip all sensitive fields before returning the user object to the client
        user.password = undefined;
        user.verifyOtp = undefined;
        user.verifyOtpExpiry = undefined;

        return res.json({ success: true, message: 'User created successfully', user, token });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------------------------------------------------------------------
// POST /api/auth/login — Authenticate an existing user
// ---------------------------------------------------------------------------

export const login = async (req, res) => {
    const { email, password } = req.body;

    // Both fields are mandatory for login
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Look up the user record by email address
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Compare the submitted password against the stored bcrypt hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Issue a fresh JWT and store it in a cookie (same options as register)
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, cookieOptions);

        // Return the sanitised user object without the password hash
        user.password = undefined;
        return res.json({ success: true, message: 'Login successful', user, token });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------------------------------------------------------------------
// POST /api/auth/logout — Invalidate the session by clearing the auth cookie
// ---------------------------------------------------------------------------

export const logout = async (req, res) => {
    try {
        // Must pass the same cookie options used during set — see cookieOptions above
        res.clearCookie('token', cookieOptions);
        return res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------------------------------------------------------------------
// POST /api/auth/send-verify-otp — (Re-)send an email verification OTP
// ---------------------------------------------------------------------------

export const sendVerifyOtp = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Nothing to do if the account is already verified
        if (user.isAccountVerified) {
            return res.status(400).json({ success: false, message: 'Account already verified' });
        }

        // Generate a fresh OTP, overwriting any previously issued one
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpiry = Date.now() + 60 * 60 * 1000; // valid for 1 hour
        await user.save();

        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Verify your email for LanceLB',
            text: `Your verification OTP is ${otp}.`,
        });

        res.json({ success: true, message: 'Verify OTP sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ---------------------------------------------------------------------------
// POST /api/auth/verify-otp — Confirm ownership of the registered email
// ---------------------------------------------------------------------------

export const verifyOtp = async (req, res) => {
    const { otp } = req.body;

    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Guard: make sure an OTP was actually requested before trying to verify
        if (!user.verifyOtp || !user.verifyOtpExpiry) {
            return res.status(400).json({ success: false, message: 'No OTP requested' });
        }

        // Check whether the OTP window has passed
        if (user.verifyOtpExpiry < Date.now()) {
            // Clear the expired OTP so it can't be reused
            user.verifyOtp = '';
            user.verifyOtpExpiry = 0;
            await user.save();
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        // Compare using string coercion to handle numeric OTPs sent as numbers
        if (String(user.verifyOtp) !== String(otp)) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Mark the account as verified and clear the OTP fields
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpiry = 0;
        await user.save();

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ---------------------------------------------------------------------------
// GET /api/auth/is-auth — Verify that the current session token is valid
// ---------------------------------------------------------------------------

export const isAuthenticated = async (req, res) => {
    try {
        // The userAuth middleware has already verified the JWT by this point.
        // Reaching here means the user is authenticated.
        return res.status(200).json({ success: true, message: 'User is authenticated' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------------------------------------------------------------------
// GET /api/auth/profile — Fetch the authenticated user's profile
// ---------------------------------------------------------------------------

export const getProfile = async (req, res) => {
    try {
        // Exclude all sensitive / internal fields from the response
        const user = await User.findById(req.userId)
            .select('-password -verifyOtp -verifyOtpExpiry -resetOtp -resetOtpExpiry');

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------------------------------------------------------------------
// PATCH /api/auth/profile — Update the authenticated user's profile fields
// ---------------------------------------------------------------------------

export const updateProfile = async (req, res) => {
    try {
        const { skills, bio, experienceLevel, title } = req.body;
        const updates = {};

        // Build the updates object from only the fields that were provided.
        // Each field is sanitised before being accepted.
        if (skills !== undefined) {
            if (!Array.isArray(skills)) {
                return res.status(400).json({ success: false, message: 'Skills must be an array' });
            }
            updates.skills = skills.map((s) => String(s).trim()).filter(Boolean);
        }

        if (bio !== undefined) {
            // Trim whitespace and enforce the model's 1000-char limit
            updates.bio = String(bio).trim().slice(0, 1000);
        }

        if (experienceLevel !== undefined) {
            if (!['entry', 'intermediate', 'expert'].includes(experienceLevel)) {
                return res.status(400).json({ success: false, message: 'Invalid experience level' });
            }
            updates.experienceLevel = experienceLevel;
        }

        if (title !== undefined) {
            // Trim and enforce the model's 120-char limit
            updates.title = String(title).trim().slice(0, 120);
        }

        const user = await User.findByIdAndUpdate(req.userId, updates, { new: true })
            .select('-password -verifyOtp -verifyOtpExpiry -resetOtp -resetOtpExpiry');

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.json({ success: true, message: 'Profile updated', user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
