/**
 * Job Controller — Handles all CRUD operations for Job postings.
 *
 * Every handler expects the Express (req, res) signature and uses
 * async/await with try/catch so that an unhandled promise rejection
 * never crashes the server.
 *
 * Auth-protected routes rely on the `userAuth` middleware having already
 * run, which decodes the JWT and sets `req.userId` to the authenticated
 * user's ObjectId string.
 *
 * Response contract:
 *   Success → { success: true, message?, data }
 *   Failure → { success: false, message, error? }
 */

import mongoose from 'mongoose';
import Job from '../models/jobModel.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * isValidObjectId — Thin wrapper around mongoose.Types.ObjectId.isValid().
 * Returns true only when the string is a proper 24-hex-char ObjectId.
 * Used to guard params before hitting the database and to return a
 * friendly 400 instead of a cryptic CastError.
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ---------------------------------------------------------------------------
// POST  /api/jobs  —  Create a new job posting
// ---------------------------------------------------------------------------

/**
 * createJob
 *
 * Expects `userAuth` middleware to have run first (sets req.userId).
 * Reads job fields from req.body, validates the essentials, then
 * persists a new Job document with clientId set to the authenticated user.
 *
 * @returns 201 with the created job on success
 * @returns 400 if required fields are missing or Mongoose validation fails
 * @returns 500 on unexpected server errors
 */
export const createJob = async (req, res) => {
    try {
        // --- 1. Identify the authenticated client -------------------------
        const clientId = req.userId;

        // --- 2. Destructure allowed fields from the request body ----------
        const {
            title,
            description,
            requiredSkills,
            budget: rawBudget,
            experienceLevel,
            // Scope fields (Step 4)
            projectSize,
            duration,
            contractToHire,
            // Budget fields (Step 5)
            paymentType,
            hourlyMin,
            hourlyMax,
            fixedBudget,
            // status is intentionally omitted here — new jobs should always
            // start as "open" (the schema default). Accepting status from the
            // body would let a client create a job that's already "closed".
        } = req.body;

        // --- 3. Manual pre-validation for the most common mistakes --------
        //     Mongoose would catch these too, but returning a single clear
        //     message is friendlier than a Mongoose ValidationError dump.

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Title is required',
            });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Description is required',
            });
        }

        // Scope validations
        if (!projectSize) {
            return res.status(400).json({
                success: false,
                message: 'Project size is required',
            });
        }
        if (!duration) {
            return res.status(400).json({
                success: false,
                message: 'Duration is required',
            });
        }
        if (contractToHire === undefined || contractToHire === null) {
            return res.status(400).json({
                success: false,
                message: 'Contract-to-hire preference is required',
            });
        }

        // Payment type & conditional budget validation
        if (!paymentType) {
            return res.status(400).json({
                success: false,
                message: 'Payment type is required',
            });
        }

        if (paymentType === 'hourly') {
            if (!hourlyMin || hourlyMin <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Hourly minimum rate is required and must be > 0',
                });
            }
            if (!hourlyMax || hourlyMax <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Hourly maximum rate is required and must be > 0',
                });
            }
            if (hourlyMin > hourlyMax) {
                return res.status(400).json({
                    success: false,
                    message: 'Hourly minimum cannot exceed hourly maximum',
                });
            }
        }

        if (paymentType === 'fixed') {
            if (!fixedBudget || fixedBudget <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Fixed budget is required and must be > 0',
                });
            }
        }

        // --- 4. Compute the canonical budget number -----------------------
        //     The "budget" field is a single Number used for sorting and
        //     filtering. If the client didn't send it explicitly, derive it
        //     from the payment-type-specific inputs.
        let budget = rawBudget;
        if (budget === undefined || budget === null) {
            budget = paymentType === 'fixed'
                ? Number(fixedBudget)
                : Number(hourlyMin);
        }

        if (typeof budget !== 'number' || isNaN(budget) || budget < 0) {
            return res.status(400).json({
                success: false,
                message: 'Budget must be a non-negative number',
            });
        }

        // --- 5. Create the job document -----------------------------------
        const job = await Job.create({
            clientId,
            title,
            description,
            requiredSkills,
            budget,
            experienceLevel,
            // Scope
            projectSize,
            duration,
            contractToHire: contractToHire === true || contractToHire === 'yes',
            // Budget details
            paymentType,
            hourlyMin: paymentType === 'hourly' ? Number(hourlyMin) : undefined,
            hourlyMax: paymentType === 'hourly' ? Number(hourlyMax) : undefined,
            fixedBudget: paymentType === 'fixed' ? Number(fixedBudget) : undefined,
            // status defaults to "open" via the schema
        });

        // --- 6. Respond with the newly created job ------------------------
        return res.status(201).json({
            success: true,
            message: 'Job created successfully',
            job,
        });
    } catch (error) {
        console.error('Error creating job:', error);

        // Mongoose validation errors (e.g. minlength, enum mismatch)
        // carry a .name of 'ValidationError'. Surface them as 400s with
        // the first validation message for clarity.
        if (error.name === 'ValidationError') {
            const firstMessage = Object.values(error.errors)
                .map((e) => e.message)
                .join('. ');
            return res.status(400).json({
                success: false,
                message: firstMessage,
            });
        }

        // Pre-validate hook errors come through as plain Error objects
        // with a message but no .errors map. Surface them as 400s too.
        if (error.message && !error.errors) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error while creating job',
        });
    }
};

