// models/Application.js
import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileName: String,
    fileType: String,
    fileSize: Number,
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // job owner
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    coverLetter: { type: String, trim: true, maxlength: 5000 },
    proposedBudget: { type: Number, min: 0 },
    estimatedDuration: { type: String, trim: true },

    status: {
      type: String,
      enum: ["pending", "shortlisted", "rejected", "accepted", "withdrawn"],
      default: "pending",
    },

    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

// Prevent same freelancer applying twice to same job
applicationSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
