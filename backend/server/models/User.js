import mongoose from 'mongoose'

// User Schema for MongoDB
// Stores user registration information with proper validation and security
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
    // Note: We store the hashed password, never the plain text
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['freelancer', 'client'],
    default: 'freelancer'
  },
  country: {
    type: String,
    default: 'Lebanon'
  },
  marketingOptIn: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
})

// Export the User model
export default mongoose.model('User', userSchema)
