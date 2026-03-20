import express from "express";
import {userAuth,isVerified} from "../middleware/userAuth.js";
import {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  startProject,
  addTask,
  updateTask,
  completeTask,
  validateTask,
} from "../controllers/projectController.js";

const router = express.Router();

router.post("/", userAuth, isVerified, createProject);
router.get("/", userAuth, isVerified, getMyProjects);
router.get("/:id", userAuth, isVerified, getProjectById);
router.patch("/:id", userAuth, isVerified, updateProject);
router.post("/:id/start", userAuth, isVerified, startProject);
router.post("/:id/tasks", userAuth, isVerified, addTask);
router.patch("/:id/tasks/:taskId", userAuth, isVerified, updateTask);
router.patch("/:id/tasks/:taskId/complete", userAuth, isVerified, completeTask);
router.patch("/:id/tasks/:taskId/validate", userAuth, isVerified, validateTask);

export default router;