// ---------------------------------------------------------------------------
// GET  /api/jobs/:id  —  Fetch a single job by its ID
// ---------------------------------------------------------------------------

/**
 * getJobById
 *
 * Public route (no auth required) that returns a single job document.
 * The clientId field is populated with safe User fields (name, email)
 * so the frontend can display who posted the job.
 *
 * @returns 200 with the job on success
 * @returns 400 if the id param is not a valid ObjectId
 * @returns 404 if no job matches
 * @returns 500 on unexpected server errors
 */
export const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        // --- 1. Validate ObjectId format before querying ------------------
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid job ID format',
            });
        }

        // --- 2. Find the job and populate client info ---------------------
        //     We select only name and email from the User document so that
        //     sensitive fields (password, OTPs, etc.) are never leaked.
        const job = await Job.findById(id).populate('clientId', 'name email');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        // --- 3. Return the job --------------------------------------------
        return res.status(200).json({
            success: true,
            job,
        });
    } catch (error) {
        console.error('Error fetching job by ID:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching job',
        });
    }
};

// ---------------------------------------------------------------------------
// GET  /api/jobs  —  List open jobs (public browse / search)
// ---------------------------------------------------------------------------

/**
 * getOpenJobs
 *
 * Public route that returns all jobs with status "open", newest first.
 *
 * Supports optional query-string filters:
 *   ?search=react         → full-text search on title/description
 *   ?skills=React,Node    → jobs that require ALL listed skills
 *   ?experienceLevel=expert → filter by experience tier
 *
 * Text search uses the text index defined in the Job schema.  If the
 * $text operator fails (e.g. index not yet built) we fall back to a
 * case-insensitive regex match on the title field so the endpoint
 * never breaks.
 *
 * @returns 200 with an array of matching jobs (may be empty)
 * @returns 500 on unexpected server errors
 */
export const getOpenJobs = async (req, res) => {
    try {
        const { search, skills, experienceLevel } = req.query;

        // --- 1. Build the base filter: only open jobs ---------------------
        const filter = { status: 'open' };

        // --- 2. Keyword search --------------------------------------------
        if (search && search.trim()) {
            try {
                // Attempt $text search first (uses the text index on
                // title + description for relevance-ranked results).
                filter.$text = { $search: search.trim() };

                // Quick probe — if the text index doesn't exist yet,
                // MongoDB will throw here and we fall into the catch.
                await Job.findOne(filter).limit(1);
            } catch {
                // Fallback: case-insensitive regex on title.
                // Less performant but always works.
                delete filter.$text;
                filter.title = { $regex: search.trim(), $options: 'i' };
            }
        }

        // --- 3. Skills filter ---------------------------------------------
        //     Expects a comma-separated string, e.g. "React,Node.js".
        //     Uses $all so the job must list every requested skill.
        if (skills && skills.trim()) {
            const skillsArray = skills
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

            if (skillsArray.length > 0) {
                filter.requiredSkills = { $all: skillsArray };
            }
        }

        // --- 4. Experience level filter -----------------------------------
        if (experienceLevel && experienceLevel.trim()) {
            filter.experienceLevel = experienceLevel.trim();
        }

        // --- 5. Execute the query -----------------------------------------
        //     Sort by newest first (createdAt descending).
        //     Populate client info with safe fields only.
        const jobs = await Job.find(filter)
            .sort({ createdAt: -1 })
            .populate('clientId', 'name email');

        return res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });
    } catch (error) {
        console.error('Error fetching open jobs:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching jobs',
        });
    }
};

// ---------------------------------------------------------------------------
// GET  /api/jobs/client  —  List jobs for the authenticated client
// ---------------------------------------------------------------------------

/**
 * getClientJobs
 *
 * Auth-protected route that returns every job created by the logged-in
 * user, sorted newest first.  Useful for a "My Jobs" dashboard page.
 *
 * @returns 200 with an array of the client's jobs
 * @returns 500 on unexpected server errors
 */
export const getClientJobs = async (req, res) => {
    try {
        // --- 1. Read the authenticated user's ID --------------------------
        const clientId = req.userId;

        // --- 2. Fetch all jobs belonging to this client -------------------
        const jobs = await Job.find({ clientId }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });
    } catch (error) {
        console.error('Error fetching client jobs:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching your jobs',
        });
    }
};
