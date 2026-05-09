import "./env.js";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import webhookRouter from "./routes/webhookRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import publicJobRoutes from "./routes/publicJobRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import messageRouter from './routes/messageRoutes.js'
import crewRouter from "./routes/crewRoutes.js";
import { app, server } from "./lib/realtime.js";


import notificationRouter from "./routes/notificationRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import freelancerRouter from "./routes/freelancerRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import atsRouter from "./routes/atsRoutes.js";
import publicStatsRouter from "./routes/publicStatsRoutes.js";
import followRouter from "./routes/followRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import userRouter from "./routes/userRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";



const PORT = process.env.PORT || 4000;

if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI in .env");
  process.exit(1);
}

app.use(
  cors({
    // Explicitly reflect request Origin in development.
    // This guarantees Access-Control-Allow-Origin is present on preflight + actual responses.
    origin: (origin, callback) => {
      if (process.env.NODE_ENV === "production") {
        callback(null, process.env.FRONTEND_URL || false);
        return;
      }
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, origin);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Debug logs (disable in production + avoid logging secrets)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.method === "POST") {
      const safeBody = { ...req.body };
      if (safeBody.password) safeBody.password = "[REDACTED]";
      if (safeBody.otp) safeBody.otp = "[REDACTED]";
      console.log("Body:", safeBody);
    }
    next();
  });
}

// Routes
app.get("/", (req, res) => res.send("Working"));
app.use("/api/auth", authRouter);
app.use("/api/webhooks", webhookRouter); // optional
app.use("/api/client", clientRoutes);
app.use("/api/jobs", publicJobRoutes);
app.use("/api/applications", applicationRouter);
app.use("/api/admin", adminRouter);
app.use("/api/ai", aiRouter);
app.use("/api/message", messageRouter);
app.use("/api/crew", crewRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/projects", projectRouter);
app.use("/api/freelancer", freelancerRouter);
app.use("/api/public", publicStatsRouter);
app.use("/api/follow", followRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/user", userRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/ats", atsRouter);

// Start — wait for DB before accepting requests
connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
});
