import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  addCrewMembers,
  createCrew,
  getCrewMessages,
  getMyCrews,
  sendCrewMessage,
} from "../controllers/crewController.js";

const crewRouter = express.Router();

crewRouter.get("/", userAuth, getMyCrews);
crewRouter.post("/", userAuth, createCrew);
crewRouter.post("/:crewId/members", userAuth, addCrewMembers);
crewRouter.get("/:crewId/messages", userAuth, getCrewMessages);
crewRouter.post("/:crewId/messages", userAuth, sendCrewMessage);

export default crewRouter;
