/**
 * Job Routes — Defines all endpoints for Job postings.
 *
 * Mounted inside clientRoutes at "/jobs", so the final URLs are:
 *   GET    /api/client/jobs           → getClientJobs    (auth required)
 *   POST   /api/client/jobs           → createJob        (auth required)
 *   PATCH  /api/client/jobs/:jobId    → updateClientJob  (auth required)
 *   DELETE /api/client/jobs/:jobId    → deleteClientJob  (auth required)
 *   GET    /api/client/jobs/open      → getOpenJobs      (public)
 *   GET    /api/client/jobs/mine      → getClientJobs    (auth required, legacy)
 *   GET    /api/client/jobs/:id       → getJobById       (public)
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
    updateClientJob,
    deleteClientJob,
} from '../controllers/jobController.js';
import {userAuth,isVerified} from '../middleware/userAuth.js';

const jobRouter = express.Router();

// --- Public routes --------------------------------------------------------

jobRouter.get('/open', getOpenJobs);

// --- Protected routes (require authentication) ----------------------------

jobRouter.get('/mine', userAuth, isVerified, getClientJobs);
jobRouter.get('/', userAuth, isVerified, getClientJobs);
jobRouter.post('/', userAuth, isVerified, createJob);
jobRouter.patch('/:jobId', userAuth, isVerified, updateClientJob);
jobRouter.delete('/:jobId', userAuth, isVerified, deleteClientJob);

// --- Public parameterised route (must come AFTER static segments) ---------

jobRouter.get('/:id', getJobById);

export default jobRouter;
