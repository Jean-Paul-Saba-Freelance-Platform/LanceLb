import express from "express";
import userAuth from "../middleware/userAuth.js";
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

router.post("/", userAuth, createProject);
router.get("/", userAuth, getMyProjects);
router.get("/:id", userAuth, getProjectById);
router.patch("/:id", userAuth, updateProject);
router.post("/:id/start", userAuth, startProject);
router.post("/:id/tasks", userAuth, addTask);
router.patch("/:id/tasks/:taskId", userAuth, updateTask);
router.patch("/:id/tasks/:taskId/complete", userAuth, completeTask);
router.patch("/:id/tasks/:taskId/validate", userAuth, validateTask);

export default router;
