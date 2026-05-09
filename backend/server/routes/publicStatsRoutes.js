import express from 'express';
import { getPublicStats, getFeaturedFreelancers } from '../controllers/jobController.js';

const router = express.Router();

router.get('/stats', getPublicStats);
router.get('/featured-freelancers', getFeaturedFreelancers);

export default router;
