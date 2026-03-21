import express from "express";
import {userAuth,isVerified} from "../middleware/userAuth.js";
import {
  addCrewMembers,
  createCrew,
  getCrewMessages,
  getMyCrews,
  sendCrewMessage,
} from "../controllers/crewController.js";

const crewRouter = express.Router();

crewRouter.get("/", userAuth, isVerified, getMyCrews);
crewRouter.post("/", userAuth, isVerified, createCrew);
crewRouter.post("/:crewId/members", userAuth, isVerified, addCrewMembers);
crewRouter.get("/:crewId/messages", userAuth, isVerified, getCrewMessages);
crewRouter.post("/:crewId/messages", userAuth, isVerified, sendCrewMessage);

export default crewRouter;
