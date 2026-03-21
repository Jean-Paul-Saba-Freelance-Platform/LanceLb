import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", userAuth, getNotifications);
router.patch("/read-all", userAuth, markAllRead);
router.patch("/:id/read", userAuth, markRead);
router.delete("/:id", userAuth, deleteNotification);

export default router;
