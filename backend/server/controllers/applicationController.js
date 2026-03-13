import Application from '../models/applicationModel.js';
import Job from '../models/jobModel.js';
import User from '../models/userModels.js';
import { scoreApplication } from '../services/aiService.js';
import Notification from '../models/notificationModel.js';
import { io } from '../lib/realtime.js';

// ── POST /api/applications ── Submit a new application (freelancer only)
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
            atsScore,
            atsGrade,
            atsCategory,
            atsConfidence,
            atsBreakdown,
            atsFeedback,
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
            clientId: job.clientId,
            freelancerId,
            coverLetter: coverLetter?.trim(),
            proposedBudget: proposedBudget != null ? Number(proposedBudget) : undefined,
            proposedTimelineDays: proposedTimelineDays != null ? Number(proposedTimelineDays) : undefined,
            answers: cleanedAnswers,
            status: 'pending',
            viewedByClient: false,
            // ATS fields — only stored if the freelancer uploaded a CV
            ...(atsScore != null && {
                atsScore:      Number(atsScore),
                atsGrade:      atsGrade || undefined,
                atsCategory:   atsCategory || undefined,
                atsConfidence: atsConfidence != null ? Number(atsConfidence) : undefined,
                atsBreakdown:  atsBreakdown || undefined,
                atsFeedback:   Array.isArray(atsFeedback) ? atsFeedback : [],
            }),
        });

        // Run AI scoring in the background (don't block the response)
        (async () => {
            try {
                const freelancer = await User.findById(freelancerId).select('skills bio experienceLevel title');
                const aiResult = await scoreApplication(
                    application,
                    job,
                    { title: freelancer?.title, bio: freelancer?.bio, skills: freelancer?.skills, experienceLevel: freelancer?.experienceLevel },
                );
                if (aiResult.score != null) {
                    await Application.findByIdAndUpdate(application._id, {
                        aiScore: aiResult.score,
                        aiStrengths: aiResult.strengths || [],
                        aiWeaknesses: aiResult.weaknesses || [],
                    });
                }
            } catch (aiErr) {
                console.error('Background AI scoring failed:', aiErr.message);
            }
        })();

        return res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application,
        });
    } catch (error) {
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

// ── GET /api/applications/job/:jobId ── Get all applications for a job (client only)
export const getApplicationsByJobId = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Verify the job exists and belongs to the logged-in client
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        // Only the job owner can view applications
        if (job.clientId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view these applications',
            });
        }

        const applications = await Application.find({ jobId })
            .populate('freelancerId', 'name email skills title experienceLevel')
            .sort({ aiScore: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: applications.length,
            applications,
        });
    } catch (error) {
        console.error('Error fetching applications by job:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching applications',
        });
    }
};

// ── GET /api/applications/mine ── Get all applications by the logged-in freelancer
export const getApplicationsByFreelancerId = async (req, res) => {
    try {
        // Use the authenticated user's ID from the auth middleware
        const freelancerId = req.userId;

        // Fetch all applications by this freelancer, populate job info
        const applications = await Application.find({ freelancerId })
            .populate('jobId', 'title status budget paymentType')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: applications.length,
            applications,
        });
    } catch (error) {
        console.error('Error fetching freelancer applications:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching your applications',
        });
    }
};

// ── GET /api/applications/:id ── Get a single application by its ID
export const getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the application and populate both job and freelancer details
        const application = await Application.findById(id)
            .populate('jobId', 'title status budget paymentType clientId')
            .populate('freelancerId', 'name email');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Only the freelancer who applied or the job owner can view it
        const isFreelancer = application.freelancerId._id.toString() === req.userId;
        const isClient = application.clientId.toString() === req.userId;

        if (!isFreelancer && !isClient) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this application',
            });
        }

        return res.status(200).json({
            success: true,
            application,
        });
    } catch (error) {
        console.error('Error fetching application:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching application',
        });
    }
};

// ── PATCH /api/applications/:id/status ── Update application status (client only)
export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, statusMessage } = req.body;

        // Validate the new status value
        const validStatuses = ['pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(', ')}`,
            });
        }

        // Find the application
        const application = await Application.findById(id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Only the job owner (client) can change status, except "withdrawn" which the freelancer can set
        const isClient = application.clientId.toString() === req.userId;
        const isFreelancer = application.freelancerId.toString() === req.userId;

        if (status === 'withdrawn' && !isFreelancer) {
            return res.status(403).json({
                success: false,
                message: 'Only the applicant can withdraw their application',
            });
        }

        if (status !== 'withdrawn' && !isClient) {
            return res.status(403).json({
                success: false,
                message: 'Only the job owner can update application status',
            });
        }

        // Save statusMessage when client accepts or rejects
        application.status = status;
        if ((status === 'accepted' || status === 'rejected') && statusMessage?.trim()) {
            application.statusMessage = statusMessage.trim();
        }
        await application.save();

        // Fire real-time notification to the freelancer on accept/reject
        if (status === 'accepted' || status === 'rejected') {
            const job = await Job.findById(application.jobId).select('title');
            const notifType = status === 'accepted' ? 'application_accepted' : 'application_rejected';
            const notifTitle = status === 'accepted' ? 'Application accepted!' : 'Application rejected';
            const defaultMsg = status === 'accepted'
                ? `Congratulations! Your application for "${job?.title || 'a job'}" has been accepted.`
                : `Your application for "${job?.title || 'a job'}" was not selected at this time.`;

            const notif = await Notification.create({
                userId: application.freelancerId,
                type: notifType,
                title: notifTitle,
                message: application.statusMessage || defaultMsg,
                relatedId: application._id,
                relatedType: 'application',
            });

            io.to(`user:${application.freelancerId}`).emit('notification', notif.toObject());
        }

        return res.status(200).json({
            success: true,
            message: `Application status updated to "${status}"`,
            application,
        });
    } catch (error) {
        console.error('Error updating application status:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating application status',
        });
    }
};
