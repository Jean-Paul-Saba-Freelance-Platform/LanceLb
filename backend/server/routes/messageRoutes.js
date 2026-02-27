import express from 'express'
import userAuth from '../middleware/userAuth.js';
import { getUserSideBar, getMessages, sendMessage } from '../controllers/messageController.js';

const messageRouter = express.Router();

messageRouter.get("/user", userAuth, getUserSideBar);
messageRouter.get("/:id", userAuth, getMessages);
messageRouter.post("/send/:id", userAuth, sendMessage);

export default messageRouter;