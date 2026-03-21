import Follow, { FOLLOW_STATUS } from "../models/followModel.js";
import Notification from "../models/notificationModel.js";
import User from "../models/userModels.js";
import { getReceiverSocketId, io } from "../lib/realtime.js";

// Helper — push a real-time notification event to a user's socket if online
const emitNotification = (userId, notification) => {
  const socketId = getReceiverSocketId(userId);
  if (socketId) {
    io.to(socketId).emit("notification", notification);
  }
};

// ---------------------------------------------------------------------------
// POST /api/follow/:userId — Send a follow request to another user
// ---------------------------------------------------------------------------

/**
 * sendFollowRequest
 *
 * Creates a Follow document with status 'requested' and notifies the target.
 * If a follow already exists (any status), returns the current state.
 */
export const sendFollowRequest = async (req, res) => {
  try {
    const followerId = req.userId;
    const { userId: followingId } = req.params;

    if (String(followerId) === String(followingId)) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself." });
    }

    // Check for existing relationship
    const existing = await Follow.findOne({ followerId, followingId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Follow already exists.", status: existing.status });
    }

    const follow = await Follow.create({ followerId, followingId, status: FOLLOW_STATUS.REQUESTED });

    // Fetch requester's name for the notification message
    const requester = await User.findById(followerId).select("name").lean();
    const requesterName = requester?.name || "Someone";

    // Persist notification for the target user
    const notification = await Notification.create({
      userId: followingId,
      type: "follow_request",
      title: "New follow request",
      message: `${requesterName} wants to follow you.`,
      relatedId: follow._id,
      relatedType: "follow",
    });

    // Deliver notification in real time if target is online
    emitNotification(followingId, notification);

    return res.status(201).json({ success: true, follow });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/follow/:followId/respond — Accept or reject a follow request
// ---------------------------------------------------------------------------

/**
 * respondToFollowRequest
 *
 * Accepts or rejects an incoming follow request.
 * - accept: sets status to 'accepted', notifies the requester
 * - reject: deletes the Follow document entirely
 */
export const respondToFollowRequest = async (req, res) => {
  try {
    const { followId } = req.params;
    const { action } = req.body; // 'accept' | 'reject'

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be 'accept' or 'reject'." });
    }

    // Only the target of the follow request can respond
    const follow = await Follow.findOne({ _id: followId, followingId: req.userId });
    if (!follow) {
      return res.status(404).json({ success: false, message: "Follow request not found." });
    }
    if (follow.status !== FOLLOW_STATUS.REQUESTED) {
      return res.status(409).json({ success: false, message: "Follow request already processed." });
    }

    if (action === "reject") {
      await follow.deleteOne();
      return res.json({ success: true, message: "Follow request rejected." });
    }

    // Accept: update status
    follow.status = FOLLOW_STATUS.ACCEPTED;
    await follow.save();

    // Notify the original requester that their request was accepted
    const acceptor = await User.findById(req.userId).select("name").lean();
    const acceptorName = acceptor?.name || "Someone";

    // Notify A that their request was accepted
    const notification = await Notification.create({
      userId: follow.followerId,
      type: "follow_accepted",
      title: "Follow request accepted",
      message: `${acceptorName} accepted your follow request.`,
      relatedId: follow._id,
      relatedType: "follow",
      senderId: req.userId,
    });

    emitNotification(String(follow.followerId), notification);

    // Fetch requester's name for B's suggestion notification
    const requester = await User.findById(follow.followerId).select("name").lean();
    const requesterName = requester?.name || "Someone";

    // Check if B is already following A — if so, skip the suggestion
    const alreadyFollowingBack = await Follow.findOne({
      followerId: req.userId,
      followingId: follow.followerId,
    });

    if (!alreadyFollowingBack) {
      // Notify B to follow back A
      const suggestionNotif = await Notification.create({
        userId: req.userId,
        type: "follow_back_suggestion",
        title: "Follow back?",
        message: `${requesterName} is now following you. Follow them back?`,
        relatedId: follow._id,
        relatedType: "follow",
        senderId: follow.followerId,
      });
      emitNotification(String(req.userId), suggestionNotif);
    }

    return res.json({ success: true, follow });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/follow/:userId — Unfollow a user (or cancel a pending request)
// ---------------------------------------------------------------------------

/**
 * unfollowUser
 *
 * Removes the follow relationship regardless of its current status,
 * so this also works as "cancel follow request".
 */
export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.userId;
    const { userId: followingId } = req.params;

    const result = await Follow.findOneAndDelete({ followerId, followingId });
    if (!result) {
      return res.status(404).json({ success: false, message: "Follow relationship not found." });
    }

    return res.json({ success: true, message: "Unfollowed successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/follow/status/:userId — Get follow status between current user and target
// ---------------------------------------------------------------------------

/**
 * getFollowStatus
 *
 * Returns the follow relationship status between the authenticated user and the
 * target user. Checks both directions (am I following them? are they following me?).
 */
export const getFollowStatus = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { userId: targetId } = req.params;

    // Direction: current user → target
    const outgoing = await Follow.findOne({ followerId: currentUserId, followingId: targetId }).lean();
    // Direction: target → current user
    const incoming = await Follow.findOne({ followerId: targetId, followingId: currentUserId }).lean();

    return res.json({
      success: true,
      outgoing: outgoing ? outgoing.status : null,   // null | 'requested' | 'accepted'
      incoming: incoming ? incoming.status : null,   // null | 'requested' | 'accepted'
      followId: outgoing?._id || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/follow/requests — Pending incoming follow requests for current user
// ---------------------------------------------------------------------------

/**
 * getFollowRequests
 *
 * Returns all pending follow requests directed at the authenticated user,
 * with the requester's public profile populated.
 */
export const getFollowRequests = async (req, res) => {
  try {
    const requests = await Follow.find({
      followingId: req.userId,
      status: FOLLOW_STATUS.REQUESTED,
    })
      .populate("followerId", "name title profilePicture userType experienceLevel")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/follow/following — Users the current user is following (accepted)
// ---------------------------------------------------------------------------

/**
 * getFollowing
 *
 * Returns the list of users the authenticated user is currently following
 * (status = accepted).
 */
export const getFollowing = async (req, res) => {
  try {
    const follows = await Follow.find({
      followerId: req.userId,
      status: FOLLOW_STATUS.ACCEPTED,
    })
      .populate("followingId", "name title profilePicture userType experienceLevel bio")
      .sort({ createdAt: -1 })
      .lean();

    const following = follows.map((f) => f.followingId);
    return res.json({ success: true, following });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/follow/followers — Users following the current user (accepted)
// ---------------------------------------------------------------------------

/**
 * getFollowers
 *
 * Returns the list of users who are following the authenticated user
 * (status = accepted).
 */
export const getFollowers = async (req, res) => {
  try {
    const follows = await Follow.find({
      followingId: req.userId,
      status: FOLLOW_STATUS.ACCEPTED,
    })
      .populate("followerId", "name title profilePicture userType experienceLevel bio")
      .sort({ createdAt: -1 })
      .lean();

    const followers = follows.map((f) => f.followerId);
    return res.json({ success: true, followers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/follow/explore — Browse all users with search + filters
// ---------------------------------------------------------------------------

/**
 * exploreUsers
 *
 * Returns a paginated list of all users except the current user,
 * excluding users already followed or with a pending follow request.
 * Supports optional query params: search, userType, experienceLevel, page, limit.
 */
export const exploreUsers = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { search, userType, experienceLevel, page = 1, limit = 12 } = req.query;

    // Get all users the current user already follows or has requested
    const existingFollows = await Follow.find({
      followerId: currentUserId,
    }).select('followingId').lean();

    const excludedIds = existingFollows.map(f => f.followingId);
    excludedIds.push(currentUserId); // also exclude self

    const query = { _id: { $nin: excludedIds } };

    if (userType && ['freelancer', 'client'].includes(userType)) {
      query.userType = userType;
    }

    if (experienceLevel && ['entry', 'intermediate', 'expert'].includes(experienceLevel)) {
      query.experienceLevel = experienceLevel;
    }

    if (search) {
      const re = new RegExp(search.trim(), 'i');
      query.$or = [{ name: re }, { title: re }, { bio: re }, { skills: re }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name title bio skills experienceLevel profilePicture userType createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    return res.json({
      success: true,
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/follow/user/:userId — Public profile of any user
// ---------------------------------------------------------------------------

/**
 * getPublicProfile
 *
 * Returns the public-facing profile fields of any user by ID.
 * Used by profile view pages.
 */
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("name title bio skills experienceLevel profilePicture userType createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followingId: req.params.userId, status: 'accepted' }),
      Follow.countDocuments({ followerId: req.params.userId, status: 'accepted' }),
    ]);

    return res.json({ success: true, user: { ...user, followersCount, followingCount } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
