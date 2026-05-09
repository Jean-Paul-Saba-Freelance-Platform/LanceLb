import express from 'express';
import userAuth from '../middleware/userAuth.js';
import User from '../models/userModels.js';
import Job from '../models/jobModel.js';
import { analyzeProfileFit, generateApplicationTips, generateApplicationSuggestions, chatWithSupport } from '../services/aiService.js';

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

aiRouter.get('/application-tips/:jobId', userAuth, async (req, res) => {
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
        summary: 'Complete your profile first to get detailed AI coaching tips.',
        tips: [],
      });
    }

    const result = await generateApplicationTips(
      { title: user.title, bio: user.bio, skills: user.skills, experienceLevel: user.experienceLevel },
      job,
    );

    return res.json({
      success: true,
      profileComplete: true,
      summary: result.summary || '',
      tips: result.tips || [],
    });
  } catch (error) {
    console.error('AI application-tips error:', error);
    return res.status(500).json({ success: false, message: 'Error generating application tips' });
  }
});

aiRouter.post('/suggest-improvements/:jobId', userAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter, proposedBudget, proposedTimelineDays, answers } = req.body;

    const [user, job] = await Promise.all([
      User.findById(req.userId).select('skills bio experienceLevel title').lean(),
      Job.findById(jobId).lean(),
    ]);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const result = await generateApplicationSuggestions(
      { title: user.title, bio: user.bio, skills: user.skills, experienceLevel: user.experienceLevel },
      job,
      { coverLetter, proposedBudget, proposedTimelineDays, answers },
    );

    return res.json({ success: true, suggestions: result.suggestions });
  } catch (error) {
    console.error('AI suggest-improvements error:', error);
    return res.status(500).json({ success: false, message: 'Error generating suggestions' });
  }
});

aiRouter.post('/chat', async (req, res) => {
  try {
    const { message, history = [], mode = 'user', stats = null } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' })
    }

    const fullHistory = [...history, { role: 'user', content: message }].slice(-20)

    const reply = await chatWithSupport(fullHistory, mode, stats)

    return res.json({ success: true, reply })
  } catch (error) {
    console.error('AI chat error:', error)
    return res.status(500).json({ success: false, message: 'AI service error' })
  }
})

export default aiRouter;
