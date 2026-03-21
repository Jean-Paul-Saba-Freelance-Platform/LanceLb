import express from 'express'
import {userAuth,isVerified} from '../middleware/userAuth.js';
import { getUserSideBar, getMessages, sendMessage } from '../controllers/messageController.js';

const messageRouter = express.Router();

messageRouter.get("/user", userAuth, isVerified, getUserSideBar);
messageRouter.get("/:id", userAuth, isVerified, getMessages);
messageRouter.post("/send/:id", userAuth, isVerified, sendMessage);

export default messageRouter;