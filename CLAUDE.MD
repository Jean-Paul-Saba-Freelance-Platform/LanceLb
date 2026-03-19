# LanceLB — Claude Code Context File
# CSC 490 | NDU Lebanon | Senior Project 2026
# Team: Saba Arab (20227179) & Jean Paul Tabet (20227035)
# Advisor: Nazir Hawi | Deadline: April 20–30, 2026

---

## Project Overview

LanceLB is a Lebanese-focused freelance marketplace (like Fiverr/Upwork) built as a full-stack
senior project. Two user types: Clients (post jobs, hire talent) and Freelancers (apply, deliver
work, build reputation). The professor's top priorities are: AI features and the Admin Dashboard.

---

## Monorepo Structure

```
FreelanceProject/
├── CLAUDE.md               ← you are here
├── backend/
│   ├── controllers/        — business logic (auth, job, application, client, message, crew, project, admin)
│   ├── middleware/         — userAuth.js, adminAuth.js
│   ├── models/             — Mongoose schemas
│   ├── routes/             — Express routers
│   ├── config/             — mongodb.js, nodemailer.js, realtime.js
│   └── app.js / server.js  — entry point, mounts all routes
└── frontend/
    ├── src/
    │   ├── components/     — shared UI components
    │   ├── pages/          — route-level page components
    │   └── lib/            — helpers, theme, utils
    └── index.html
```

---

## Tech Stack

### Backend
- Node.js + Express 5
- MongoDB Atlas + Mongoose — database name: "test" on Cluster0
- JWT authentication — httpOnly cookie + Authorization Bearer header fallback
- Socket.io — real-time messaging
- Nodemailer + Brevo SMTP — transactional email
- ES Modules throughout (import/export) — NEVER use require()

### Frontend
- React 19 + Vite
- React Router DOM 7
- Tailwind CSS 4 + DaisyUI
- Framer Motion — animations and transitions

### AI Microservice (Python — separate service)
- Python 3 + Flask
- Groq — LLM inference provider
- Endpoints:
  - POST /ats/evaluate       — PDF CV upload → ATS score
  - GET  /ai/fit-score/:id   — freelancer profile fit analysis for a job
  - GET  /ai/application-tips/:id — coaching tips for applying to a job

---

## Key Mongoose Models

### User (models/userModels.js)
- name, email, password (bcrypt)
- userType: 'client' | 'freelancer'
- isAdmin: Boolean (default false) — manually set in Atlas for admin accounts
- isAccountVerified: Boolean
- skills: [String]
- bio: String (max 1000)
- title: String (max 120)
- experienceLevel: 'entry' | 'intermediate' | 'expert'
- profilePicture: String

### Job (models/jobModel.js)
- clientId: ObjectId → User
- title, description, requiredSkills: [String]
- budget, paymentType: 'hourly' | 'fixed'
- hourlyMin, hourlyMax, fixedBudget
- projectSize: 'small' | 'medium' | 'large'
- duration: '1_to_3_months' | '3_to_6_months' | 'more_than_6_months'
- experienceLevel: 'entry' | 'intermediate' | 'expert'
- status: 'open' | 'in_progress' | 'closed' (default: 'open')
- timestamps: createdAt, updatedAt

### Application (models/applicationModel.js)
- jobId: ObjectId → Job
- freelancerId: ObjectId → User
- clientId: ObjectId → User
- coverLetter, proposedBudget, proposedTimelineDays
- answers: [{ questionId, questionText, value }]
- status: 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn'
- aiScore: Number (0–100), aiStrengths: [String], aiWeaknesses: [String]
- atsScore: Number, atsGrade: String, atsCategory: String, atsConfidence: Number
- atsBreakdown: Mixed, atsFeedback: [String]
- statusMessage: String
- timestamps: createdAt, updatedAt

### Project (models/projectModel.js)
- title, description
- clientId: ObjectId → User
- jobs: [{ title, freelancerIds }]
- tasks: [{ title, description, assignedTo, dueDate, completedByFreelancer, validatedByClient }]
- status: 'planning' | 'active' | 'completed'
- timestamps: createdAt, updatedAt

---

## Authentication Pattern

```javascript
// Token location (checked in this order):
// 1. req.cookies.token         — httpOnly cookie set on login
// 2. req.headers.authorization — "Bearer <token>" fallback

// Standard auth middleware — sets req.userId
import userAuth from '../middleware/userAuth.js'

// Admin auth middleware — checks user.isAdmin === true
import adminAuth from '../middleware/adminAuth.js'
```

