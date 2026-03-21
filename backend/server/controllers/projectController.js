import mongoose from "mongoose";
import Project from "../models/projectModel.js";
import Job from "../models/jobModel.js";
import Application from "../models/applicationModel.js";
import Crew from "../models/crewModel.js";
import Notification from "../models/notificationModel.js";
import User from "../models/userModels.js";
import { io } from "../lib/realtime.js";

// ── POST /api/projects ── Create a new project (client only)
export const createProject = async (req, res) => {
  try {
    const clientId = req.userId;
    const { title, description, jobIds } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Project title is required" });
    }

    // Validate job slots provided
    const jobIdsArr = Array.isArray(jobIds) ? jobIds : [];
    if (!jobIdsArr.length) {
      return res.status(400).json({ success: false, message: "At least one job is required" });
    }

    // Build job slots from accepted applications
    const jobs = [];
    for (const jobId of jobIdsArr) {
      if (!mongoose.Types.ObjectId.isValid(jobId)) continue;

      const job = await Job.findOne({ _id: jobId, clientId });
      if (!job) continue;

      const acceptedApps = await Application.find({ jobId, status: "accepted" })
        .select("_id freelancerId");

      jobs.push({
        jobId: job._id,
        title: job.title,
        acceptedApplicationIds: acceptedApps.map((a) => a._id),
        freelancerIds: acceptedApps.map((a) => a.freelancerId),
      });
    }

    if (!jobs.length) {
      return res.status(400).json({ success: false, message: "No valid jobs with accepted applicants found" });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description?.trim() || "",
      clientId,
      jobs,
      status: "planning",
    });

    return res.status(201).json({ success: true, project });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/projects ── Get all projects for the logged-in user
