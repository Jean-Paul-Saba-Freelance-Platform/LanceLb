import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './server/models/userModels.js';
import Job from './server/models/jobModel.js';
import Application from './server/models/applicationModel.js';
import Project from './server/models/projectModel.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, 'server', '.env') });

// ── Users ────────────────────────────────────────────────────────────────────

const freelancerData = [
  {
    name: 'Jean Paul',
    email: 'jeanpaul@freelancer.com',
    password: '123456',
    userType: 'freelancer',
    title: 'Full Stack Developer',
    bio: 'Full stack developer with 3 years of experience building web applications. Specialized in React and Node.js, with a strong focus on clean code and performance. Available for both short and long-term projects.',
    skills: ['React', 'Node.js', 'MongoDB', 'Express', 'TypeScript', 'Tailwind CSS', 'Docker', 'Git', 'REST API'],
    experienceLevel: 'intermediate',
  },
  {
    name: 'Rami Khoury',
    email: 'rami.khoury@demo.com',
    password: 'Demo1234!',
    userType: 'freelancer',
    title: 'Full Stack Developer',
    bio: 'Passionate developer with 4 years of experience building web applications. Specialized in React and Node.js. I love turning complex problems into clean, elegant solutions.',
    skills: ['React', 'Node.js', 'MongoDB', 'Express', 'TypeScript', 'Tailwind CSS'],
    experienceLevel: 'intermediate',
  },
  {
    name: 'Lara Mansour',
    email: 'lara.mansour@demo.com',
    password: 'Demo1234!',
    userType: 'freelancer',
    title: 'UI/UX Designer & Frontend Developer',
    bio: 'Creative designer with a strong eye for detail and 3 years of experience crafting intuitive user interfaces. Comfortable going from Figma mockups to production-ready React components.',
    skills: ['Figma', 'React', 'CSS', 'UI Design', 'Prototyping', 'Tailwind CSS', 'Adobe Illustrator'],
    experienceLevel: 'intermediate',
  },
];

const clientData = [
  {
    name: 'Saba',
    email: 'saba@client.com',
    password: '123456',
    userType: 'client',
    title: 'Product Manager',
    bio: 'Product manager with experience launching digital products in the Lebanese market. I work with freelancers to build and iterate on web platforms quickly and efficiently.',
    skills: [],
    experienceLevel: 'intermediate',
  },
  {
    name: 'Nabil Haddad',
    email: 'nabil.haddad@demo.com',
    password: 'Demo1234!',
    userType: 'client',
    title: 'Founder at TechStart Lebanon',
    bio: 'Entrepreneur running a Beirut-based tech startup. Looking for talented Lebanese freelancers to help build our platform.',
    skills: [],
    experienceLevel: 'expert',
  },
  {
    name: 'Maya Saleh',
    email: 'maya.saleh@demo.com',
    password: 'Demo1234!',
    userType: 'client',
    title: 'Marketing Director',
    bio: 'Marketing professional managing digital campaigns for Lebanese SMEs. Frequently hire freelancers for design, content, and development work.',
    skills: [],
    experienceLevel: 'intermediate',
  },
];

// ── Seed helpers ─────────────────────────────────────────────────────────────

async function upsertUsers(list) {
  const result = {};
  for (const u of list) {
    let user = await User.findOne({ email: u.email });
    if (user) {
      console.log(`  Skipping ${u.email} — already exists`);
    } else {
      const hashed = await bcrypt.hash(u.password, 10);
      user = await User.create({ ...u, password: hashed, isAccountVerified: true });
      console.log(`  Created ${u.userType}: ${u.name} (${u.email})`);
    }
    result[u.email] = user;
  }
  return result;
}

