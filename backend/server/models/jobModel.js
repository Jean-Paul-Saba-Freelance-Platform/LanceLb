/**
 * Job Model — Represents a job posting created by a client on the Freelance Platform.
 *
 * Each job belongs to a single client (referenced via clientId → User),
 * describes the work needed, the skills required, the budget, and
 * the experience level expected from applicants.
 *
 * Timestamps (createdAt, updatedAt) are managed automatically by Mongoose
 * so we never have to set them manually and they stay consistent.
 */

import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Schema Definition
// ---------------------------------------------------------------------------

const jobSchema = new mongoose.Schema(
    {
        /**
         * clientId — The user who created / owns this job posting.
         * Stored as a Mongoose ObjectId and references the "User" collection,
         * enabling .populate('clientId') to pull in full user details.
         * Required because every job must have an owner.
         */
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'A job must belong to a client (clientId is required)'],
            index: true, // standalone index for quick lookups by client
        },

        /**
         * title — Short, descriptive headline for the job.
         * Trimmed to strip leading/trailing whitespace.
         * Length constrained (5–120 chars) so listings stay readable in search
         * results and cards on the frontend.
         */
        title: {
            type: String,
            required: [true, 'Job title is required'],
            trim: true,
            minlength: [5, 'Job title must be at least 5 characters'],
            maxlength: [120, 'Job title must be at most 120 characters'],
        },

        /**
         * description — Full details of the job: scope, deliverables,
         * timeline expectations, etc.
         * Trimmed and length-constrained (20–5000 chars) to ensure clients
         * provide enough detail for freelancers to make informed proposals.
         */
        description: {
            type: String,
            required: [true, 'Job description is required'],
            trim: true,
            minlength: [20, 'Job description must be at least 20 characters'],
            maxlength: [5000, 'Job description must be at most 5000 characters'],
        },

        /**
         * requiredSkills — Tags that describe the competencies needed
         * (e.g. ["React", "Node.js", "MongoDB"]).
         * Each entry is trimmed. A custom validator caps the array at 30
         * items to prevent abuse / unreasonably long lists.
         * Defaults to an empty array when no skills are specified.
         */
        requiredSkills: {
            type: [
                {
                    type: String,
                    trim: true,
                },
            ],
            default: [],
            validate: {
                validator: function (arr) {
                    return arr.length <= 30;
                },
                message: 'You can specify at most 30 required skills',
            },
        },

        /**
         * budget — The total budget (in the platform's base currency) the
         * client is willing to pay for this job.
         * Required so freelancers always know compensation up-front.
         * min: 0 prevents negative values (a budget of 0 is technically
         * allowed for volunteer / open-source listings).
         */
        budget: {
            type: Number,
            required: [true, 'Budget is required'],
            min: [0, 'Budget cannot be negative'],
        },

        /**
         * experienceLevel — Indicates the seniority / skill tier the client
         * expects from applicants.
         * Restricted to a fixed set of values via enum so the frontend can
         * reliably filter and display badges.
         * Defaults to "entry" when not explicitly provided.
         */
        experienceLevel: {
            type: String,
            enum: {
                values: ['entry', 'intermediate', 'expert'],
                message: '{VALUE} is not a valid experience level',
            },
            default: 'entry',
        },

        // -------------------------------------------------------------------
        // Scope fields — collected in the wizard's "Scope" step (Step 4).
        // These help match the job to the right talent pool.
        // -------------------------------------------------------------------

        /**
         * projectSize — Rough magnitude of the work.
         * "small" = quick task, "medium" = defined project, "large" = complex.
         */
        projectSize: {
            type: String,
            enum: {
                values: ['small', 'medium', 'large'],
                message: '{VALUE} is not a valid project size',
            },
            required: [true, 'Project size is required'],
        },

        /**
         * duration — Expected calendar length of the engagement.
         */
        duration: {
            type: String,
            enum: {
                values: ['1_to_3_months', '3_to_6_months', 'more_than_6_months'],
                message: '{VALUE} is not a valid duration',
            },
            required: [true, 'Duration is required'],
        },

        /**
         * contractToHire — Whether the client may convert the freelancer
         * to a full-time employee after the contract.
         */
        contractToHire: {
            type: Boolean,
            default: false,
            required: [true, 'Contract-to-hire preference is required'],
        },

        // -------------------------------------------------------------------
        // Budget fields — collected in the wizard's "Budget" step (Step 5).
        // -------------------------------------------------------------------

        /**
         * paymentType — Whether the client pays hourly or a fixed total.
         * Determines which of the sub-fields (hourly range vs fixed) apply.
         */
        paymentType: {
            type: String,
            enum: {
                values: ['hourly', 'fixed'],
                message: '{VALUE} is not a valid payment type',
            },
            required: [true, 'Payment type is required'],
        },

        /**
         * hourlyMin / hourlyMax — The acceptable hourly rate range.
         * Only meaningful when paymentType === "hourly".
         * A custom pre-validate hook enforces min <= max.
         */
        hourlyMin: {
            type: Number,
            min: [0, 'Hourly minimum cannot be negative'],
        },

        hourlyMax: {
            type: Number,
            min: [0, 'Hourly maximum cannot be negative'],
        },

        /**
         * fixedBudget — The total project price.
         * Only meaningful when paymentType === "fixed".
         */
        fixedBudget: {
            type: Number,
            min: [0, 'Fixed budget cannot be negative'],
        },

        /**
         * status — Tracks the lifecycle of a job posting:
         *   "open"        → accepting proposals
         *   "in_progress" → a freelancer has been hired, work is underway
         *   "closed"      → job completed or cancelled
         * Defaults to "open" since every new listing starts accepting proposals.
         * Indexed separately for fast filtering (e.g. show only open jobs).
         */
        status: {
            type: String,
            enum: {
                values: ['open', 'closed', 'in_progress'],
                message: '{VALUE} is not a valid job status',
            },
            default: 'open',
            index: true,
        },
    },
    {
        /**
         * timestamps — Tells Mongoose to automatically manage createdAt and
         * updatedAt fields on every document.  This is preferred over a manual
         * createdAt field because Mongoose handles the date logic atomically
         * and also gives us updatedAt for free.
         */
        timestamps: true,
    }
);