JWT payload contains: `{ userId: user._id }`
JWT secret: `process.env.JWT_SECRET`

---

## API Route Patterns

```
POST /api/auth/*              — register, login, verify-otp, reset-password
GET  /api/jobs                — public job listings
GET|POST /api/client/*        — client CRUD (protected)
GET|POST /api/applications/*  — create, list, update status (protected)
GET  /api/ai/fit-score/:id    — LLM profile fit analysis (protected)
GET  /api/ai/application-tips/:id — LLM coaching tips (protected)
POST /api/ats/evaluate        — PDF upload → ATS score
GET|POST /api/message         — direct messages (protected)
GET|POST /api/crew            — group/team chats (protected)
GET  /api/admin/*             — admin only, protected by adminAuth middleware
```

---

## Code Style Rules — ALWAYS FOLLOW THESE

1. **ES Modules only** — `import/export`, never `require()`
2. **Async/await only** — never `.then()` chains
3. **Always try/catch** in every route handler and controller function
4. **Always return `{ success: true/false, ... }`** JSON shape from all API endpoints
5. **Comments on every function** — explain what it does in 1 line above it
6. **No magic strings** — use constants or enums for repeated values
7. **Mongoose queries** — always use `.lean()` for read-only queries (performance)
8. **Error responses** — always include `message: error.message` in catch blocks

### Example correct pattern:
```javascript
export const getStats = async (req, res) => {
  try {
    const count = await User.countDocuments({ userType: 'freelancer' }).lean()
    return res.json({ success: true, count })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
```

---

## Frontend Design System — ALWAYS MATCH THIS

### Colors (use CSS variables, never hardcode)
```css
--color-primary:     #00a884;   /* teal — main brand color */
--color-bg:          #111B21;   /* darkest background */
--color-card:        #1b2730;   /* card/panel background */
--color-sidebar:     #0d1418;   /* sidebar background */
--color-border:      #2a3942;   /* subtle borders */
--color-text:        #e9edef;   /* primary text */
--color-text-muted:  #8696a0;   /* secondary/muted text */
--color-success:     #10b981;   /* green */
--color-warning:     #fbbf24;   /* yellow */
--color-danger:      #f87171;   /* red */
```

