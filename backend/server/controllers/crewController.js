import mongoose from "mongoose";
import Crew from "../models/crewModel.js";
import CrewMessage from "../models/crewMessageModel.js";
import User from "../models/userModels.js";
import { getReceiverSocketId, io } from "../lib/realtime.js";

const normalizeId = (value) => String(value);

const ensureCrewMember = async (crewId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(crewId)) return null;
  return Crew.findOne({ _id: crewId, members: userId });
};

export const createCrew = async (req, res) => {
  try {
    const creatorId = req.userId;
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

    const uniqueMembers = Array.from(
      new Set([creatorId, ...memberIds].map(normalizeId).filter(Boolean))
    ).filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (uniqueMembers.length < 2) {
      return res
        .status(400)
        .json({ success: false, message: "Crew must include at least one additional member" });
    }

    const validUsers = await User.find({ _id: { $in: uniqueMembers } }).select("_id");
    const validUserIds = validUsers.map((u) => normalizeId(u._id));

    if (validUserIds.length < 2) {
      return res.status(400).json({ success: false, message: "No valid crew members found" });
    }

    const crew = await Crew.create({
      name,
      createdBy: creatorId,
      members: validUserIds,
    });

    const populatedCrew = await Crew.findById(crew._id)
      .populate("members", "name email profilePicture userType")
      .populate("createdBy", "name email");

    return res.status(201).json({ success: true, crew: populatedCrew });
  } catch (error) {
    console.log("Error in createCrew controller", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getMyCrews = async (req, res) => {
  try {
    const crews = await Crew.find({ members: req.userId })
      .populate("members", "name email profilePicture userType")
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1, createdAt: -1 });
    return res.status(200).json({ success: true, crews });
  } catch (error) {
    console.log("Error in getMyCrews controller", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getCrewMessages = async (req, res) => {
  try {
    const { crewId } = req.params;
    const crew = await ensureCrewMember(crewId, req.userId);
    if (!crew) {
      return res.status(404).json({ success: false, message: "Crew not found" });
    }

    const messages = await CrewMessage.find({ crewId }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.log("Error in getCrewMessages controller", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const addCrewMembers = async (req, res) => {
  try {
    const { crewId } = req.params;
    const crew = await Crew.findById(crewId);
    if (!crew) {
      return res.status(404).json({ success: false, message: "Crew not found" });
    }

    if (normalizeId(crew.createdBy) !== normalizeId(req.userId)) {
      return res.status(403).json({ success: false, message: "Only the crew owner can add members" });
    }

    const incomingIds = Array.isArray(req.body?.memberIds) ? req.body.memberIds : [];
    const validIncomingIds = Array.from(
      new Set(incomingIds.map(normalizeId).filter((id) => mongoose.Types.ObjectId.isValid(id)))
    );

    if (!validIncomingIds.length) {
      return res.status(400).json({ success: false, message: "No valid members provided" });
    }

    const existingMemberIds = new Set(crew.members.map((id) => normalizeId(id)));
    const uniqueNewIds = validIncomingIds.filter((id) => !existingMemberIds.has(id));
    if (!uniqueNewIds.length) {
      return res.status(400).json({ success: false, message: "Selected users are already in this crew" });
    }

    const users = await User.find({ _id: { $in: uniqueNewIds } }).select("_id");
    const foundIds = users.map((u) => normalizeId(u._id));
    if (!foundIds.length) {
      return res.status(400).json({ success: false, message: "No valid users found to add" });
    }

    await Crew.updateOne(
      { _id: crewId },
      { $addToSet: { members: { $each: foundIds } }, $set: { updatedAt: new Date() } }
    );

    const updatedCrew = await Crew.findById(crewId)
      .populate("members", "name email profilePicture userType")
      .populate("createdBy", "name email");

    const payload = { crew: updatedCrew };
    io.to(`crew:${normalizeId(crewId)}`).emit("crewUpdated", payload);
    updatedCrew.members.forEach((member) => {
      const memberId = member?._id || member;
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("crewUpdated", payload);
      }
    });

    return res.status(200).json({ success: true, crew: updatedCrew });
  } catch (error) {
    console.log("Error in addCrewMembers controller", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const sendCrewMessage = async (req, res) => {
  try {
    const { crewId } = req.params;
    const { text, image } = req.body || {};
    const crew = await ensureCrewMember(crewId, req.userId);
    if (!crew) {
      return res.status(404).json({ success: false, message: "Crew not found" });
    }

    const trimmedText = typeof text === "string" ? text.trim() : "";
    if (!trimmedText && !image) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    const message = await CrewMessage.create({
      crewId,
      senderId: req.userId,
      text: trimmedText,
      image: image || "",
    });

    await Crew.updateOne({ _id: crewId }, { $set: { updatedAt: new Date() } });

    const payload = { ...message.toObject(), crewId: normalizeId(crewId) };

    io.to(`crew:${normalizeId(crewId)}`).emit("newCrewMessage", payload);
    crew.members.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("newCrewMessage", payload);
      }
    });

    return res.status(201).json({ success: true, message: payload });
  } catch (error) {
    console.log("Error in sendCrewMessage controller", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
