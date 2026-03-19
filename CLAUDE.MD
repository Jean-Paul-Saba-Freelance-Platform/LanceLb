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
├── CLAUDE.md               
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
--color-border:      #2a3942;   /* subtle borders */
--color-text:        #e9edef;   /* primary text */
--color-text-muted:  #8696a0;   /* secondary/muted text */
--color-success:     #10b981;   /* green */
--color-warning:     #fbbf24;   /* yellow */
--color-danger:      #f87171;   /* red */
```

### Design Rules
- Dark teal aesthetic — ALL new pages must match existing dashboard look
- Card-based layouts with consistent padding (1.25rem – 1.5rem)
- Subtle borders, no harsh dividers
- Framer Motion for page entry animations (fade + slide up, ~0.3s)
- Hover states on all interactive elements
- Loading states on every async action (spinner or skeleton)
- Empty states handled — never show a blank white area
- Mobile responsive — use CSS Grid / Flexbox, no fixed widths

### Typography
- Match existing app — clean, readable
- Headings: font-weight 700, slightly larger line-height
- Body: font-weight 400–500
- Muted labels: font-size 0.82rem, color var(--color-text-muted)
- NEVER use Inter, Roboto, Arial as explicit font choices

### Component Patterns
- Buttons: teal background (#00a884), white text, border-radius 8px, hover darken
- Badges/pills: small, rounded-full, color-coded by status
- Cards: background var(--color-card), border 1px solid var(--color-border), border-radius 12px
- Inputs: dark background, teal focus ring, consistent height

---

## Current Work — Active Branch: feature/admin-dashboard

### Task Checklist
- [x] Add isAdmin to userModels.js
- [x] Set isAdmin: true on Saba's Atlas document
- [x] Create git branch feature/admin-dashboard
- [ ] backend/middleware/adminAuth.js
- [ ] backend/controllers/adminController.js
- [ ] backend/routes/adminRoutes.js
- [ ] Wire app.use('/api/admin', adminRoutes) in app.js
- [ ] Test all 4 endpoints with Postman
- [ ] frontend/src/pages/AdminDashboard.jsx
- [ ] Add /admin route in React Router

### Admin Endpoints to Build
- GET /api/admin/stats           — KPI counts (users, jobs, applications, projects)
- GET /api/admin/user-growth     — users registered per month (last 6 months)
- GET /api/admin/job-categories  — top skills/categories from job postings
- GET /api/admin/top-freelancers — top 5 freelancers by accepted applications

### Admin Dashboard UI to Build
- 4 KPI stat cards: Total Freelancers, Total Clients, Active Jobs, Total Applications
- User growth chart (bar or line, last 6 months)
- Top skills bar chart (from job requiredSkills)
- Top freelancers table (rank, name, email, hired count)
- All data pulled live from MongoDB aggregations

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
