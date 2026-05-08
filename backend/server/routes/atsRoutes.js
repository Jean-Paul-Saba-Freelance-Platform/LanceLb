import express from 'express';
import multer from 'multer';
import userAuth from '../middleware/userAuth.js';
import { evaluateResumeWithFlask, checkFlaskHealth } from '../services/atsService.js';
import { cvUpload, cloudinary } from '../config/cloudinary.js';

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

// POST /api/ats/evaluate-and-upload
// Uploads the CV PDF to Cloudinary (raw) and scores it via Flask.
// Returns both cvUrl (Cloudinary URL) and all ATS score fields.
// Called by the frontend when the freelancer picks a file in the apply modal.
atsRouter.post('/evaluate-and-upload', userAuth, (req, res, next) => {
  cvUpload.single('resume')(req, res, async (err) => {
    if (err) {
      console.error('CV Cloudinary upload error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
      }

      // req.file.path is the Cloudinary URL (from multer-storage-cloudinary)
      const cvUrl = req.file.path;

      // Download the file buffer from Cloudinary for Flask scoring.
      // multer-storage-cloudinary does not expose the buffer directly,
      // so we fetch the raw bytes using node-fetch from the Cloudinary URL.
      const fetch = (await import('node-fetch')).default;
      const fileRes = await fetch(cvUrl);
      if (!fileRes.ok) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve uploaded CV for scoring.' });
      }
      const arrayBuffer = await fileRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Score via Flask using the existing base64 transport
      const atsResult = await evaluateResumeWithFlask(buffer, req.file.originalname);

      return res.status(200).json({
        success: true,
        cvUrl,
        ...atsResult,
      });
    } catch (error) {
      console.error('evaluate-and-upload error:', error.message);
      return res.status(500).json({ success: false, message: error.message || 'CV upload and scoring failed.' });
    }
  });
});

export default atsRouter;