// ---------------------------------------------------------------------------
// Pre-validate Hook — Conditional budget validation
// ---------------------------------------------------------------------------

/**
 * When paymentType is "hourly", hourlyMin and hourlyMax are required and
 * min must not exceed max.  When "fixed", fixedBudget is required.
 * This runs before Mongoose's built-in validators so we can surface a
 * single clear error message instead of a generic "required" dump.
 */
jobSchema.pre('validate', function () {
    // Mongoose 9+ no longer passes a `next` callback to pre hooks.
    // To abort validation, throw an Error. To proceed, simply return.

    // Only enforce budget sub-field rules when paymentType is set.
    if (!this.paymentType) return;

    if (this.paymentType === 'hourly') {
        if (this.hourlyMin == null || this.hourlyMax == null) {
            throw new Error('Hourly rate requires both hourlyMin and hourlyMax');
        }
        if (this.hourlyMin <= 0 || this.hourlyMax <= 0) {
            throw new Error('Hourly rates must be greater than 0');
        }
        if (this.hourlyMin > this.hourlyMax) {
            throw new Error('hourlyMin cannot be greater than hourlyMax');
        }
        // Auto-fill the canonical budget if the caller didn't provide one
        if (this.budget == null) this.budget = this.hourlyMin;
    }

    if (this.paymentType === 'fixed') {
        if (this.fixedBudget == null || this.fixedBudget <= 0) {
            throw new Error('Fixed budget is required and must be greater than 0');
        }
        // Auto-fill the canonical budget if the caller didn't provide one
        if (this.budget == null) this.budget = this.fixedBudget;
    }
});


// ---------------------------------------------------------------------------
// Compound Indexes
// ---------------------------------------------------------------------------

/**
 * Compound index on { clientId, createdAt } (descending).
 * Optimises the common query "get all jobs for a given client, newest first".
 * Since clientId already has a standalone index above, this compound index
 * covers both single-field and multi-field queries efficiently.
 */
jobSchema.index({ clientId: 1, createdAt: -1 });

/**
 * Text index on title and description.
 * Enables MongoDB's $text search operator so users can perform keyword
 * searches across job listings (e.g. db.jobs.find({ $text: { $search: "react developer" } })).
 * Weights make title matches rank higher than description matches.
 *
 * NOTE: Only ONE text index per collection is allowed in MongoDB.  If another
 * text index already exists on this collection it will need to be dropped first.
 */
jobSchema.index(
    { title: 'text', description: 'text' },
    { weights: { title: 3, description: 1 }, name: 'job_text_search' }
);

// ---------------------------------------------------------------------------
// JSON / Object Transform
// ---------------------------------------------------------------------------

/**
 * toJSON transform — Customises the output whenever a Job document is
 * serialised to JSON (e.g. in res.json()).
 *   • Renames _id → id for a cleaner, more frontend-friendly API.
 *   • Removes the Mongoose version key (__v) which is an internal detail
 *     that consumers of the API don't need.
 */
jobSchema.set('toJSON', {
    virtuals: true,
    transform: function (_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

/**
 * isOpen — Convenience virtual that returns true when the job is still
 * accepting proposals.  Useful in templates / conditional logic so callers
 * don't have to hard-code status string checks everywhere.
 */
jobSchema.virtual('isOpen').get(function () {
    return this.status === 'open';
});

// ---------------------------------------------------------------------------
// Model Export
// ---------------------------------------------------------------------------

const Job = mongoose.model('Job', jobSchema);

export default Job;
