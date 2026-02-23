import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModels.js';
import transporter from '../config/nodemailer.js';


//REGISTER CONTROLLER
export const register = async (req, res) => {
    const { name, email, password, userType } = req.body;
    console.log("Register attempt:", { name, email, userType }); // DEBUG LOG

    if(!name || !email || !password || !userType) {
        console.log("Register failed: Missing fields"); // DEBUG LOG
        return res.status(400).json({success:false, message:'All fields are required'});
    }


    try {
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            console.log("Register failed: User exists"); // DEBUG LOG
            return res.status(409).json({success:false, message:'User already exists'});
        }


        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        const user = new User({ 
            name, 
            email, 
            password: hashedPassword, 
            userType,
            verifyOtp: otp,
            verifyOtpExpiry: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        await user.save();
        const userCount = await User.countDocuments();
        console.log("User saved to DB. Total users in collection:", userCount); // DEBUG LOG

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production'?"none" :"lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });


        //SEND VERIFICATION OTP EMAIL
        try {
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: 'Verify your email for LanceLB',
                text: `Welcome to LanceLB! Your account has been created. Your verification OTP is ${otp}.`
            };
            await transporter.sendMail(mailOptions);
            console.log("Verification OTP email sent to:", email, "OTP:", otp); // DEBUG LOG
        } catch (mailError) {
            console.error("Mail sending failed:", mailError.message);
            // Don't fail the whole registration if mail fails
        }

        user.password = undefined;
        return res.json({success:true, message:'User created successfully', user, token});

    } catch (error) {
        console.error("Register error:", error); // DEBUG LOG
        return res.status(500).json({success:false, message:error.message});
    }
}
//LOGIN CONTROLLER
export const login = async (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt:", { email }); // DEBUG LOG

    //INPUT VALIDATION
    if(!email || !password) {
        return res.status(400).json({success:false, message:'All fields are required'});
    }
    try {
        const user = await User.findOne({ email });
        //USER CHECK
        if(!user) {
            console.log("Login failed: User not found"); // DEBUG LOG
            return res.status(404).json({success:false, message:'User not found'});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        //PASSWORD CHECK
        if(!isMatch) {
            console.log("Login failed: Invalid password"); // DEBUG LOG
            return res.status(401).json({success:false, message:'Invalid password'});
        }

        //TOKEN GENERATION
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        //COOKIE SETTING
        res.cookie('token', token, { httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
            'None' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 });

        //RESPONSE SENDING
        user.password = undefined;
        console.log("Login successful for:", email); // DEBUG LOG
        return res.json({success:true, message:'Login successful', user, token});

    }
    catch (error) {
        console.error("Login error:", error); // DEBUG LOG
        return res.status(500).json({success:false, message:error.message});
    }
}
//LOGOUT CONTROLLER
export const logout = async (req, res) => { 
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
            'None' : 'strict',
            maxAge: 0
        });
        return res.json({success:true, message:'Logout successful'});
    }
    catch (error) {
        return res.status(500).json({success:false, message:error.message});
        }

}
//SEND VERIFICATION OTP CONTROLLER
export const sendVerifyOtp = async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      if (user.isAccountVerified) return res.status(400).json({ success: false, message: "Account already verified" });
  
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      user.verifyOtp = otp;
      user.verifyOtpExpiry = Date.now() + 60 * 60 * 1000;
      await user.save();
  
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: "Verify your email for LanceDB",
        text: `Your verification OTP is ${otp}.`,
      });
  
      res.json({ success: true, message: "Verify OTP sent successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
  
export const verifyOtp = async (req, res) => {
    const { otp } = req.body;
  
    if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });
  
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
  
      if (!user.verifyOtp || !user.verifyOtpExpiry) {
        return res.status(400).json({ success: false, message: "No OTP requested" });
      }
  
      if (user.verifyOtpExpiry < Date.now()) {
        user.verifyOtp = "";
        user.verifyOtpExpiry = 0;
        await user.save();
        return res.status(400).json({ success: false, message: "OTP expired" });
      }
  
      if (String(user.verifyOtp) !== String(otp)) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }
  
      user.isAccountVerified = true;
      user.verifyOtp = "";
      user.verifyOtpExpiry = 0;
      await user.save();
  
      res.json({ success: true, message: "Email verified successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
  
export const isAuthenticated = async (req, res) => {
  try {
    return res.status(200).json({ success: true, message: "User is authenticated" });

  }
  catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -verifyOtp -verifyOtpExpiry -resetOtp -resetOtpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { skills, bio, experienceLevel, title } = req.body;
    const updates = {};

    if (skills !== undefined) {
      if (!Array.isArray(skills)) return res.status(400).json({ success: false, message: 'Skills must be an array' });
      updates.skills = skills.map(s => String(s).trim()).filter(Boolean);
    }
    if (bio !== undefined) updates.bio = String(bio).trim().slice(0, 1000);
    if (experienceLevel !== undefined) {
      if (!['entry', 'intermediate', 'expert'].includes(experienceLevel)) {
        return res.status(400).json({ success: false, message: 'Invalid experience level' });
      }
      updates.experienceLevel = experienceLevel;
    }
    if (title !== undefined) updates.title = String(title).trim().slice(0, 120);

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true })
      .select('-password -verifyOtp -verifyOtpExpiry -resetOtp -resetOtpExpiry');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
