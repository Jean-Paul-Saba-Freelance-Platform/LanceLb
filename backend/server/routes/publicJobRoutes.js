import express from 'express';
import { getPublicJobs } from '../controllers/jobController.js';

const router = express.Router();

router.get('/', getPublicJobs);

export default router;
