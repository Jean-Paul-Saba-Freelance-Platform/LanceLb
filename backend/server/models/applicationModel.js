import mongoose from "mongoose";

const { Schema } = mongoose;

const answerSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    value: {
      type: Schema.Types.Mixed, // text, number, boolean, etc.
      required: true
    }
  },
  { _id: false }
);

const applicationSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },

    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    freelancerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    coverLetter: {
      type: String,
      trim: true,
      maxlength: 3000
    },

    proposedBudget: {
      type: Number
    },

    proposedTimelineDays: {
      type: Number
    },

    answers: [answerSchema],

    status: {
      type: String,
      enum: [
        "pending",
        "shortlisted",
        "accepted",
        "rejected",
        "withdrawn"
      ],
      default: "pending"
    },

    aiScore: {
      type: Number,
      min: 0,
      max: 100
    },

    aiStrengths: {
      type: [String]
    },

    aiWeaknesses: {
      type: [String]
    },

    clientNotes: {
      type: String
    },

    viewedByClient: {
      type: Boolean,
      default: false
    },

    // ATS resume evaluation — populated when freelancer uploads CV during apply
    atsScore:      { type: Number, min: 0, max: 100 },
    atsGrade:      { type: String },
    atsCategory:   { type: String },
    atsConfidence: { type: Number },
    atsBreakdown:  { type: Schema.Types.Mixed },
    atsFeedback:   { type: [String] },

  },
  {
    timestamps: true
  }
);

// Prevent duplicate applications
applicationSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
