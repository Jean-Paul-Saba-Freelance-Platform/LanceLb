import express from 'express';
import { getDashboardSummary } from '../controllers/clientController.js';
import userAuth from '../middleware/userAuth.js';

const clientRouter = express.Router();

// All client routes require authentication
// GET /api/client/dashboard/summary - Get client dashboard summary
clientRouter.get('/dashboard/summary', userAuth, getDashboardSummary);

export default clientRouter;