export const getMyProjects = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("userType");

    let projects;
    if (user?.userType === "client") {
      projects = await Project.find({ clientId: userId })
        .populate("crewId", "name")
        .sort({ createdAt: -1 });
    } else {
      // Freelancer: find projects where they appear in any job slot's freelancerIds
      projects = await Project.find({ "jobs.freelancerIds": userId })
        .populate("clientId", "name email")
        .populate("crewId", "name")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/projects/:id ── Get a single project by ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid project ID" });
    }

    const project = await Project.findById(id)
      .populate("clientId", "name email profilePicture")
      .populate("jobs.freelancerIds", "name email profilePicture title")
      .populate("tasks.assignedTo", "name email profilePicture")
      .populate("crewId", "name");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Only client owner or a member freelancer can view
    const isClient = project.clientId._id.toString() === req.userId;
    const isFreelancer = project.jobs.some((j) =>
      j.freelancerIds.some((f) => f._id.toString() === req.userId)
    );

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PATCH /api/projects/:id ── Update project title / description / launchDate (client only)
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, launchDate } = req.body;

    const project = await Project.findOne({ _id: id, clientId: req.userId });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (title?.trim()) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();
    if (launchDate !== undefined) project.launchDate = launchDate ? new Date(launchDate) : null;

    await project.save();
    return res.status(200).json({ success: true, project });
  } catch (error) {
    console.error("Error updating project:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── POST /api/projects/:id/start ── Start the project (client only)
// Creates a crew channel named after the project, sets status to active
export const startProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({ _id: id, clientId: req.userId });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    if (project.status !== "planning") {
      return res.status(400).json({ success: false, message: "Project is already started or completed" });
    }

    // Gather all unique freelancer IDs across all job slots
    const allFreelancerIds = [
      ...new Set(
        project.jobs.flatMap((j) => j.freelancerIds.map((fid) => fid.toString()))
      ),
    ];

    const uniqueMembers = [req.userId, ...allFreelancerIds].filter(Boolean);

    // Create a crew / messaging channel for this project
    const crew = await Crew.create({
      name: project.title,
      createdBy: req.userId,
      members: uniqueMembers,
    });

    project.crewId = crew._id;
    project.status = "active";
    if (req.body.launchDate) project.launchDate = new Date(req.body.launchDate);
    await project.save();

    // Notify each freelancer that the project has started
    for (const freelancerId of allFreelancerIds) {
      const notif = await Notification.create({
        userId: freelancerId,
        type: "project_started",
        title: "Project started",
        message: `The project "${project.title}" has been started. A messaging channel has been created.`,
        relatedId: project._id,
        relatedType: "project",
      });

      io.to(`user:${freelancerId}`).emit("notification", notif.toObject());
    }

    // Notify all new crew members so their sidebar updates
    uniqueMembers.forEach((memberId) => {
      io.to(`user:${memberId}`).emit("crewUpdated", { crew });
    });

    const populatedProject = await Project.findById(project._id)
      .populate("clientId", "name email")
      .populate("jobs.freelancerIds", "name email profilePicture title")
      .populate("crewId", "name");

    return res.status(200).json({ success: true, project: populatedProject });
  } catch (error) {
    console.error("Error starting project:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── POST /api/projects/:id/tasks ── Add a task to the project (client only)
export const addTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, dueDate } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Task title is required" });
    }

    const project = await Project.findOne({ _id: id, clientId: req.userId });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const task = {
      title: title.trim(),
      description: description?.trim() || "",
      assignedTo: assignedTo || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    project.tasks.push(task);
    await project.save();

    const newTask = project.tasks[project.tasks.length - 1];

    // Notify assigned freelancer
    if (assignedTo) {
      const notif = await Notification.create({
        userId: assignedTo,
        type: "task_completed",
        title: "New task assigned",
        message: `You have been assigned a new task: "${task.title}" in project "${project.title}".`,
        relatedId: project._id,
        relatedType: "project",
      });
      io.to(`user:${assignedTo}`).emit("notification", notif.toObject());
    }

    return res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    console.error("Error adding task:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PATCH /api/projects/:id/tasks/:taskId ── Update task metadata (client only)
export const updateTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { title, description, assignedTo, dueDate } = req.body;

    const project = await Project.findOne({ _id: id, clientId: req.userId });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (title?.trim()) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;

    await project.save();
    return res.status(200).json({ success: true, task });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PATCH /api/projects/:id/tasks/:taskId/complete ── Freelancer marks task done
export const completeTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Must be an assigned freelancer on this project
    const isMember = project.jobs.some((j) =>
      j.freelancerIds.some((fid) => fid.toString() === req.userId)
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    task.completedByFreelancer = true;
    task.completedByFreelancerAt = new Date();
    await project.save();

    // Notify the client
    const freelancer = await User.findById(req.userId).select("name");
    const notif = await Notification.create({
      userId: project.clientId.toString(),
      type: "task_completed",
      title: "Task ready for review",
      message: `${freelancer?.name || "A freelancer"} marked "${task.title}" as done in "${project.title}". Please validate.`,
      relatedId: project._id,
      relatedType: "project",
    });
    io.to(`user:${project.clientId}`).emit("notification", notif.toObject());

    return res.status(200).json({ success: true, task });
  } catch (error) {
    console.error("Error completing task:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PATCH /api/projects/:id/tasks/:taskId/validate ── Client validates a completed task
export const validateTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;

    const project = await Project.findOne({ _id: id, clientId: req.userId });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (!task.completedByFreelancer) {
      return res.status(400).json({ success: false, message: "Task has not been marked complete by the freelancer yet" });
    }

    task.validatedByClient = true;
    task.validatedByClientAt = new Date();
    await project.save();

    // Notify the assigned freelancer
    if (task.assignedTo) {
      const notif = await Notification.create({
        userId: task.assignedTo.toString(),
        type: "task_validated",
        title: "Task validated",
        message: `Your task "${task.title}" in "${project.title}" has been validated by the client.`,
        relatedId: project._id,
        relatedType: "project",
      });
      io.to(`user:${task.assignedTo}`).emit("notification", notif.toObject());
    }

    return res.status(200).json({ success: true, task });
  } catch (error) {
    console.error("Error validating task:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
