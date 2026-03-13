import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    dueDate: {
      type: Date,
    },
    // Freelancer marks done first, then client validates
    completedByFreelancer: {
      type: Boolean,
      default: false,
    },
    completedByFreelancerAt: {
      type: Date,
    },
    validatedByClient: {
      type: Boolean,
      default: false,
    },
    validatedByClientAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Computed status helper on the virtual
taskSchema.virtual("status").get(function () {
  if (this.validatedByClient) return "completed";
  if (this.completedByFreelancer) return "awaiting_validation";
  if (this.dueDate && this.dueDate < new Date()) return "overdue";
  return "pending";
});

taskSchema.set("toJSON", { virtuals: true });
taskSchema.set("toObject", { virtuals: true });

// Each job slot in a project (e.g. "UI/UX Designer", "Backend Dev")
const projectJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    // IDs of accepted applications for this job slot
    acceptedApplicationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
    // IDs of the accepted freelancers (denormalized for quick access)
    freelancerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["planning", "active", "completed"],
      default: "planning",
    },
    launchDate: {
      type: Date,
    },
    // Job slots that make up this project
    jobs: [projectJobSchema],
    // Tasks / milestones
    tasks: [taskSchema],
    // The messaging crew auto-created when project starts
    crewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crew",
    },
  },
  { timestamps: true }
);

projectSchema.index({ clientId: 1, createdAt: -1 });

export default mongoose.model("Project", projectSchema);
