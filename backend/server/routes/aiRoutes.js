import express from 'express';
import userAuth from '../middleware/userAuth.js';
import User from '../models/userModels.js';
import Job from '../models/jobModel.js';
import { analyzeProfileFit } from '../services/aiService.js';

const aiRouter = express.Router();

aiRouter.get('/fit-score/:jobId', userAuth, async (req, res) => {
  try {
    const { jobId } = req.params;

    const [user, job] = await Promise.all([
      User.findById(req.userId).select('skills bio experienceLevel title'),
      Job.findById(jobId),
    ]);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const profileComplete = !!(user.skills?.length || user.bio || user.title);

    if (!profileComplete) {
      return res.json({
        success: true,
        profileComplete: false,
        fitScore: null,
        strengths: [],
        improvements: ['Complete your profile (skills, bio, title) for an accurate AI fit score.'],
      });
    }

    const result = await analyzeProfileFit(
      { title: user.title, bio: user.bio, skills: user.skills, experienceLevel: user.experienceLevel },
      job,
    );

    return res.json({
      success: true,
      profileComplete: true,
      fitScore: result.score,
      strengths: result.strengths || [],
      improvements: result.improvements || [],
    });
  } catch (error) {
    console.error('AI fit-score error:', error);
    return res.status(500).json({ success: false, message: 'Error generating fit score' });
  }
});

export default aiRouter;
