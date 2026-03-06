
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

// The model we're using: Meta's Llama 3.3 70B hosted on Groq.
// This is a powerful open-source model available on Groq's free tier.
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Sends a prompt to the AI model and returns a parsed JSON response.
 * Uses the chat completions API with a system + user message pattern.
 *
 * @param {string} systemPrompt - Sets the AI's role/behavior (stays constant)
 * @param {string} userPrompt   - The actual analysis request with job/profile data
 * @param {number} retries      - How many times to retry on rate limit (429) errors
 * @returns {Object}            - Parsed JSON object from the AI's response
 *
 * The response_format: { type: 'json_object' } tells the model to
 * strictly return valid JSON, preventing markdown or extra text.
 * Temperature 0.3 keeps outputs consistent and deterministic — higher
 * values (closer to 1) would make responses more random/creative.
 */
async function chatJSON(systemPrompt, userPrompt, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },  // Defines the AI's persona
          { role: 'user', content: userPrompt },       // Our actual question/data
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      // The AI's reply is in response.choices[0].message.content as a string.
      // We parse it into a JS object since we requested JSON format.
      
        const raw = response.choices[0].message.content;
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error(`AI returned invalid JSON: ${raw?.slice(0, 100)}`);
      }
    } catch (error) {
      // If we hit a rate limit (HTTP 429), wait and retry instead of failing.
      // Groq's free tier has request-per-minute limits, so this handles bursts.
      const isRateLimit = error.status === 429 || error.message?.includes('429');
      if (isRateLimit && i < retries) {
        const waitMs = (i + 1) * 5000; // 5s first retry, 10s second retry
        console.log(`Rate limited, retrying in ${waitMs / 1000}s...`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      throw error; // Non-retryable error or out of retries — let caller handle it
    }
  }
  throw new Error('chatJSON: exhausted retries without returning');
}

/**
 * Converts a job document from MongoDB into a human-readable text summary
 * that the AI can understand. Only includes fields that have values,
 * so the AI doesn't see "undefined" for optional fields.
 */
function buildJobSummary(job) {
  const lines = [`Title: ${job.title}`];
  if (job.description) lines.push(`Description: ${job.description}`);
  if (job.requiredSkills?.length) lines.push(`Required skills: ${job.requiredSkills.join(', ')}`);
  if (job.experienceLevel) lines.push(`Experience level: ${job.experienceLevel}`);
  if (job.projectSize) lines.push(`Project size: ${job.projectSize}`);
  if (job.duration) lines.push(`Duration: ${job.duration}`);
  if (job.paymentType === 'hourly') {
    lines.push(`Budget: $${job.hourlyMin}–$${job.hourlyMax}/hr (hourly)`);
  } else if (job.paymentType === 'fixed') {
    lines.push(`Budget: $${job.fixedBudget} (fixed)`);
  }
  return lines.join('\n');
}

/**
 * Converts a freelancer's profile data into a readable text summary.
 * If the freelancer hasn't filled in their profile yet, returns a
 * fallback message so the AI knows there's no data to work with.
 */
function buildProfileSummary(profile) {
  const lines = [];
  if (profile.title) lines.push(`Professional title: ${profile.title}`);
  if (profile.bio) lines.push(`Bio: ${profile.bio}`);
  if (profile.skills?.length) lines.push(`Skills: ${profile.skills.join(', ')}`);
  if (profile.experienceLevel) lines.push(`Experience level: ${profile.experienceLevel}`);
  return lines.length ? lines.join('\n') : 'No profile information provided.';
}

// This system prompt is sent with every request. It tells the AI who it is
// and how to behave. Critically, it enforces JSON-only output to prevent
// the model from wrapping responses in markdown code blocks.
const SYSTEM_PROMPT = `You are an AI hiring assistant for a freelance marketplace. You analyze freelancer profiles and applications against job postings. Always respond with valid JSON only, no markdown or extra text.`;

// ─────────────────────────────────────────────────────────
//  FUNCTION 1: Profile Fit Analysis (pre-application)
// ─────────────────────────────────────────────────────────
//
// Called when a freelancer opens the "Apply" modal on a job.
// Compares ONLY their profile (skills, bio, experience, title)
// against the job requirements — no application data yet.
//
// Used to show the freelancer a "fit score" before they apply,
// so they know how competitive they'd be for this job.
//
// Returns: { score: 0-100, strengths: [...], improvements: [...] }

export async function analyzeProfileFit(freelancerProfile, jobData) {
  // Build the prompt by injecting the job and profile data.
  // The scoring criteria and output format are defined inline
  // so the AI knows exactly what to evaluate and how to respond.
  const userPrompt = `Analyze how well this freelancer's profile matches the job posting.

## Job Posting
${buildJobSummary(jobData)}

## Freelancer Profile
${buildProfileSummary(freelancerProfile)}

## Scoring Criteria
- Skills match (50% weight): How many of the required skills does the freelancer have?
- Experience alignment (30% weight): Does the freelancer's experience level match what's needed?
- Profile completeness (20% weight): Does the freelancer have a bio, title, and skills listed?

Respond with JSON in this exact format:
{"score": <number 0-100>, "strengths": [<1-3 short strings>], "improvements": [<1-3 short strings>]}`;

  try {
    const result = await chatJSON(SYSTEM_PROMPT, userPrompt);
    if (typeof result.score !== 'number' || !Array.isArray(result.strengths) || !Array.isArray(result.improvements)) {
      console.error('AI returned unexpected shape:', result);
      return { score: null, strengths: [], improvements: ['AI analysis unavailable'] };
    }
    return result;
  } catch (error) {
    console.error('AI analyzeProfileFit error:', error.message);
    return { score: null, strengths: [], improvements: ['AI analysis unavailable'] };
  }
}

