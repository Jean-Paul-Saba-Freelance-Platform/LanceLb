import mongoose from "mongoose";

const FOLLOW_STATUS = Object.freeze({
  REQUESTED: "requested",
  ACCEPTED: "accepted",
});

const followSchema = new mongoose.Schema(
  {
    // The user initiating the follow
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The user being followed
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // requested → accepted (rejected = document deleted)
    status: {
      type: String,
      enum: Object.values(FOLLOW_STATUS),
      default: FOLLOW_STATUS.REQUESTED,
    },
  },
  { timestamps: true }
);

// Prevent duplicate follow relationships
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
// Fast lookup of who follows a given user
followSchema.index({ followingId: 1, status: 1 });
// Fast lookup of who a user follows
followSchema.index({ followerId: 1, status: 1 });

export { FOLLOW_STATUS };
export default mongoose.model("Follow", followSchema);
