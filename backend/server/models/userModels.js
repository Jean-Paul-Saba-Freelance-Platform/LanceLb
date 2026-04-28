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
        default: null,
    },
    googleId: {
        type: String,
        default: null,
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
    videoIntro: {
        type: String,
        default: '',
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    savedJobs: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
      default: [],
    },
    education: {
      type: [
        {
          school: { type: String, trim: true, maxlength: 120 },
          degree: { type: String, trim: true, maxlength: 120 },
          yearFrom: { type: Number },
          yearTo: { type: Number },
        }
      ],
      default: [],
    },
    languages: {
      type: [
        {
          language: { type: String, trim: true, maxlength: 60 },
          proficiency: {
            type: String,
            enum: ['basic', 'conversational', 'fluent', 'native'],
            default: 'conversational',
          },
        }
      ],
      default: [],
    },
    hoursPerWeek: {
      type: Number,
      default: null,
      min: 1,
      max: 168,
    },
    profileViews: {
      type: Number,
      default: 0,
    },
    onboardingDismissed: {
      phone:   { type: Boolean, default: false },
      billing: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['active', 'banned', 'timeout'],
      default: 'active',
    },
    banReason: {
      type: String,
      default: '',
    },
    timeoutUntil: {
      type: Date,
      default: null,
    },
}, { timestamps: true })

const User = mongoose.model('User', userSchema);

export default User;