// ─────────────────────────────────────────────────────────
//  FUNCTION 2: Full Application Scoring (post-submission)
// ─────────────────────────────────────────────────────────
//
// Called in the background after a freelancer submits an application.
// This is a more comprehensive analysis than analyzeProfileFit because
// it also evaluates the cover letter, screening answers, and proposed
// budget/timeline — not just the profile.
//
// The score is stored on the Application document (aiScore, aiStrengths,
// aiWeaknesses) and shown to the client on the applications page.
// Applications are sorted by aiScore so clients see top candidates first.
//
// Returns: { score: 0-100, strengths: [...], weaknesses: [...] }
//learn how the scoring works in the prompt below, then implement the function to send the right data and return the AI's response.

export async function scoreApplication(application, jobData, freelancerProfile) {
  // Format the screening question answers into a readable Q&A format
  const answersSummary = application.answers?.length
    ? application.answers.map(a => `Q: ${a.questionText}\nA: ${a.value}`).join('\n\n')
    : 'No screening answers provided.';

  // Format budget and timeline info (both are optional fields)
  const budgetInfo = [];
  if (application.proposedBudget != null) budgetInfo.push(`Proposed budget: $${application.proposedBudget}`);
  if (application.proposedTimelineDays != null) budgetInfo.push(`Proposed timeline: ${application.proposedTimelineDays} days`);

  // The prompt includes all data the AI needs: job details, freelancer
  // profile, cover letter, budget, and screening answers. The weighted
  // scoring criteria ensure consistent evaluation across all applications.
  const userPrompt = `Score this job application comprehensively.

## Job Posting
${buildJobSummary(jobData)}

## Freelancer Profile
${buildProfileSummary(freelancerProfile)}

## Application Details
Cover letter: ${application.coverLetter || 'Not provided'}

${budgetInfo.length ? budgetInfo.join('\n') : 'No budget/timeline proposed.'}

Screening answers:
${answersSummary}

## Scoring Criteria (weighted)
- Skills match (40%): How well do the freelancer's skills align with required skills?
- Experience alignment (20%): Does experience level match the job requirements?
- Cover letter quality (20%): Is the cover letter relevant, specific, and well-written?
- Budget/timeline fit (10%): Is the proposed budget reasonable for the job scope?
- Screening answer quality (10%): Are answers thoughtful and complete?

Respond with JSON in this exact format:
{"score": <number 0-100>, "strengths": [<2-4 short strings>], "weaknesses": [<1-3 short strings>]}`;

  try {
    return await chatJSON(SYSTEM_PROMPT, userPrompt);
  } catch (error) {
    console.error('AI scoreApplication error:', error.message);
    // Return safe fallback — the application is already saved,
    // so AI failure just means the score will be null (shown as "pending" in UI)
    return { score: null, strengths: [], weaknesses: ['AI scoring unavailable'] };
  }
}

// ─────────────────────────────────────────────────────────
//  FUNCTION 3: Detailed Application Tips (on-demand)
// ─────────────────────────────────────────────────────────
//
// Called only when the freelancer clicks the "Get AI Tips" button
// in the apply modal. This keeps default loading fast and only
// spends AI tokens when the user explicitly asks for coaching.
//
// Returns:
// {
//   summary: string,
//   tips: [{ title: string, details: string, example: string }]
// }
export async function generateApplicationTips(freelancerProfile, jobData) {
  const userPrompt = `You are coaching a freelancer before they apply to a job.

## Job Posting
${buildJobSummary(jobData)}

## Freelancer Profile
${buildProfileSummary(freelancerProfile)}

Give practical, detailed tips to improve their application quality.
Each tip must be specific and directly tied to this job.

Respond with JSON in this exact format:
{
  "summary": "<1-2 sentence overall coaching summary>",
  "tips": [
    {
      "title": "<short tip title>",
      "details": "<2-4 sentence actionable guidance>",
      "example": "<one concrete example sentence they can copy/adapt>"
    }
  ]
}

Rules:
- Return exactly 3 to 5 tips.
- Focus on cover letter, evidence of skills, screening answers, budget/timeline positioning.
- Avoid generic advice like "be professional".`;

  try {
    const result = await chatJSON(SYSTEM_PROMPT, userPrompt);
    return {
      summary: result.summary || '',
      tips: Array.isArray(result.tips) ? result.tips : [],
    };
  } catch (error) {
    console.error('AI generateApplicationTips error:', error.message);
    return {
      summary: 'AI tips are temporarily unavailable.',
      tips: [],
    };
  }
}
