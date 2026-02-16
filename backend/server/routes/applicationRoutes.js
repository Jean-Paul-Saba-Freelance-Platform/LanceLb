import express from 'express';
import {
    createApplication,
    getApplicationsByJobId,
    getApplicationsByFreelancerId,
    getApplicationById,
    updateApplicationStatus,
} from '../controllers/applicationController.js';
import userAuth from '../middleware/userAuth.js';

const applicationRouter = express.Router();

// All application routes require authentication
// POST /api/applications — Submit an application (freelancer)
applicationRouter.post('/', userAuth, createApplication);

// GET /api/applications/mine — Get logged-in freelancer's applications
applicationRouter.get('/mine', userAuth, getApplicationsByFreelancerId);

// GET /api/applications/job/:jobId — Get all applications for a job (client)
applicationRouter.get('/job/:jobId', userAuth, getApplicationsByJobId);

// GET /api/applications/:id — Get a single application by ID
applicationRouter.get('/:id', userAuth, getApplicationById);

// PATCH /api/applications/:id/status — Update application status
applicationRouter.patch('/:id/status', userAuth, updateApplicationStatus);

export default applicationRouter;
