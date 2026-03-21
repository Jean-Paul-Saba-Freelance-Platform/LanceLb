import mongoose from "mongoose";
import Crew from "../models/crewModel.js";
import CrewMessage from "../models/crewMessageModel.js";
import User from "../models/userModels.js";
import { getReceiverSocketId, io } from "../lib/realtime.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * normalizeId — Converts any ObjectId or string to a plain string.
 * Used consistently when comparing or storing IDs to avoid ObjectId vs string
 * mismatches (e.g. "abc123" !== ObjectId("abc123")).
 */
const normalizeId = (value) => String(value);

/**
 * ensureCrewMember — Guards routes that require the caller to be a crew member.
 *
 * Returns the Crew document when the crew exists AND the user is a member.
 * Returns null if the crewId is an invalid ObjectId format or the crew/member
 * combination is not found — the caller should respond with 404 in both cases.
 */
const ensureCrewMember = async (crewId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(crewId)) return null;
    return Crew.findOne({ _id: crewId, members: userId });
};

// ---------------------------------------------------------------------------
// POST /api/crew — Create a new crew (client only)
// ---------------------------------------------------------------------------

export const createCrew = async (req, res) => {
    try {
        const creatorId = req.userId;

        // Only clients are permitted to create crews
        const creator = await User.findById(creatorId).select("userType");
        if (!creator) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (creator.userType !== "client") {
            return res.status(403).json({ success: false, message: "Only clients can create crews" });
        }

        const name = (req.body?.name || "").trim();
        const memberIds = Array.isArray(req.body?.memberIds) ? req.body.memberIds : [];

        if (!name) {
            return res.status(400).json({ success: false, message: "Crew name is required" });
        }

        // Deduplicate and normalise member IDs, always including the creator
        const uniqueMembers = Array.from(
            new Set([creatorId, ...memberIds].map(normalizeId).filter(Boolean))
        ).filter((id) => mongoose.Types.ObjectId.isValid(id));

        // A crew needs the creator + at least one other member
        if (uniqueMembers.length < 2) {
            return res
                .status(400)
                .json({ success: false, message: "Crew must include at least one additional member" });
        }

        // Verify that all provided IDs correspond to real users in the database
        const validUsers = await User.find({ _id: { $in: uniqueMembers } }).select("_id");
        const validUserIds = validUsers.map((u) => normalizeId(u._id));

        if (validUserIds.length < 2) {
            return res.status(400).json({ success: false, message: "No valid crew members found" });
        }

        // Persist the new crew document
        const crew = await Crew.create({
            name,
            createdBy: creatorId,
            members: validUserIds,
        });

        // Return the crew with populated member details for immediate use on the frontend
        const populatedCrew = await Crew.findById(crew._id)
            .populate("members", "name email profilePicture userType")
            .populate("createdBy", "name email");

        return res.status(201).json({ success: true, crew: populatedCrew });
    } catch (error) {
        console.error("Error in createCrew controller", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// GET /api/crew — List all crews the authenticated user belongs to
// ---------------------------------------------------------------------------

export const getMyCrews = async (req, res) => {
    try {
        // Find every crew where the user appears in the members array,
        // sorted by the most recently active crew first
        const crews = await Crew.find({ members: req.userId })
            .populate("members", "name email profilePicture userType")
            .populate("createdBy", "name email")
            .sort({ updatedAt: -1, createdAt: -1 });

        return res.status(200).json({ success: true, crews });
    } catch (error) {
        console.error("Error in getMyCrews controller", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// GET /api/crew/:crewId/messages — Fetch message history for a crew
// ---------------------------------------------------------------------------

export const getCrewMessages = async (req, res) => {
    try {
        const { crewId } = req.params;

        // Only crew members can read crew messages
        const crew = await ensureCrewMember(crewId, req.userId);
        if (!crew) {
            return res.status(404).json({ success: false, message: "Crew not found" });
        }

        // Return messages oldest-first so the frontend can render a chronological thread
        const messages = await CrewMessage.find({ crewId }).sort({ createdAt: 1 });
        return res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error("Error in getCrewMessages controller", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// POST /api/crew/:crewId/members — Add new members to an existing crew
// ---------------------------------------------------------------------------

export const addCrewMembers = async (req, res) => {
    try {
        const { crewId } = req.params;

        const crew = await Crew.findById(crewId);
        if (!crew) {
            return res.status(404).json({ success: false, message: "Crew not found" });
        }

        // Only the crew owner (creator) can add members
        if (normalizeId(crew.createdBy) !== normalizeId(req.userId)) {
            return res.status(403).json({ success: false, message: "Only the crew owner can add members" });
        }

        // Validate and deduplicate the incoming member IDs
        const incomingIds = Array.isArray(req.body?.memberIds) ? req.body.memberIds : [];
        const validIncomingIds = Array.from(
            new Set(incomingIds.map(normalizeId).filter((id) => mongoose.Types.ObjectId.isValid(id)))
        );

        if (!validIncomingIds.length) {
            return res.status(400).json({ success: false, message: "No valid members provided" });
        }

        // Filter out users who are already in the crew
        const existingMemberIds = new Set(crew.members.map((id) => normalizeId(id)));
        const uniqueNewIds = validIncomingIds.filter((id) => !existingMemberIds.has(id));
        if (!uniqueNewIds.length) {
            return res.status(400).json({ success: false, message: "Selected users are already in this crew" });
        }

        // Confirm the new member IDs exist in the database
        const users = await User.find({ _id: { $in: uniqueNewIds } }).select("_id");
        const foundIds = users.map((u) => normalizeId(u._id));
        if (!foundIds.length) {
            return res.status(400).json({ success: false, message: "No valid users found to add" });
        }

        // Atomically add the new members (addToSet prevents duplicates at the DB level)
        await Crew.updateOne(
            { _id: crewId },
            { $addToSet: { members: { $each: foundIds } }, $set: { updatedAt: new Date() } }
        );

        const updatedCrew = await Crew.findById(crewId)
            .populate("members", "name email profilePicture userType")
            .populate("createdBy", "name email");

        const payload = { crew: updatedCrew };

        // Broadcast the crew update to two audiences:
        //
        // 1. The crew room — notifies all sockets currently viewing this crew's chat.
        io.to(`crew:${normalizeId(crewId)}`).emit("crewUpdated", payload);

        // 2. Newly added members individually — they're not in the crew room yet
        //    (they haven't called joinCrew), so the room broadcast won't reach them.
        //    This ensures they see the new crew appear in their sidebar immediately.
        foundIds.forEach((memberId) => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
                io.to(socketId).emit("crewUpdated", payload);
            }
        });

        return res.status(200).json({ success: true, crew: updatedCrew });
    } catch (error) {
        console.error("Error in addCrewMembers controller", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// POST /api/crew/:crewId/messages — Send a message to a crew chat
// ---------------------------------------------------------------------------

export const sendCrewMessage = async (req, res) => {
    try {
        const { crewId } = req.params;
        const { text, image } = req.body || {};

        // Only crew members may send messages
        const crew = await ensureCrewMember(crewId, req.userId);
        if (!crew) {
            return res.status(404).json({ success: false, message: "Crew not found" });
        }

        // Reject empty messages (no text and no image)
        const trimmedText = typeof text === "string" ? text.trim() : "";
        if (!trimmedText && !image) {
            return res.status(400).json({ success: false, message: "Message cannot be empty" });
        }

        // Persist the message
        const message = await CrewMessage.create({
            crewId,
            senderId: req.userId,
            text: trimmedText,
            image: image || "",
        });

        // Bump the crew's updatedAt timestamp so it floats to the top of the
        // "most recently active" sort order in getMyCrews
        await Crew.updateOne({ _id: crewId }, { $set: { updatedAt: new Date() } });

        const payload = { ...message.toObject(), crewId: normalizeId(crewId) };

        // Broadcast the new message ONLY to the crew room.
        //
        // The crew room (`crew:<id>`) contains the sockets of every user who is
        // currently viewing this crew's chat window (they called joinCrew on
        // socket connect). This single emit reaches all active viewers without
        // duplicating the event for users who are in both the room and the
        // userSocketMap. Members who are not actively viewing the chat will
        // receive the message the next time they load the conversation.
        io.to(`crew:${normalizeId(crewId)}`).emit("newCrewMessage", payload);

        return res.status(201).json({ success: true, message: payload });
    } catch (error) {
        console.error("Error in sendCrewMessage controller", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
