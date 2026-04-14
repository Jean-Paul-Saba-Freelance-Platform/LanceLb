import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    reviewerType: {
      type: String,
      enum: ['client', 'freelancer'],
      required: true,
    },
  },
  { timestamps: true }
)

// One review per reviewer per project
reviewSchema.index({ projectId: 1, reviewerId: 1 }, { unique: true })

export default mongoose.model('Review', reviewSchema)