// ── Main seed ─────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'test' });
  console.log('Connected to MongoDB\n');

  // 1. Users
  console.log('── Users ────────────────────────────────────');
  const freelancers = await upsertUsers(freelancerData);
  const clients     = await upsertUsers(clientData);

  const jp    = freelancers['jeanpaul@freelancer.com'];
  const rami  = freelancers['rami.khoury@demo.com'];
  const lara  = freelancers['lara.mansour@demo.com'];
  const saba  = clients['saba@client.com'];
  const nabil = clients['nabil.haddad@demo.com'];
  const maya  = clients['maya.saleh@demo.com'];

  // 2. Wipe and recreate jobs / applications / projects
  console.log('\n── Clearing old jobs, applications, projects ─');
  await Application.deleteMany({});
  await Project.deleteMany({});
  await Job.deleteMany({});
  console.log('  Cleared.');

  // 3. Jobs
  console.log('\n── Jobs ─────────────────────────────────────');

  const job1 = await Job.create({
    clientId: nabil._id,
    title: 'Build a React Dashboard for Our SaaS Platform',
    description: 'We need an experienced React developer to build an analytics dashboard for our SaaS product. The dashboard should include real-time charts, user management tables, and role-based access controls. Must be responsive and integrate with our existing Node.js REST API.',
    requiredSkills: ['React', 'TypeScript', 'REST API', 'Tailwind CSS', 'Git'],
    experienceLevel: 'intermediate',
    projectSize: 'medium',
    duration: '1_to_3_months',
    contractToHire: false,
    paymentType: 'fixed',
    fixedBudget: 2500,
    budget: 2500,
    status: 'open',
    screeningQuestions: [
      { questionText: 'How many years of React experience do you have?', questionType: 'number', required: true },
      { questionText: 'Have you built data dashboards or analytics UIs before?', questionType: 'yesno', required: true },
      { questionText: 'Share a link to a relevant project or your portfolio.', questionType: 'text', required: false },
    ],
  });

  const job2 = await Job.create({
    clientId: nabil._id,
    title: 'Node.js Backend Developer for E-commerce API',
    description: 'Looking for a backend developer to build a scalable e-commerce REST API using Node.js and MongoDB. Scope includes product catalog, cart, checkout, order management, and Stripe payment integration. Performance and security are top priorities.',
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST API', 'Stripe'],
    experienceLevel: 'intermediate',
    projectSize: 'medium',
    duration: '1_to_3_months',
    contractToHire: true,
    paymentType: 'hourly',
    hourlyMin: 25,
    hourlyMax: 45,
    budget: 25,
    status: 'open',
    screeningQuestions: [
      { questionText: 'Have you worked with payment gateway integrations (Stripe, PayPal)?', questionType: 'yesno', required: true },
      { questionText: 'Describe your experience with MongoDB schema design.', questionType: 'text', required: true },
    ],
  });

  const job3 = await Job.create({
    clientId: maya._id,
    title: 'UI/UX Designer for Mobile App Redesign',
    description: 'We are redesigning our mobile app and need a UI/UX designer to create modern, user-friendly screens. Deliverables include user flows, wireframes, high-fidelity mockups in Figma, and a basic design system. The app is for Lebanese consumers aged 18–35.',
    requiredSkills: ['Figma', 'UI Design', 'Prototyping', 'Mobile Design', 'Design Systems'],
    experienceLevel: 'entry',
    projectSize: 'small',
    duration: '1_to_3_months',
    contractToHire: false,
    paymentType: 'fixed',
    fixedBudget: 1500,
    budget: 1500,
    status: 'open',
    screeningQuestions: [
      { questionText: 'Please share your Figma portfolio or Behance link.', questionType: 'text', required: true },
    ],
  });

  const job4 = await Job.create({
    clientId: saba._id,
    title: 'Full Stack Developer — Freelance Marketplace Platform',
    description: 'We are building a freelance marketplace tailored for the Lebanese market. Need a senior full-stack developer to own the entire frontend and backend. Stack: React, Node.js, MongoDB, Socket.io for real-time messaging, JWT auth, and email notifications via Nodemailer.',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'Socket.io', 'JWT', 'Docker', 'TypeScript'],
    experienceLevel: 'expert',
    projectSize: 'large',
    duration: '3_to_6_months',
    contractToHire: true,
    paymentType: 'fixed',
    fixedBudget: 5000,
    budget: 5000,
    status: 'in_progress',
    screeningQuestions: [
      { questionText: 'Have you built a marketplace or multi-sided platform before?', questionType: 'yesno', required: true },
      { questionText: 'What is your availability in hours per week?', questionType: 'number', required: true },
    ],
  });

  const job5 = await Job.create({
    clientId: maya._id,
    title: 'Landing Page Design & Development',
    description: 'Need a landing page designed and developed for our new product launch. Should be visually impressive, fast, mobile-first, and conversion-optimised. Deliverables: Figma design + HTML/CSS/React implementation.',
    requiredSkills: ['Figma', 'React', 'CSS', 'Responsive Design'],
    experienceLevel: 'entry',
    projectSize: 'small',
    duration: '1_to_3_months',
    contractToHire: false,
    paymentType: 'fixed',
    fixedBudget: 800,
    budget: 800,
    status: 'closed',
  });

  console.log(`  Created 5 jobs.`);

  // 4. Applications
  console.log('\n── Applications ─────────────────────────────');

  // Jean Paul → Job 1 (React Dashboard) — pending, strong candidate
  const q1ids = job1.screeningQuestions.map(q => q._id);
  await Application.create({
    jobId: job1._id,
    clientId: nabil._id,
    freelancerId: jp._id,
    coverLetter: "I've spent the last 3 years building dashboards and data-heavy React apps, including a real-time analytics panel for a logistics SaaS used by 200+ companies. I'm very comfortable with TypeScript, Tailwind, and REST API integration. I can start immediately and deliver the MVP within 6 weeks.",
    proposedBudget: 2300,
    proposedTimelineDays: 45,
    answers: [
      { questionId: q1ids[0], questionText: 'How many years of React experience do you have?', value: 3 },
      { questionId: q1ids[1], questionText: 'Have you built data dashboards or analytics UIs before?', value: true },
      { questionId: q1ids[2], questionText: 'Share a link to a relevant project or your portfolio.', value: 'https://github.com/jeanpaul' },
    ],
    status: 'pending',
    aiScore: 87,
    aiStrengths: ['Strong React & TypeScript skills match the job perfectly', 'Prior dashboard experience directly relevant', 'Competitive budget below the listed price'],
    aiWeaknesses: ['Cover letter could reference specific metrics or outcomes'],
    atsScore: 82,
    atsGrade: '🟡 Good',
    atsCategory: 'Information Technology',
    atsConfidence: 91.2,
    atsBreakdown: { 'Section Completeness': 22, 'Keyword Density': 20, 'Quantified Impact': 14, 'Action Verbs': 13, 'Readability': 8, 'Contact Info': 5 },
    atsFeedback: [
      '✅ All key sections detected.',
      '✅ Strong keyword coverage (20/35 tech keywords found). Great job matching industry terminology!',
      '⚠️  Only 3 quantified achievement(s) detected. Try to include more metrics and numbers.',
      '✅ 13 action verbs detected. Good use of dynamic language!',
      '✅ Readability is good. Language is appropriately professional.',
      '✅ Email address detected.',
      '✅ Phone number detected.',
    ],
  });

  // Rami → Job 1 (React Dashboard) — shortlisted
  await Application.create({
    jobId: job1._id,
    clientId: nabil._id,
    freelancerId: rami._id,
    coverLetter: "React has been my primary framework for 4 years. I've built complex SPAs and am very comfortable with TypeScript and state management patterns. Happy to discuss the project scope in a call.",
    proposedBudget: 2500,
    proposedTimelineDays: 60,
    answers: [
      { questionId: q1ids[0], questionText: 'How many years of React experience do you have?', value: 4 },
      { questionId: q1ids[1], questionText: 'Have you built data dashboards or analytics UIs before?', value: false },
      { questionId: q1ids[2], questionText: 'Share a link to a relevant project or your portfolio.', value: 'https://github.com/ramikhoury' },
    ],
    status: 'shortlisted',
    aiScore: 74,
    aiStrengths: ['Solid React experience', 'Communicates availability for calls'],
    aiWeaknesses: ['No prior dashboard experience — direct mismatch with the job requirement', 'Budget at max without added value justification'],
    atsScore: 72,
    atsGrade: '🟡 Good',
    atsCategory: 'Information Technology',
    atsConfidence: 84.5,
    atsBreakdown: { 'Section Completeness': 20, 'Keyword Density': 18, 'Quantified Impact': 10, 'Action Verbs': 11, 'Readability': 8, 'Contact Info': 5 },
    atsFeedback: [
      '✅ All key sections detected.',
      '✅ Moderate keyword coverage (18/35 tech keywords detected). You could strengthen it with: kubernetes, ci/cd, graphql.',
      '⚠️  Only 2 quantified achievement(s) detected. Try to include more metrics and numbers.',
      '⚠️  11 action verbs found. Adding more will strengthen your experience descriptions.',
      '✅ Readability is good. Language is appropriately professional.',
      '✅ Email address detected.',
      '✅ Phone number detected.',
    ],
  });

  // Jean Paul → Job 2 (Node.js Backend) — accepted
  const q2ids = job2.screeningQuestions.map(q => q._id);
  await Application.create({
    jobId: job2._id,
    clientId: nabil._id,
    freelancerId: jp._id,
    coverLetter: "I've integrated Stripe, PayPal, and local payment gateways in 5+ production projects. My MongoDB experience includes complex aggregation pipelines and schema design for high-traffic APIs. I can deliver a robust, well-tested API with full documentation.",
    proposedBudget: 35,
    proposedTimelineDays: 75,
    answers: [
      { questionId: q2ids[0], questionText: 'Have you worked with payment gateway integrations (Stripe, PayPal)?', value: true },
      { questionId: q2ids[1], questionText: 'Describe your experience with MongoDB schema design.', value: 'I have designed schemas for 3 production apps, including a marketplace with embedded documents and references. I always use lean queries and compound indexes for performance.' },
    ],
    status: 'accepted',
    aiScore: 92,
    aiStrengths: ['Specific Stripe + PayPal experience directly matches the requirement', 'MongoDB schema expertise well-articulated', 'Mid-range hourly rate is very competitive'],
    aiWeaknesses: [],
    atsScore: 82,
    atsGrade: '🟡 Good',
    atsCategory: 'Information Technology',
    atsConfidence: 91.2,
    atsBreakdown: { 'Section Completeness': 22, 'Keyword Density': 20, 'Quantified Impact': 14, 'Action Verbs': 13, 'Readability': 8, 'Contact Info': 5 },
    atsFeedback: [
      '✅ All key sections detected.',
      '✅ Strong keyword coverage (20/35 tech keywords found).',
      '✅ 7 quantified achievements detected. Great use of metrics!',
      '✅ 13 action verbs detected. Good use of dynamic language!',
      '✅ Readability is excellent — clear and professional.',
      '✅ Email address detected.',
      '✅ Phone number detected.',
    ],
  });

  // Lara → Job 3 (UI/UX Mobile) — pending
  const q3ids = job3.screeningQuestions.map(q => q._id);
  await Application.create({
    jobId: job3._id,
    clientId: maya._id,
    freelancerId: lara._id,
    coverLetter: "Mobile UI design is my specialty. I've redesigned 3 apps in the past 2 years, improving user retention by 40% in one case. I work in Figma and always deliver a complete design system alongside the screens, so your dev team has everything they need to implement without back-and-forth.",
    proposedBudget: 1400,
    proposedTimelineDays: 30,
    answers: [
      { questionId: q3ids[0], questionText: 'Please share your Figma portfolio or Behance link.', value: 'https://behance.net/laramansour' },
    ],
    status: 'pending',
    aiScore: 83,
    aiStrengths: ['Mobile design experience directly matches the job', 'Quantified outcome (40% retention improvement) is compelling', 'Delivers design system — adds extra value'],
    aiWeaknesses: ['Portfolio link not verifiable at review time'],
    atsScore: 71,
    atsGrade: '🟡 Good',
    atsCategory: 'Web Designing',
    atsConfidence: 78.3,
    atsBreakdown: { 'Section Completeness': 20, 'Keyword Density': 16, 'Quantified Impact': 8, 'Action Verbs': 12, 'Readability': 10, 'Contact Info': 5 },
    atsFeedback: [
      '⚠️  Missing sections: AWARDS. Adding them can improve ATS ranking.',
      '✅ Moderate keyword coverage (16/28 design keywords detected).',
      '⚠️  Only 2 quantified achievement(s) detected. Try to include more metrics.',
      '✅ 12 action verbs detected. Good use of dynamic language!',
      '✅ Readability is excellent — clear and professional.',
      '✅ Email address detected.',
      '✅ Phone number detected.',
    ],
  });

  // Jean Paul → Job 4 (Marketplace) — accepted
  const q4ids = job4.screeningQuestions.map(q => q._id);
  await Application.create({
    jobId: job4._id,
    clientId: saba._id,
    freelancerId: jp._id,
    coverLetter: "Building Lance-style platforms is exactly what I do. I have 3 years of experience with React, Node.js, MongoDB, and Socket.io. I've shipped a full marketplace from scratch — auth, messaging, payments, file uploads, notifications. I can own the full stack and deliver in 4 months.",
    proposedBudget: 4800,
    proposedTimelineDays: 120,
    answers: [
      { questionId: q4ids[0], questionText: 'Have you built a marketplace or multi-sided platform before?', value: true },
      { questionId: q4ids[1], questionText: 'What is your availability in hours per week?', value: 40 },
    ],
    status: 'accepted',
    statusMessage: 'Welcome aboard! You are our top candidate. Let\'s schedule a kickoff call this week.',
    aiScore: 95,
    aiStrengths: ['Direct marketplace experience is a perfect match', 'Full 40h/week availability', 'Covers every required skill in the stack', 'Budget slightly under asking — great value'],
    aiWeaknesses: [],
    atsScore: 82,
    atsGrade: '🟡 Good',
    atsCategory: 'Information Technology',
    atsConfidence: 91.2,
    atsBreakdown: { 'Section Completeness': 22, 'Keyword Density': 20, 'Quantified Impact': 14, 'Action Verbs': 13, 'Readability': 8, 'Contact Info': 5 },
    atsFeedback: [
      '✅ All key sections detected.',
      '✅ Strong keyword coverage (20/35 tech keywords found).',
      '✅ 7 quantified achievements detected. Great use of metrics!',
      '✅ 13 action verbs detected. Good use of dynamic language!',
      '✅ Readability is good.',
      '✅ Email address detected.',
      '✅ Phone number detected.',
    ],
  });

  // Lara → Job 5 (Landing Page) — accepted (job is closed)
  await Application.create({
    jobId: job5._id,
    clientId: maya._id,
    freelancerId: lara._id,
    coverLetter: "Landing pages are my bread and butter. I have designed and coded 12 landing pages in the last year, consistently achieving >3% conversion rates. I deliver Figma design + React code in one package.",
    proposedBudget: 750,
    proposedTimelineDays: 14,
    answers: [],
    status: 'accepted',
    statusMessage: 'Great work on the proposal! Looking forward to working with you.',
    aiScore: 88,
    aiStrengths: ['High volume of landing page experience directly relevant', 'Mentions conversion metrics — client-focused mindset', 'Covers both design and development deliverables'],
    aiWeaknesses: [],
    atsScore: 71,
    atsGrade: '🟡 Good',
    atsCategory: 'Web Designing',
    atsConfidence: 78.3,
    atsBreakdown: { 'Section Completeness': 20, 'Keyword Density': 16, 'Quantified Impact': 8, 'Action Verbs': 12, 'Readability': 10, 'Contact Info': 5 },
    atsFeedback: [
      '⚠️  Missing sections: AWARDS. Adding them can improve ATS ranking.',
      '✅ Moderate keyword coverage (16/28 design keywords detected).',
      '⚠️  Only 2 quantified achievement(s) detected.',
      '✅ 12 action verbs detected.',
      '✅ Readability is excellent.',
      '✅ Email address detected.',
      '✅ Phone number detected.',
    ],
  });

  console.log(`  Created 6 applications.`);

  // 5. Project (Saba's marketplace project — active)
  console.log('\n── Projects ─────────────────────────────────');

  const jpApp = await Application.findOne({ jobId: job4._id, freelancerId: jp._id });

  await Project.create({
    title: 'Lance Marketplace Platform',
    description: 'Full-stack freelance marketplace for the Lebanese market. Covers freelancer/client flows, real-time messaging, AI job matching, and an admin dashboard.',
    clientId: saba._id,
    status: 'active',
    launchDate: new Date('2026-06-01'),
    jobs: [
      {
        jobId: job4._id,
        title: 'Full Stack Developer',
        acceptedApplicationIds: [jpApp._id],
        freelancerIds: [jp._id],
      },
    ],
    tasks: [
      {
        title: 'Set up monorepo and CI/CD pipeline',
        description: 'Initialize the project structure with Vite + Express, configure ESLint, Prettier, and GitHub Actions.',
        assignedTo: jp._id,
        dueDate: new Date('2026-02-15'),
        completedByFreelancer: true,
        completedByFreelancerAt: new Date('2026-02-14'),
        validatedByClient: true,
        validatedByClientAt: new Date('2026-02-15'),
      },
      {
        title: 'Build authentication system (JWT + email OTP)',
        description: 'Implement registration, login, OTP email verification, and password reset flows.',
        assignedTo: jp._id,
        dueDate: new Date('2026-03-01'),
        completedByFreelancer: true,
        completedByFreelancerAt: new Date('2026-02-28'),
        validatedByClient: true,
        validatedByClientAt: new Date('2026-03-01'),
      },
      {
        title: 'Implement job posting and application flow',
        description: 'Client job creation wizard, freelancer apply modal, application listing for clients.',
        assignedTo: jp._id,
        dueDate: new Date('2026-04-15'),
        completedByFreelancer: true,
        completedByFreelancerAt: new Date('2026-04-10'),
        validatedByClient: false,
      },
      {
        title: 'Integrate AI features (ATS scorer + job matching)',
        description: 'Connect Flask ATS microservice, wire job fit score and application tips endpoints.',
        assignedTo: jp._id,
        dueDate: new Date('2026-05-01'),
        completedByFreelancer: false,
      },
      {
        title: 'Admin dashboard with real KPI stats',
        description: 'Build admin analytics page with MongoDB aggregation endpoints for user growth, job categories, top freelancers.',
        assignedTo: jp._id,
        dueDate: new Date('2026-05-15'),
        completedByFreelancer: false,
      },
    ],
  });

  console.log('  Created 1 project.');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║              Seed Complete ✓                 ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Freelancers                                  ║');
  console.log('║    jeanpaul@freelancer.com  / 123456          ║');
  console.log('║    rami.khoury@demo.com     / Demo1234!       ║');
  console.log('║    lara.mansour@demo.com    / Demo1234!       ║');
  console.log('║  Clients                                      ║');
  console.log('║    saba@client.com          / 123456          ║');
  console.log('║    nabil.haddad@demo.com    / Demo1234!       ║');
  console.log('║    maya.saleh@demo.com      / Demo1234!       ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Jobs: 5  Applications: 6  Projects: 1       ║');
  console.log('╚══════════════════════════════════════════════╝');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
