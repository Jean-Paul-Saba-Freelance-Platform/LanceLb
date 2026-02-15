import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import gigRouter from "./routes/gigRoutes.js";
import webhookRouter from "./routes/webhookRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.join(__dirname, ".env") });
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
}

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI in .env");
  process.exit(1);
}

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));
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
app.use("/api/gigs", gigRouter);
app.use("/api/webhooks", webhookRouter); // optional
app.use("/api/client", clientRoutes);

// Start
connectDB();
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
