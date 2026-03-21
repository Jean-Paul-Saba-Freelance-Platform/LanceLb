import express from "express";
import multer from "multer";
import { evaluateResumeWithFlask, checkFlaskHealth } from "../services/atsService.js";
import userAuth from "../middleware/userAuth.js";

const atsRouter  = express.Router();

// Store PDF in memory — no disk writes
const upload = multer({
  storage : multer.memoryStorage(),
  limits  : { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted."), false);
    }
  },
});

// ── POST /api/ats/evaluate ────────────────────────────────────
// Protected: only logged-in freelancers can evaluate their resume
atsRouter.post(
  "/evaluate",
  userAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      // Multer file filter error
      if (!req.file) {
        return res.status(400).json({
          success : false,
          message : "No PDF file uploaded.",
        });
      }

      const result = await evaluateResumeWithFlask(
        req.file.buffer,
        req.file.originalname
      );

      return res.status(200).json({
        success : true,
        data    : result,
      });

    } catch (err) {
      console.error("ATS evaluation error:", err.message);
      return res.status(500).json({
        success : false,
        message : err.message || "Internal server error.",
      });
    }
  }
);

// ── GET /api/ats/health ───────────────────────────────────────
// Check if Flask microservice is running
atsRouter.get("/health", async (req, res) => {
  try {
    const isHealthy = await checkFlaskHealth();
    return res.status(isHealthy ? 200 : 503).json({
      success : isHealthy,
      message : isHealthy ? "ATS service is running." : "ATS service is down.",
    });
  } catch (err) {
    return res.status(503).json({
      success : false,
      message : "ATS service unreachable.",
    });
  }
});

export default atsRouter;