import Application from '../models/applicationModel.js';
import Job from '../models/jobModel.js';

export const createApplication = async (req, res) => {
    try {
        // Get the freelancer's ID from the auth middleware
        const freelancerId = req.userId;

        // Destructure all expected fields from the request body
        const {
            jobId,
            coverLetter,
            proposedBudget,
            proposedTimelineDays,
            answers,
        } = req.body;

        // Validate that a job ID was provided
        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: 'Job ID is required',
            });
        }

        // Fetch the job from the database to verify it exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        // Only allow applications to jobs that are still open
        if (job.status !== 'open') {
            return res.status(400).json({
                success: false,
                message: 'Job is not open for applications',
            });
        }

        // Check if this freelancer has already applied to this job
        const existingApplication = await Application.findOne({
            jobId,
            freelancerId,
        });
        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job',
            });
        }

        // Sanitize answers: only keep entries that have both questionId and a value
        const cleanedAnswers = Array.isArray(answers)
            ? answers.filter(a => a.questionId && a.value !== undefined)
            : [];

        // Create the application document
        const application = await Application.create({
            jobId,
            clientId: job.clientId, // copy the job owner's ID from the job
            freelancerId,
            coverLetter: coverLetter?.trim(),
            proposedBudget: proposedBudget != null ? Number(proposedBudget) : undefined,
            proposedTimelineDays: proposedTimelineDays != null ? Number(proposedTimelineDays) : undefined,
            answers: cleanedAnswers,
            status: 'pending',
            viewedByClient: false,
        });

        // Return the newly created application
        return res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application,
        });
    } catch (error) {
        // Handle duplicate application error from the unique index
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job',
            });
        }

        console.error('Error creating application:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while submitting application',
        });
    }
};
