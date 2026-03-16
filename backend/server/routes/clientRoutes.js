/**
 * Client Routes
 * ------------------------------------------------------------
 * This router handles all endpoints related to CLIENT users.
 *
 * Mounted in server.js as:
 *   app.use("/api/client", clientRoutes);
 *
 * So every route here automatically starts with:
 *   /api/client/...
 */

import express from 'express';

// Controller that handles client dashboard logic
import { getDashboardSummary, getClientStats } from '../controllers/clientController.js';

// Authentication middleware
// Protects routes by verifying JWT and setting req.userId
import userAuth from '../middleware/userAuth.js';

// Job routes (nested router for job-related functionality)
import jobRoutes from './jobRoutes.js';

// Create a new Express router instance
const clientRouter = express.Router();

/**
 * ------------------------------------------------------------
 * Dashboard Routes
 * ------------------------------------------------------------
 */

/**
 * GET /api/client/dashboard/summary
 *
 * Protected route.
 * Requires authentication (userAuth).
 * Returns summary information for the logged-in client dashboard.
 */
clientRouter.get(
    '/dashboard/summary',
    userAuth,
    getDashboardSummary
);

/**
 * ------------------------------------------------------------
 * Job Routes (Nested)
 * ------------------------------------------------------------
 *
 * All routes defined inside jobRoutes.js will now be prefixed with:
 *   /api/client/jobs
 *
 * Example:
 *   jobRouter.post("/") becomes:
 *   POST /api/client/jobs
 */
clientRouter.use('/jobs', jobRoutes);

clientRouter.get('/stats', userAuth, getClientStats);

// Export router to be mounted in server.js
export default clientRouter;