### Component Patterns
- Buttons: teal background (#00a884), white text, border-radius 8px, hover darken
- Badges/pills: small, rounded-full, color-coded by status
- Cards: background #1b2730, border 1px solid #2a3942, border-radius 12px, padding 1.25–1.5rem
- Inputs: dark background, teal focus ring, consistent height
- Sidebars: background #0d1418, border-right 1px solid #2a3942, fixed 220px wide

---

## Frontend Design Skill — ALWAYS FOLLOW WHEN BUILDING UI

Invoke this skill on every component, page, or interface. Think before coding:

### Design Thinking Process
1. **Purpose** — What problem does this screen solve? Who uses it?
2. **Tone** — LanceLB tone: refined dark luxury, professional, trustworthy
3. **Differentiation** — What makes this screen memorable, not generic?

### Aesthetic Rules
- Commit fully to the dark teal direction — no deviating for "variety"
- Unexpected layouts beat predictable grid clones — use asymmetry, overlap, diagonal flow where appropriate
- Atmosphere over flat color — subtle gradients, layered transparencies, gentle shadows create depth
- One well-orchestrated page load animation beats scattered micro-interactions

### Typography Rules
- NEVER use Inter, Roboto, Arial, or system-ui as explicit font choices on new pages
- Pair a distinctive display font with a refined body font for new pages
- Headings: font-weight 700, tight letter-spacing (-0.01em to -0.02em)
- Muted labels: 0.82rem, color #8696a0
- Body: 0.875rem–0.95rem, font-weight 400–500

### Motion Rules
- Framer Motion for page-level entry (fade + slide up, ~0.3s, staggered)
- CSS transitions for hover states, bar widths, progress bars (0.15s–0.6s ease)
- Hover states on ALL interactive elements — no static buttons or cards ever

### Layout Rules
- Card-based, consistent padding (1.25rem–1.5rem)
- Generous negative space — never crowd elements
- CSS Grid + Flexbox only — never fixed pixel widths
- Always handle: loading state (spinner/skeleton), empty state (icon + message), error state

### Never Do
- Purple gradients on white backgrounds
- Cookie-cutter AI component patterns
- Placeholder "coming soon" UI unless explicitly told
- Inline style overrides when a CSS variable exists
- Emojis as functional UI elements
- Anything that looks like it came from a UI kit without customization

---

## Current Work — Merged to Main ✅

### Completed This Session (March 19, 2026)
- [x] Add isAdmin to userModels.js
- [x] Set isAdmin: true on Saba's Atlas document
- [x] backend/middleware/adminAuth.js
- [x] backend/controllers/adminController.js (4 MongoDB aggregation endpoints)
- [x] backend/routes/adminRoutes.js
- [x] Wire app.use('/api/admin', adminRoutes) in server.js
- [x] Tested all 4 endpoints with Postman — real data confirmed
- [x] frontend/pages/AdminDashboard.jsx — full UI with sidebar
- [x] frontend/pages/AdminDashboard.css
- [x] /admin route wired in App.jsx
- [x] Merged to main, conflicts resolved

### Next Tasks (Week of March 19–26)
- [ ] Fix ATS score bubble in FreelancerProposalsPage ← NEXT
- [ ] AI Job Matching — wire Best Matches tab to Flask/Groq endpoint
- [ ] Fix broken nav links (Find Work, Deliver Work)
- [ ] Landing page below the fold content
- [ ] Stats & Trends — connect to real backend data
- [ ] Start project report sections

### Admin Dashboard — DONE ✅
All 4 endpoints live and tested:
- GET /api/admin/stats           — { totalFreelancers:14, totalClients:3, activeJobs:7, totalJobs:7, totalApplications:15, totalProjects:2, hiredApplications:5 }
- GET /api/admin/user-growth     — last 6 months signup aggregation
- GET /api/admin/job-categories  — top skills: MongoDB, Node.js, React, Python...
- GET /api/admin/top-freelancers — Jean-Paul Tabet #1 (2 hires)

---

## Screenshot Workflow — Visual UI Testing

Puppeteer is installed at the project root. Use this to visually test and iterate on UI.

### Setup Files (already created)
- `screenshot.mjs` — Puppeteer script at project root
- `.screenshot-auth.json` — JWT token + user info (gitignored, never commit)
- `screenshots/` folder — auto-created on first run (gitignored)

### How to Take a Screenshot
Make sure frontend (`npm run dev`) and backend (`node server.js`) are both running first.

```bash
# From project root
node screenshot.mjs http://localhost:5173/admin admin
node screenshot.mjs http://localhost:5173/freelancer/home freelancer-home
node screenshot.mjs http://localhost:5173/ landing
```

Screenshots saved to `./screenshots/screenshot-N-label.png` (auto-incremented).

### Auth File Format (.screenshot-auth.json)
```json
{
  "token": "JWT_TOKEN_FROM_LOCALSTORAGE",
  "user": {
    "name": "Saba Arab",
    "email": "sabagarab69@gmail.com",
    "userType": "client"
  }
}
```
Token expires — if screenshot shows login page, get a fresh token from browser localStorage.

### Claude Code Visual Iteration Loop
When asked to improve UI, Claude Code should:
1. Run `node screenshot.mjs <url> <label>` to capture current state
2. Read the screenshot image to analyze the UI
3. Make code changes
4. Screenshot again to verify
5. Repeat until satisfied — minimum 2 comparison rounds
6. Stop only when no visible issues remain

### Puppeteer & Chrome Cache Paths (this machine)
- Puppeteer installed at: `C:/Users/FreelanceProj/FreelanceProject/node_modules/puppeteer`
- Chrome executable: `C:\Users\soup\.cache\puppeteer\chrome\win64-146.0.7680.76\chrome-win64\chrome.exe`
- If Puppeteer can't find Chrome, pass it explicitly:
```javascript
const browser = await puppeteer.launch({
  executablePath: 'C:\\Users\\soup\\.cache\\puppeteer\\chrome\\win64-146.0.7680.76\\chrome-win64\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
})
```

### Viewport
Default: 1440x900 (desktop). Full page screenshot always.

---

## Known Issues & Flags (do not fix unless explicitly asked)
- ATS score bubble broken in FreelancerProposalsPage — score not rendering from API response
- Find Work nav link not wired up on freelancer side
- Deliver Work page not implemented
- Landing page below the fold is thin/empty
- Stats & Trends page shows all zeros — not connected to real backend data
- Right sidebar widgets on freelancer home are all placeholder UI

---

## Professor's Priority Focus (grading criteria)
1. AI features working — ATS CV rating + Job matching/recommendations
2. Admin dashboard with real KPI statistics from MongoDB
3. Complete, polished, working product end-to-end
