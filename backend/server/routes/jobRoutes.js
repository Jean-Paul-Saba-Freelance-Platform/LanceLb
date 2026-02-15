/**
 * Job Routes — Defines all endpoints for Job postings.
 *
 * Mounted inside clientRoutes at "/jobs", so the final URLs are:
 *   POST   /api/client/jobs        → createJob   (auth required)
 *   GET    /api/client/jobs/open   → getOpenJobs  (public)
 *   GET    /api/client/jobs/mine   → getClientJobs (auth required)
 *   GET    /api/client/jobs/:id    → getJobById   (public)
 *
 * IMPORTANT: Static segments (/open, /mine) are defined before the
 * dynamic parameter (/:id) so Express matches them first and doesn't
 * treat "open" or "mine" as an :id value.
 */

import express from 'express';
import {
    createJob,
    getJobById,
    getOpenJobs,
    getClientJobs,
} from '../controllers/jobController.js';
import userAuth from '../middleware/userAuth.js';

const jobRouter = express.Router();

// --- Public routes --------------------------------------------------------

// GET /open — Browse all open jobs (supports ?search, ?skills, ?experienceLevel)
jobRouter.get('/open', getOpenJobs);

// --- Protected routes (require authentication) ----------------------------

// GET /mine — List jobs created by the logged-in client
jobRouter.get('/mine', userAuth, getClientJobs);

// POST / — Create a new job posting
jobRouter.post('/', userAuth, createJob);

// --- Public parameterised route (must come AFTER static segments) ---------

// GET /:id — Fetch a single job by its ObjectId
jobRouter.get('/:id', getJobById);

export default jobRouter;
