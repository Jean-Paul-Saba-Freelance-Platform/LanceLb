import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModels.js';


//REGISTER CONTROLLER

const register = async (req, res) => {
    const { name, email, password, userType } = req.body;


    if(!name || !email || !password || !userType) {
        return req.json({success:false, message:'All fields are required'});
    }


    try {
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.json({success:false, message:'User already exists'});
        }


        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new UserModel({ name, email, password:hashedPassword, userType });

        await user.save();

        return res.json({success:true, message:'User created successfully', user});

        const token = jwt.sign({
             userId: user._id },
             process.env.JWT_SECRET, 
             { expiresIn: '7d' }
            );


        res.cookie('token', token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ?
            'None' : 'strict',

            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

    }


    catch (error) {
        return res.json({success:false, message:error.message});
    }
}




//LOGIN CONTROLLER

export const login = async (req, res) => {
    const { email, password } = req.body;
    //INPUT VALIDATION
    if(!email || !password) {
        return res.json({success:false, message:'All fields are required'});
    }
    try {
        const user = await User.findOne({ email });
        //USER CHECK
        if(!user) {
            return res.json({success:false, message:'User not found'});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        //PASSWORD CHECK
        if(!isMatch) {
            return res.json({success:false, message:'Invalid password'});
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
        return res.json({success:true, message:'Login successful', user});

    }
    catch (error) {
        return res.json({success:false, message:error.message});
    }
}



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
        return res.json({success:false, message:error.message});
        }

}