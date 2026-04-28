import express from 'express';
import multer from 'multer';
import userAuth from '../middleware/userAuth.js';
import { evaluateResumeWithFlask, checkFlaskHealth } from '../services/atsService.js';

const atsRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are supported.'));
        }
        cb(null, true);
    },
});

// POST /api/ats/evaluate — evaluate a resume PDF against a job
atsRouter.post('/evaluate', userAuth, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
        }

        const result = await evaluateResumeWithFlask(req.file.buffer, req.file.originalname);

        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error('ATS evaluate error:', error.message);
        return res.status(500).json({ success: false, message: error.message || 'ATS evaluation failed.' });
    }
});

// GET /api/ats/health — check if Flask service is up
atsRouter.get('/health', async (req, res) => {
    try {
        const healthy = await checkFlaskHealth();
        return res.status(healthy ? 200 : 503).json({ available: healthy });
    } catch (error) {
        return res.status(503).json({ available: false, message: error.message });
    }
});

export default atsRouter;
