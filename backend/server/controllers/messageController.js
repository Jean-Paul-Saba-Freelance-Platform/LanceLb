import User from "../models/userModels.js";
import Message from "../models/messageModel.js";
import { getReceiverSocketId, io } from "../lib/realtime.js";

// ---------------------------------------------------------------------------
// GET /api/message/user — List all users available to chat with
// ---------------------------------------------------------------------------

/**
 * getUserSideBar
 *
 * Returns every user in the database except the currently authenticated user.
 * This populates the sidebar contact list on the messaging page.
 *
 * NOTE: Passwords are excluded via .select("-password"). Other sensitive
 * fields (OTPs, reset tokens) are not present in the User model's default
 * projection and are therefore not returned.
 *
 * @returns 200 with an array of user documents (may be empty)
 * @returns 500 on unexpected server errors
 */
export const getUserSideBar = async (req, res) => {
    try {
        const loggedInUserId = req.userId;

        // Fetch all users excluding the caller so they don't see themselves
        // in the contact list. Passwords are stripped from every document.
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUserSideBar", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// GET /api/message/:id — Fetch the conversation between two users
// ---------------------------------------------------------------------------

/**
 * getMessages
 *
 * Retrieves the full message history between the authenticated user (sender)
 * and the user identified by the :id route param (receiver). The query uses
 * $or so that it returns messages regardless of which party sent them.
 *
 * @returns 200 with an array of Message documents (oldest first from MongoDB's
 *          natural order — consider adding .sort({ createdAt: 1 }) if ordering
 *          becomes inconsistent)
 * @returns 500 on unexpected server errors
 */
export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.userId;

        // Return messages where this user is either the sender OR the receiver
        const messages = await Message.find({
            $or: [
                { senderId: senderId, recieverId: userToChatId },
                { senderId: userToChatId, recieverId: senderId },
            ],
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages controller", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// POST /api/message/send/:id — Send a direct message to another user
// ---------------------------------------------------------------------------

/**
 * sendMessage
 *
 * Persists a new Message document and delivers it in real time to the
 * recipient if they have an active WebSocket connection.
 *
 * Real-time delivery:
 *   - getReceiverSocketId() looks up the recipient's socket ID in the
 *     in-memory userSocketMap maintained by realtime.js.
 *   - If the recipient is online, io.to(socketId).emit() pushes the message
 *     immediately without them needing to poll.
 *   - If the recipient is offline, the message is still saved to the database
 *     and they will see it the next time they load the conversation.
 *
 * @returns 201 with the newly created Message document on success
 * @returns 500 on unexpected server errors
 */
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: recieverId } = req.params;
        const senderId = req.userId;

        // If an image URL was provided, pass it through directly.
        // (Upload handling / cloud storage is expected to happen client-side
        //  before this endpoint is called.)
        let imageUrl;
        if (image) {
            imageUrl = image;
        }

        // Create and save the message document
        const newMessage = new Message({
            senderId,
            recieverId,
            text,
            image: imageUrl,
        });
        await newMessage.save();

        // Attempt real-time delivery to the recipient's active socket
        const receiverSocketId = getReceiverSocketId(recieverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendMessage controller", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
