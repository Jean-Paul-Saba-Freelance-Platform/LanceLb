// Backend server for Freelance Project
import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./server/routes/authRoutes.js"
import clientRoutes from "./server/routes/clientRoutes.js"
import publicJobRoutes from "./server/routes/publicJobRoutes.js"


dotenv.config()

const app = express()

// Enable CORS for frontend (allow requests from Vite dev server)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

// Enable JSON body parsing for POST requests
app.use(express.json())

console.log("Backend server starting...")

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err))

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running and connected to MongoDB!")
})

// Mount auth routes at /api/auth
app.use("/api/auth", authRoutes)

// Mount client routes at /api/client
app.use("/api/client", clientRoutes)

// Mount public job routes at /api/jobs
app.use("/api/jobs", publicJobRoutes)

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

