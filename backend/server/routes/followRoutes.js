import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  sendFollowRequest,
  respondToFollowRequest,
  unfollowUser,
  getFollowStatus,
  getFollowRequests,
  getFollowing,
  getFollowers,
  getPublicProfile,
} from "../controllers/followController.js";

const followRouter = express.Router();

// Public profile — any authenticated user can view any other user's public profile
followRouter.get("/user/:userId", userAuth, getPublicProfile);

// Follow actions
followRouter.post("/:userId", userAuth, sendFollowRequest);
followRouter.delete("/:userId", userAuth, unfollowUser);
followRouter.patch("/:followId/respond", userAuth, respondToFollowRequest);

// Follow state queries
followRouter.get("/status/:userId", userAuth, getFollowStatus);
followRouter.get("/requests", userAuth, getFollowRequests);  // must be before /:userId
followRouter.get("/following", userAuth, getFollowing);
followRouter.get("/followers", userAuth, getFollowers);

export default followRouter;
