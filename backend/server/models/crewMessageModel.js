import mongoose from "mongoose";

const crewMessageSchema = new mongoose.Schema(
  {
    crewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crew",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

crewMessageSchema.index({ crewId: 1, createdAt: 1 });

const CrewMessage = mongoose.model("CrewMessage", crewMessageSchema);

export default CrewMessage;
