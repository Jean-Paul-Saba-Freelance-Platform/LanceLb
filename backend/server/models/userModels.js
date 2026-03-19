import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    
    verifyOtp: {
        type: String,
        default: ''
    },
    verifyOtpExpiry: {
        type: Number,
        default:0,

    },
    isAccountVerified: {
        type: Boolean,
        default:false,
    },
    userType: {
        type: String,
        enum: ['freelancer', 'client'],
        default: 'freelancer',
    },
    resetOtp: {
        type: String,
        default: '',
    },
    resetOtpExpiry: {
        type: Number,
        default:0,
    },
    skills: {
        type: [String],
        default: [],
    },
    bio: {
        type: String,
        default: '',
        maxlength: 1000,
    },
    experienceLevel: {
        type: String,
        enum: ['entry', 'intermediate', 'expert'],
        default: 'entry',
    },
    title: {
        type: String,
        default: '',
        maxlength: 120,
    },
    profilePicture:{
        type:String,
        default: '',
        
    },
    isAdmin: {
        type: Boolean,
        default: false,
}
})

const User = mongoose.model('User', userSchema);

export default User;