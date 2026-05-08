/**
 * Lance Freelance Platform — Merged Demo Seed Script
 * ───────────────────────────────────────────────────
 * Combines JP's original seed (real dev accounts + quality ATS data)
 * with Saba's extended seed (Lebanese personas, messages, crews,
 * notifications, reviews).
 *
 * Run from /backend:
 *   node seed.js
 *
 * SAFE: No deleteMany on users. Jobs/applications/projects/crews are
 * wiped and recreated cleanly on each run. Messages, notifications,
 * and reviews are upserted (additive, skip duplicates).
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User         from './server/models/userModels.js';
import Job          from './server/models/jobModel.js';
import Application  from './server/models/applicationModel.js';
import Project      from './server/models/projectModel.js';
import Crew         from './server/models/crewModel.js';
import Message      from './server/models/messageModel.js';
import CrewMessage  from './server/models/crewMessageModel.js';
import Notification from './server/models/notificationModel.js';
import Review       from './server/models/reviewModel.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

// ── Helpers ──────────────────────────────────────────────────────────────────

const daysAgo     = (n) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n) => new Date(Date.now() + n * 86_400_000);

async function upsertUser(data) {
  let user = await User.findOne({ email: data.email });
  if (user) {
    console.log(`  ↩  Skipping ${data.email} — already exists`);
    return user;
  }
  const { password, ...rest } = data;
  const hashed = await bcrypt.hash(password, 10);
  user = await User.create({ ...rest, password: hashed, isAccountVerified: true });
  console.log(`  ✓  Created ${data.userType}: ${data.name} (${data.email})`);
  return user;
}

// ── 1. USER DATA ─────────────────────────────────────────────────────────────

// JP's original real dev accounts
const jpFreelancers = [
  {
    name: 'Jean Paul',
    email: 'jeanpaul@freelancer.com',
    password: '123456',
    userType: 'freelancer',
    title: 'Full Stack Developer',
    bio: 'Full stack developer with 3 years of experience building web applications. Specialized in React and Node.js, with a strong focus on clean code and performance.',
    skills: ['React', 'Node.js', 'MongoDB', 'Express', 'TypeScript', 'Tailwind CSS', 'Docker', 'Git', 'REST API'],
    experienceLevel: 'intermediate',
  },
  {
    name: 'Rami Khoury',
    email: 'rami.khoury@demo.com',
    password: 'Demo1234!',
    userType: 'freelancer',
    title: 'Full Stack Developer',
    bio: 'Passionate developer with 4 years of experience building web applications. Specialized in React and Node.js.',
    skills: ['React', 'Node.js', 'MongoDB', 'Express', 'TypeScript', 'Tailwind CSS'],
    experienceLevel: 'intermediate',
  },
  {
    name: 'Lara Mansour',
    email: 'lara.mansour@demo.com',
    password: 'Demo1234!',
    userType: 'freelancer',
    title: 'UI/UX Designer & Frontend Developer',
    bio: 'Creative designer with a strong eye for detail and 3 years of experience crafting intuitive user interfaces.',
    skills: ['Figma', 'React', 'CSS', 'UI Design', 'Prototyping', 'Tailwind CSS', 'Adobe Illustrator'],
    experienceLevel: 'intermediate',
  },
];

const jpClients = [
  {
    name: 'Saba',
    email: 'saba@client.com',
    password: '123456',
    userType: 'client',
    title: 'Product Manager',
    bio: 'Product manager with experience launching digital products in the Lebanese market.',
    skills: [],
    experienceLevel: 'intermediate',
  },
  {
    name: 'Nabil Haddad',
    email: 'nabil.haddad@demo.com',
    password: 'Demo1234!',
    userType: 'client',
    title: 'Founder at TechStart Lebanon',
    bio: 'Entrepreneur running a Beirut-based tech startup. Looking for talented Lebanese freelancers.',
    skills: [],
    experienceLevel: 'expert',
  },
  {
    name: 'Maya Saleh',
    email: 'maya.saleh@demo.com',
    password: 'Demo1234!',
    userType: 'client',
    title: 'Marketing Director',
    bio: 'Marketing professional managing digital campaigns for Lebanese SMEs.',
    skills: [],
    experienceLevel: 'intermediate',
  },
];

// Extended Lebanese persona accounts
const extraFreelancers = [
  {
    name: 'Karim Nassar',
    email: 'karim.nassar@lancelb.demo',
    password: 'Lance2026!',
    userType: 'freelancer',
    title: 'Full-Stack Web Developer',
    bio: 'Beirut-based developer with 5 years of experience building React + Node.js applications.',
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Tailwind CSS', 'REST APIs', 'Socket.io'],
    experienceLevel: 'expert',
    hourlyRate: 45,
    averageRating: 4.8,
    totalReviews: 12,
    hoursPerWeek: 40,
  },
  {
    name: 'Jad Merhi',
    email: 'jad.merhi@lancelb.demo',
    password: 'Lance2026!',
    userType: 'freelancer',
    title: 'Video Editor & Motion Graphics',
    bio: 'Creative video editor based in Tripoli. Specialized in YouTube content, social media reels, and corporate promo videos.',
    skills: ['Adobe Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Motion Graphics', 'Color Grading'],
    experienceLevel: 'intermediate',
    hourlyRate: 25,
    averageRating: 4.7,
    totalReviews: 8,
    hoursPerWeek: 35,
  },
  {
    name: 'Maya Haddad',
    email: 'maya.haddad@lancelb.demo',
    password: 'Lance2026!',
    userType: 'freelancer',
    title: 'Arabic & English Translator / Content Writer',
    bio: 'Professional translator and content writer with a background in journalism. Based in Sidon.',
    skills: ['Arabic Translation', 'English Copywriting', 'SEO Content', 'Proofreading', 'French Translation'],
    experienceLevel: 'expert',
    hourlyRate: 20,
    averageRating: 5.0,
    totalReviews: 34,
    hoursPerWeek: 25,
  },
  {
    name: 'Tony Rizk',
    email: 'tony.rizk@lancelb.demo',
    password: 'Lance2026!',
    userType: 'freelancer',
    title: 'Social Media Manager & Digital Marketer',
    bio: 'Results-driven social media manager from Batroun. Helping Lebanese SMEs grow on Instagram and TikTok.',
    skills: ['Instagram Marketing', 'Facebook Ads', 'TikTok Strategy', 'Content Planning', 'Google Analytics', 'Canva'],
    experienceLevel: 'intermediate',
    hourlyRate: 22,
    averageRating: 4.6,
    totalReviews: 15,
    hoursPerWeek: 40,
  },
  {
    name: 'Rania Saleh',
    email: 'rania.saleh@lancelb.demo',
    password: 'Lance2026!',
    userType: 'freelancer',
    title: 'Mobile App Developer (React Native)',
    bio: 'Mobile developer specializing in cross-platform apps with React Native. Built apps for restaurants, clinics, and e-commerce businesses across Lebanon.',
    skills: ['React Native', 'Expo', 'Firebase', 'Redux', 'iOS', 'Android', 'REST APIs', 'TypeScript'],
    experienceLevel: 'expert',
    hourlyRate: 50,
    averageRating: 4.9,
    totalReviews: 7,
    hoursPerWeek: 35,
  },
  {
    name: 'Omar Zreik',
    email: 'omar.zreik@lancelb.demo',
    password: 'Lance2026!',
    userType: 'freelancer',
    title: 'Virtual Assistant & Admin Support',
    bio: 'Organized and detail-oriented virtual assistant from Zahle. Expert in data entry, scheduling, and email management.',
    skills: ['Data Entry', 'Email Management', 'Google Workspace', 'Excel', 'Scheduling', 'Customer Support'],
    experienceLevel: 'entry',
    hourlyRate: 12,
    averageRating: 4.4,
    totalReviews: 5,
    hoursPerWeek: 40,
  },
];

const extraClients = [
  {
    name: 'Nour Abi Nader',
    email: 'nour.abinader@lancelb.demo',
    password: 'Lance2026!',
    userType: 'client',
    bio: 'Founder of a Beirut-based fashion e-commerce startup.',
    skills: [],
    experienceLevel: 'intermediate',
  },
  {
    name: 'Georges Karam',
    email: 'georges.karam@lancelb.demo',
    password: 'Lance2026!',
    userType: 'client',
    bio: 'CEO of Karam Digital Agency, Jounieh.',
    skills: [],
    experienceLevel: 'expert',
  },
  {
    name: 'Dina Azar',
    email: 'dina.azar@lancelb.demo',
    password: 'Lance2026!',
    userType: 'client',
    bio: 'Restaurant owner in Achrafieh.',
    skills: [],
    experienceLevel: 'entry',
  },
  {
    name: 'Fadi Mansour',
    email: 'fadi.mansour@lancelb.demo',
    password: 'Lance2026!',
    userType: 'client',
    bio: 'Operations manager at a Tripoli import/export company.',
    skills: [],
    experienceLevel: 'intermediate',
  },
];

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'test' });
  console.log('✅  Connected to MongoDB\n');

  // ── 1. Users (upsert — never deletes existing accounts) ──────────────────────
  console.log('── Users ────────────────────────────────────────────────────');

  const jpFL = {};
  for (const u of jpFreelancers)   jpFL[u.email] = await upsertUser(u);
  const jpCL = {};
  for (const u of jpClients)       jpCL[u.email] = await upsertUser(u);
  const exFL = {};
  for (const u of extraFreelancers) exFL[u.email] = await upsertUser(u);
  const exCL = {};
  for (const u of extraClients)    exCL[u.email] = await upsertUser(u);

  // JP accounts
  const jp     = jpFL['jeanpaul@freelancer.com'];
  const rami   = jpFL['rami.khoury@demo.com'];
  const laraM  = jpFL['lara.mansour@demo.com'];
  const saba   = jpCL['saba@client.com'];
  const nabil  = jpCL['nabil.haddad@demo.com'];
  const mayaS  = jpCL['maya.saleh@demo.com'];

  // Extra persona accounts
  const karim  = exFL['karim.nassar@lancelb.demo'];
  const jad    = exFL['jad.merhi@lancelb.demo'];
  const mayaH  = exFL['maya.haddad@lancelb.demo'];
  const tony   = exFL['tony.rizk@lancelb.demo'];
  const rania  = exFL['rania.saleh@lancelb.demo'];
  const omar   = exFL['omar.zreik@lancelb.demo'];
  const nour   = exCL['nour.abinader@lancelb.demo'];
  const georges= exCL['georges.karam@lancelb.demo'];
  const dina   = exCL['dina.azar@lancelb.demo'];
  const fadi   = exCL['fadi.mansour@lancelb.demo'];

  // ── 2. Wipe transactional data (safe — users are untouched) ─────────────────
  console.log('\n── Clearing jobs, applications, projects, crews ─────────────');
  await Application.deleteMany({});
  await Project.deleteMany({});
  await Job.deleteMany({});
  await Crew.deleteMany({});
  console.log('  ✓  Cleared.');

  // ── 3. Jobs ──────────────────────────────────────────────────────────────────
  console.log('\n── Jobs ─────────────────────────────────────────────────────');

  // JP's 5 original jobs
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
    createdAt: daysAgo(14),
    screeningQuestions: [
      { questionText: 'How many years of React experience do you have?', questionType: 'number', required: true },
      { questionText: 'Have you built data dashboards or analytics UIs before?', questionType: 'yesno', required: true },
      { questionText: 'Share a link to a relevant project or your portfolio.', questionType: 'text', required: false },
    ],
  });

  const job2 = await Job.create({
    clientId: nabil._id,
    title: 'Node.js Backend Developer for E-commerce API',
    description: 'Looking for a backend developer to build a scalable e-commerce REST API using Node.js and MongoDB. Scope includes product catalog, cart, checkout, order management, and Stripe payment integration.',
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
    createdAt: daysAgo(20),
    screeningQuestions: [
      { questionText: 'Have you worked with payment gateway integrations (Stripe, PayPal)?', questionType: 'yesno', required: true },
      { questionText: 'Describe your experience with MongoDB schema design.', questionType: 'text', required: true },
    ],
  });

  const job3 = await Job.create({
    clientId: mayaS._id,
    title: 'UI/UX Designer for Mobile App Redesign',
    description: 'We are redesigning our mobile app and need a UI/UX designer to create modern, user-friendly screens. Deliverables include user flows, wireframes, high-fidelity mockups in Figma, and a design system.',
    requiredSkills: ['Figma', 'UI Design', 'Prototyping', 'Mobile Design', 'Design Systems'],
    experienceLevel: 'entry',
    projectSize: 'small',
    duration: '1_to_3_months',
    contractToHire: false,
    paymentType: 'fixed',
    fixedBudget: 1500,
    budget: 1500,
    status: 'open',
    createdAt: daysAgo(10),
    screeningQuestions: [
      { questionText: 'Please share your Figma portfolio or Behance link.', questionType: 'text', required: true },
    ],
  });

  const job4 = await Job.create({
    clientId: saba._id,
    title: 'Full Stack Developer — Freelance Marketplace Platform',
    description: 'Building a freelance marketplace for the Lebanese market. Need a senior full-stack developer to own the entire frontend and backend. Stack: React, Node.js, MongoDB, Socket.io, JWT, Docker.',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'Socket.io', 'JWT', 'Docker', 'TypeScript'],
    experienceLevel: 'expert',
    projectSize: 'large',
    duration: '3_to_6_months',
    contractToHire: true,
    paymentType: 'fixed',
    fixedBudget: 5000,
    budget: 5000,
    status: 'in_progress',
    createdAt: daysAgo(60),
    screeningQuestions: [
      { questionText: 'Have you built a marketplace or multi-sided platform before?', questionType: 'yesno', required: true },
      { questionText: 'What is your availability in hours per week?', questionType: 'number', required: true },
    ],
  });

  const job5 = await Job.create({
    clientId: mayaS._id,
    title: 'Landing Page Design & Development',
    description: 'Need a landing page designed and developed for our new product launch. Visually impressive, mobile-first, and conversion-optimised. Figma design + React implementation.',
    requiredSkills: ['Figma', 'React', 'CSS', 'Responsive Design'],
    experienceLevel: 'entry',
    projectSize: 'small',
    duration: '1_to_3_months',
    contractToHire: false,
    paymentType: 'fixed',
    fixedBudget: 800,
    budget: 800,
    status: 'closed',
    createdAt: daysAgo(45),
  });

  // Extra Lebanese persona jobs
  const job6 = await Job.create({
    clientId: nour._id,
    title: 'E-commerce Website for Fashion Brand (React + Node)',
    description: 'Growing Lebanese fashion brand needs a full e-commerce platform: product catalog, cart, checkout with OMT payment integration, and Arabic/English bilingual support.',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'REST APIs', 'Tailwind CSS'],
    experienceLevel: 'expert',
    paymentType: 'fixed',
    fixedBudget: 2500,
    budget: 2500,
    projectSize: 'large',
    duration: '3_to_6_months',
    status: 'open',
    createdAt: daysAgo(12),
  });

  const job7 = await Job.create({
    clientId: georges._id,
    title: 'React Native Mobile App for Restaurant Ordering',
    description: 'Cross-platform mobile app for a Beirut restaurant. Browse menu, add to cart, place orders. Integrates with existing Node.js backend.',
    requiredSkills: ['React Native', 'Expo', 'REST APIs', 'Firebase'],
    experienceLevel: 'intermediate',
    paymentType: 'fixed',
    fixedBudget: 1800,
    budget: 1800,
    projectSize: 'medium',
    duration: '1_to_3_months',
    status: 'in_progress',
    createdAt: daysAgo(25),
  });

  const job8 = await Job.create({
    clientId: fadi._id,
    title: 'Arabic/English Business Document Translator',
    description: 'Ongoing translation for import/export company. Contracts, customs documents, shipping manifests. Arabic↔English. Must know legal/trade terminology.',
    requiredSkills: ['Arabic Translation', 'English Copywriting', 'Legal Translation', 'Proofreading'],
    experienceLevel: 'expert',
    paymentType: 'hourly',
    hourlyMin: 15,
    hourlyMax: 25,
    budget: 18,
    projectSize: 'medium',
    duration: '3_to_6_months',
    status: 'open',
    createdAt: daysAgo(14),
  });

  const job9 = await Job.create({
    clientId: fadi._id,
    title: 'Virtual Assistant for Daily Business Operations',
    description: 'Reliable VA to handle email correspondence, schedule meetings, manage Google Drive, prepare reports, and support day-to-day admin tasks.',
    requiredSkills: ['Email Management', 'Google Workspace', 'Scheduling', 'Data Entry', 'Excel'],
    experienceLevel: 'entry',
    paymentType: 'hourly',
    hourlyMin: 8,
    hourlyMax: 14,
    budget: 10,
    projectSize: 'medium',
    duration: '1_to_3_months',
    status: 'in_progress',
    createdAt: daysAgo(30),
  });

  const job10 = await Job.create({
    clientId: nour._id,
    title: 'Brand Identity & Logo Design for Fashion Startup',
    description: 'Complete brand identity package: logo, color palette, typography guide, business card, social media templates. Modern, Lebanese-inspired aesthetic.',
    requiredSkills: ['Figma', 'Illustrator', 'Brand Identity', 'Logo Design'],
    experienceLevel: 'intermediate',
    paymentType: 'fixed',
    fixedBudget: 800,
    budget: 800,
    projectSize: 'medium',
    duration: '1_to_3_months',
    status: 'open',
    createdAt: daysAgo(3),
  });

  const job11 = await Job.create({
    clientId: dina._id,
    title: 'Restaurant Social Media Content Creator',
    description: 'Monthly retainer: 20 posts/month, stories, reels, and monthly specials campaign. Must visit Achrafieh for photo shoots. Bilingual Arabic/English captions.',
    requiredSkills: ['Instagram Marketing', 'Canva', 'Copywriting', 'Arabic Copywriting', 'Content Planning'],
    experienceLevel: 'entry',
    paymentType: 'fixed',
    fixedBudget: 400,
    budget: 400,
    projectSize: 'small',
    duration: '1_to_3_months',
    status: 'open',
    createdAt: daysAgo(6),
  });

  const job12 = await Job.create({
    clientId: georges._id,
    title: 'Corporate Promo Video Editing (2–3 min)',
    description: 'Raw footage from a product launch event needs editing into a polished 2–3 min promo. Motion graphics intro/outro, color grading, bilingual Arabic/English subtitles.',
    requiredSkills: ['Adobe Premiere Pro', 'After Effects', 'Motion Graphics', 'Color Grading'],
    experienceLevel: 'intermediate',
    paymentType: 'fixed',
    fixedBudget: 700,
    budget: 700,
    projectSize: 'small',
    duration: '1_to_3_months',
    status: 'open',
    createdAt: daysAgo(2),
  });

  console.log('  ✓  Created 12 jobs.');

  // ── 4. Applications ───────────────────────────────────────────────────────────
  console.log('\n── Applications ─────────────────────────────────────────────');

  const q1ids = job1.screeningQuestions.map(q => q._id);
  const q2ids = job2.screeningQuestions.map(q => q._id);
  const q3ids = job3.screeningQuestions.map(q => q._id);
  const q4ids = job4.screeningQuestions.map(q => q._id);

  // JP → Job1 (React Dashboard) pending
  await Application.create({
    jobId: job1._id, clientId: nabil._id, freelancerId: jp._id,
    coverLetter: "I've spent the last 3 years building dashboards and data-heavy React apps, including a real-time analytics panel for a logistics SaaS used by 200+ companies. I'm very comfortable with TypeScript, Tailwind, and REST API integration. I can start immediately and deliver the MVP within 6 weeks.",
    proposedBudget: 2300, proposedTimelineDays: 45,
    answers: [
      { questionId: q1ids[0], questionText: 'How many years of React experience do you have?', value: 3 },
      { questionId: q1ids[1], questionText: 'Have you built data dashboards or analytics UIs before?', value: true },
      { questionId: q1ids[2], questionText: 'Share a link to a relevant project or your portfolio.', value: 'https://github.com/jeanpaul' },
    ],
    status: 'pending',
    aiScore: 87, aiStrengths: ['Strong React & TypeScript skills', 'Prior dashboard experience', 'Budget below listed price'], aiWeaknesses: ['Cover letter could reference specific metrics'],
    atsScore: 82, atsGrade: '🟡 Good', atsCategory: 'Information Technology', atsConfidence: 91.2,
    atsBreakdown: { 'Section Completeness': 22, 'Keyword Density': 20, 'Quantified Impact': 14, 'Action Verbs': 13, 'Readability': 8, 'Contact Info': 5 },
    atsFeedback: ['✅ All key sections detected.', '✅ Strong keyword coverage (20/35 tech keywords found).', '⚠️  Only 3 quantified achievements detected.', '✅ 13 action verbs detected.', '✅ Readability is good.', '✅ Email detected.', '✅ Phone detected.'],
    createdAt: daysAgo(13),
  });

  // Rami → Job1 shortlisted
  await Application.create({
    jobId: job1._id, clientId: nabil._id, freelancerId: rami._id,
    coverLetter: "React has been my primary framework for 4 years. I've built complex SPAs and am very comfortable with TypeScript and state management patterns. Happy to discuss the project scope on a call.",
    proposedBudget: 2500, proposedTimelineDays: 60,
    answers: [
      { questionId: q1ids[0], questionText: 'How many years of React experience do you have?', value: 4 },
      { questionId: q1ids[1], questionText: 'Have you built data dashboards or analytics UIs before?', value: false },
      { questionId: q1ids[2], questionText: 'Share a link to a relevant project or your portfolio.', value: 'https://github.com/ramikhoury' },
    ],
    status: 'shortlisted',
    aiScore: 74, aiStrengths: ['Solid React experience', 'Available for calls'], aiWeaknesses: ['No prior dashboard experience', 'Budget at max without justification'],
    atsScore: 72, atsGrade: '🟡 Good', atsCategory: 'Information Technology', atsConfidence: 84.5,
    atsBreakdown: { 'Section Completeness': 20, 'Keyword Density': 18, 'Quantified Impact': 10, 'Action Verbs': 11, 'Readability': 8, 'Contact Info': 5 },
    atsFeedback: ['✅ All key sections detected.', '✅ Moderate keyword coverage.', '⚠️  Only 2 quantified achievements.', '⚠️  11 action verbs found.', '✅ Readability is good.', '✅ Email detected.', '✅ Phone detected.'],
    createdAt: daysAgo(12),
  });

  // JP → Job2 (Node backend) accepted
  await Application.create({
    jobId: job2._id, clientId: nabil._id, freelancerId: jp._id,
    coverLetter: "I've integrated Stripe, PayPal, and local payment gateways in 5+ production projects. My MongoDB experience includes complex aggregation pipelines and schema design for high-traffic APIs. I can deliver a robust, well-tested API with full documentation.",
    proposedBudget: 35, proposedTimelineDays: 75,
    answers: [
      { questionId: q2ids[0], questionText: 'Have you worked with payment gateway integrations (Stripe, PayPal)?', value: true },
      { questionId: q2ids[1], questionText: 'Describe your experience with MongoDB schema design.', value: 'I have designed schemas for 3 production apps including a marketplace with embedded documents and compound indexes for performance.' },
    ],
    status: 'accepted',
    aiScore: 92, aiStrengths: ['Specific Stripe + PayPal experience', 'MongoDB schema expertise', 'Competitive mid-range rate'], aiWeaknesses: [],
    atsScore: 82, atsGrade: '🟡 Good', atsCategory: 'Information Technology', atsConfidence: 91.2,
    atsBreakdown: { 'Section Completeness': 22, 'Keyword Density': 20, 'Quantified Impact': 14, 'Action Verbs': 13, 'Readability': 8, 'Contact Info': 5 },
    atsFeedback: ['✅ All key sections detected.', '✅ Strong keyword coverage.', '✅ 7 quantified achievements.', '✅ 13 action verbs.', '✅ Readability excellent.', '✅ Email detected.', '✅ Phone detected.'],
    createdAt: daysAgo(18),
  });

  // Lara → Job3 (UI/UX Mobile) pending
  await Application.create({
    jobId: job3._id, clientId: mayaS._id, freelancerId: laraM._id,
    coverLetter: "Mobile UI design is my specialty. I've redesigned 3 apps in the past 2 years, improving user retention by 40% in one case. I always deliver a complete design system alongside the screens.",
    proposedBudget: 1400, proposedTimelineDays: 30,
    answers: [
      { questionId: q3ids[0], questionText: 'Please share your Figma portfolio or Behance link.', value: 'https://behance.net/laramansour' },
    ],
    status: 'pending',
    aiScore: 83, aiStrengths: ['Mobile design experience', '40% retention improvement result', 'Delivers design system'], aiWeaknesses: ['Portfolio link not verifiable'],
    atsScore: 71, atsGrade: '🟡 Good', atsCategory: 'Web Designing', atsConfidence: 78.3,
    atsBreakdown: { 'Section Completeness': 20, 'Keyword Density': 16, 'Quantified Impact': 8, 'Action Verbs': 12, 'Readability': 10, 'Contact Info': 5 },
    atsFeedback: ['⚠️  Missing sections: AWARDS.', '✅ Moderate keyword coverage.', '⚠️  Only 2 quantified achievements.', '✅ 12 action verbs.', '✅ Readability excellent.', '✅ Email detected.', '✅ Phone detected.'],
    createdAt: daysAgo(9),
  });

  // JP → Job4 (Marketplace) accepted
  const app_jp_job4 = await Application.create({
    jobId: job4._id, clientId: saba._id, freelancerId: jp._id,
    coverLetter: "Building marketplace platforms is exactly what I do. I have 3 years of experience with React, Node.js, MongoDB, and Socket.io. I've shipped a full marketplace from scratch — auth, messaging, payments, file uploads, notifications.",
    proposedBudget: 4800, proposedTimelineDays: 120,
    answers: [
      { questionId: q4ids[0], questionText: 'Have you built a marketplace or multi-sided platform before?', value: true },
      { questionId: q4ids[1], questionText: 'What is your availability in hours per week?', value: 40 },
    ],
    status: 'accepted',
    statusMessage: "Welcome aboard! You are our top candidate. Let's schedule a kickoff call this week.",
    aiScore: 95, aiStrengths: ['Direct marketplace experience — perfect match', 'Full 40h/week availability', 'Covers every required skill', 'Budget under asking'], aiWeaknesses: [],
    atsScore: 82, atsGrade: '🟡 Good', atsCategory: 'Information Technology', atsConfidence: 91.2,
    atsBreakdown: { 'Section Completeness': 22, 'Keyword Density': 20, 'Quantified Impact': 14, 'Action Verbs': 13, 'Readability': 8, 'Contact Info': 5 },
    atsFeedback: ['✅ All key sections detected.', '✅ Strong keyword coverage.', '✅ 7 quantified achievements.', '✅ 13 action verbs.', '✅ Readability is good.', '✅ Email detected.', '✅ Phone detected.'],
    createdAt: daysAgo(55),
  });

  // Lara → Job5 (Landing page) accepted / closed
  await Application.create({
    jobId: job5._id, clientId: mayaS._id, freelancerId: laraM._id,
    coverLetter: "Landing pages are my bread and butter. I have designed and coded 12 landing pages in the last year, consistently achieving >3% conversion rates. I deliver Figma design + React code in one package.",
    proposedBudget: 750, proposedTimelineDays: 14, answers: [],
    status: 'accepted',
    statusMessage: 'Great work on the proposal! Looking forward to working with you.',
    aiScore: 88, aiStrengths: ['High volume of landing page experience', 'Conversion metrics mentioned', 'Design + development in one'], aiWeaknesses: [],
    atsScore: 71, atsGrade: '🟡 Good', atsCategory: 'Web Designing', atsConfidence: 78.3,
    atsBreakdown: { 'Section Completeness': 20, 'Keyword Density': 16, 'Quantified Impact': 8, 'Action Verbs': 12, 'Readability': 10, 'Contact Info': 5 },
    atsFeedback: ['⚠️  Missing sections: AWARDS.', '✅ Moderate keyword coverage.', '⚠️  Only 2 quantified achievements.', '✅ 12 action verbs.', '✅ Readability excellent.', '✅ Email detected.', '✅ Phone detected.'],
    createdAt: daysAgo(42),
  });

  // Karim → Job6 (Fashion e-commerce) accepted
  const app_karim_job6 = await Application.create({
    jobId: job6._id, clientId: nour._id, freelancerId: karim._id,
    coverLetter: "I've built 3 e-commerce platforms for Lebanese brands using React and Node.js, including a bilingual Arabic/English shop with OMT payment integration. Happy to show my portfolio.",
    proposedBudget: 2400, proposedTimelineDays: 80,
    status: 'accepted',
    statusMessage: "Karim, your proposal was exactly what we were looking for. Let's get started!",
    aiScore: 88, aiStrengths: ['Strong React & Node.js skills', 'Bilingual Arabic/English experience', 'OMT payment mentioned'], aiWeaknesses: ['Portfolio not attached'],
    atsScore: 81, atsGrade: '🟢 Great', atsCategory: 'Software Development', atsConfidence: 88.0,
    atsBreakdown: { 'Section Completeness': 22, 'Keyword Density': 19, 'Quantified Impact': 12, 'Action Verbs': 13, 'Readability': 9, 'Contact Info': 5 },
    atsFeedback: ['✅ Strong backend skills detected.', '✅ React and REST API keywords present.', '⚠️  Consider adding TypeScript experience.'],
    viewedByClient: true, createdAt: daysAgo(10),
  });

  // Rania → Job7 (Restaurant app) accepted
  const app_rania_job7 = await Application.create({
    jobId: job7._id, clientId: georges._id, freelancerId: rania._id,
    coverLetter: "React Native is my specialty — I've built 4 restaurant and delivery apps for Lebanese clients. I can integrate with your existing Node.js backend seamlessly.",
    proposedBudget: 1750, proposedTimelineDays: 50,
    status: 'accepted',
    statusMessage: "Perfect fit, Rania! Let's kick off the project.",
    aiScore: 92, aiStrengths: ['React Native is core skill', 'Restaurant app experience relevant', 'Budget under client budget'], aiWeaknesses: [],
    atsScore: 85, atsGrade: '🟢 Great', atsCategory: 'Mobile Development', atsConfidence: 90.0,
    atsBreakdown: { 'Section Completeness': 22, 'Keyword Density': 21, 'Quantified Impact': 13, 'Action Verbs': 14, 'Readability': 9, 'Contact Info': 5 },
    atsFeedback: ['✅ Mobile development keywords dominant.', '✅ Firebase and Expo skills detected.', '✅ Strong profile match.'],
    viewedByClient: true, createdAt: daysAgo(20),
  });

  // Maya Haddad → Job8 (Translation) accepted
  const app_maya_job8 = await Application.create({
    jobId: job8._id, clientId: fadi._id, freelancerId: mayaH._id,
    coverLetter: "I have 8 years of experience in Arabic-English translation for business documents and trade correspondence. Familiar with customs and shipping terminology from working with Lebanese trading companies.",
    proposedBudget: 18, proposedTimelineDays: 180,
    status: 'accepted',
    statusMessage: "Maya, you're exactly what we need. Let's start with this month's shipping documents.",
    aiScore: 96, aiStrengths: ['Trade and customs document experience', 'Legal translation mentioned', 'Rate matches budget exactly'], aiWeaknesses: [],
    atsScore: 90, atsGrade: '🟢 Excellent', atsCategory: 'Translation', atsConfidence: 94.0,
    atsBreakdown: { 'Section Completeness': 24, 'Keyword Density': 22, 'Quantified Impact': 15, 'Action Verbs': 14, 'Readability': 10, 'Contact Info': 5 },
    atsFeedback: ['✅ Translation skills are primary and strong.', '✅ Legal and business document experience detected.'],
    viewedByClient: true, createdAt: daysAgo(12),
  });

  // Omar → Job9 (VA) accepted
  const app_omar_job9 = await Application.create({
    jobId: job9._id, clientId: fadi._id, freelancerId: omar._id,
    coverLetter: "I'm a dedicated VA with experience in email management, Google Workspace, and data entry. I understand Lebanese business culture and communicate professionally in Arabic and English.",
    proposedBudget: 10, proposedTimelineDays: 90,
    status: 'accepted',
    statusMessage: 'Welcome aboard, Omar! Please start Monday.',
    aiScore: 78, aiStrengths: ['Skills match all requirements', 'Lebanese business culture experience', 'Rate matches budget'], aiWeaknesses: ['Entry-level — limited track record'],
    atsScore: 68, atsGrade: '🟡 Good', atsCategory: 'Administrative Support', atsConfidence: 75.0,
    atsBreakdown: { 'Section Completeness': 18, 'Keyword Density': 16, 'Quantified Impact': 8, 'Action Verbs': 11, 'Readability': 9, 'Contact Info': 5 },
    atsFeedback: ['✅ Admin and organizational skills detected.', '✅ Google Workspace and Excel mentioned.'],
    viewedByClient: true, createdAt: daysAgo(28),
  });

  // Jad → Job12 (Promo video) pending
  await Application.create({
    jobId: job12._id, clientId: georges._id, freelancerId: jad._id,
    coverLetter: "Corporate promo videos are my bread and butter. I use Premiere Pro and After Effects, and I specialize in Arabic + English bilingual subtitling for Lebanese corporate clients.",
    proposedBudget: 680, proposedTimelineDays: 9,
    status: 'pending',
    aiScore: 89, aiStrengths: ['Direct Premiere Pro + After Effects match', 'Arabic subtitling experience', 'Under budget and timeline'], aiWeaknesses: [],
    atsScore: 82, atsGrade: '🟢 Great', atsCategory: 'Video Production', atsConfidence: 87.0,
    atsBreakdown: { 'Section Completeness': 21, 'Keyword Density': 20, 'Quantified Impact': 11, 'Action Verbs': 13, 'Readability': 9, 'Contact Info': 5 },
    atsFeedback: ['✅ Video editing keywords strongly detected.', '✅ Motion graphics skills confirmed.'],
    viewedByClient: false, createdAt: daysAgo(1),
  });

  // Tony → Job11 (Restaurant social) pending
  await Application.create({
    jobId: job11._id, clientId: dina._id, freelancerId: tony._id,
    coverLetter: "I specialize in restaurant social media in Lebanon. I handle photography direction, reels, stories, and bilingual captions. I can visit weekly for content creation.",
    proposedBudget: 380, proposedTimelineDays: 30,
    status: 'pending',
    aiScore: 82, aiStrengths: ['Restaurant social media specialty', 'In-person visits offered', 'Monthly delivery structure'], aiWeaknesses: ['No photography portfolio mentioned'],
    atsScore: 71, atsGrade: '🟡 Good', atsCategory: 'Social Media Marketing', atsConfidence: 80.0,
    atsBreakdown: { 'Section Completeness': 20, 'Keyword Density': 17, 'Quantified Impact': 9, 'Action Verbs': 12, 'Readability': 8, 'Contact Info': 5 },
    atsFeedback: ['✅ Content planning skills detected.', '✅ Arabic copywriting skills indicated.'],
    viewedByClient: false, createdAt: daysAgo(4),
  });

  console.log('  ✓  Created 13 applications.');

  // ── 5. Projects + Crews ───────────────────────────────────────────────────────
  console.log('\n── Projects + Crews ─────────────────────────────────────────');

  // Project 1: Lance Marketplace (Saba + JP) — JP's original, now with a crew
  const crew1 = await Crew.create({
    name: 'Lance Marketplace Platform',
    createdBy: saba._id,
    members: [saba._id, jp._id],
    createdAt: daysAgo(55),
  });
  const project1 = await Project.create({
    title: 'Lance Marketplace Platform',
    description: 'Full-stack freelance marketplace for the Lebanese market. Covers freelancer/client flows, real-time messaging, AI job matching, and admin dashboard.',
    clientId: saba._id,
    status: 'active',
    launchDate: new Date('2026-06-01'),
    crewId: crew1._id,
    jobs: [{ jobId: job4._id, title: 'Full Stack Developer', acceptedApplicationIds: [app_jp_job4._id], freelancerIds: [jp._id] }],
    tasks: [
      { title: 'Set up monorepo and CI/CD pipeline', description: 'Initialize Vite + Express, configure ESLint, Prettier, and GitHub Actions.', assignedTo: jp._id, dueDate: new Date('2026-02-15'), completedByFreelancer: true, completedByFreelancerAt: new Date('2026-02-14'), validatedByClient: true, validatedByClientAt: new Date('2026-02-15') },
      { title: 'Build authentication system (JWT + email OTP)', description: 'Registration, login, OTP verification, and password reset flows.', assignedTo: jp._id, dueDate: new Date('2026-03-01'), completedByFreelancer: true, completedByFreelancerAt: new Date('2026-02-28'), validatedByClient: true, validatedByClientAt: new Date('2026-03-01') },
      { title: 'Implement job posting and application flow', description: 'Client job creation wizard, freelancer apply modal, application listing.', assignedTo: jp._id, dueDate: new Date('2026-04-15'), completedByFreelancer: true, completedByFreelancerAt: new Date('2026-04-10'), validatedByClient: false },
      { title: 'Integrate AI features (ATS scorer + job matching)', description: 'Connect Flask ATS microservice, wire job fit score and tips endpoints.', assignedTo: jp._id, dueDate: new Date('2026-05-01'), completedByFreelancer: false },
      { title: 'Admin dashboard with real KPI stats', description: 'MongoDB aggregation endpoints for user growth, job categories, top freelancers.', assignedTo: jp._id, dueDate: new Date('2026-05-15'), completedByFreelancer: false },
    ],
    createdAt: daysAgo(55),
  });

  // Project 2: Restaurant Mobile App (Georges + Rania)
  const crew2 = await Crew.create({
    name: 'Restaurant Mobile App — Al-Karam Jounieh',
    createdBy: georges._id,
    members: [georges._id, rania._id],
    createdAt: daysAgo(18),
  });
  const project2 = await Project.create({
    title: 'Restaurant Mobile App — Al-Karam Jounieh',
    description: 'Cross-platform React Native app for Al-Karam Restaurant. Menu browsing, cart, order placement.',
    clientId: georges._id,
    status: 'active',
    launchDate: daysAgo(10),
    crewId: crew2._id,
    jobs: [{ jobId: job7._id, title: 'React Native Developer', freelancerIds: [rania._id] }],
    tasks: [
      { title: 'Set up Expo project & navigation', assignedTo: rania._id, dueDate: daysAgo(18), completedByFreelancer: true, validatedByClient: true },
      { title: 'Build menu browsing screens', assignedTo: rania._id, dueDate: daysAgo(10), completedByFreelancer: true, validatedByClient: true },
      { title: 'Cart and checkout flow', assignedTo: rania._id, dueDate: daysAgo(3), completedByFreelancer: true, validatedByClient: false },
      { title: 'Push notifications (Firebase)', assignedTo: rania._id, dueDate: daysFromNow(7), completedByFreelancer: false, validatedByClient: false },
      { title: 'Testing & App Store submission', assignedTo: rania._id, dueDate: daysFromNow(14), completedByFreelancer: false, validatedByClient: false },
    ],
    createdAt: daysAgo(18),
  });

  // Project 3: Translation Retainer (Fadi + Maya Haddad)
  const crew3 = await Crew.create({
    name: 'Mansour Trading — Translation Retainer',
    createdBy: fadi._id,
    members: [fadi._id, mayaH._id],
    createdAt: daysAgo(10),
  });
  const project3 = await Project.create({
    title: 'Mansour Trading — Translation Retainer',
    description: 'Ongoing Arabic-English translation of business documents, shipping manifests, and contracts.',
    clientId: fadi._id,
    status: 'active',
    launchDate: daysAgo(8),
    crewId: crew3._id,
    jobs: [{ jobId: job8._id, title: 'Translator', freelancerIds: [mayaH._id] }],
    tasks: [
      { title: 'Translate March shipping batch (12 docs)', assignedTo: mayaH._id, dueDate: daysAgo(5), completedByFreelancer: true, validatedByClient: true },
      { title: 'Legal contract — supplier agreement (EN→AR)', assignedTo: mayaH._id, dueDate: daysAgo(1), completedByFreelancer: true, validatedByClient: false },
      { title: 'April document batch', assignedTo: mayaH._id, dueDate: daysFromNow(10), completedByFreelancer: false, validatedByClient: false },
    ],
    createdAt: daysAgo(10),
  });

  // Project 4: Virtual Assistant (Fadi + Omar)
  const crew4 = await Crew.create({
    name: 'Mansour Trading — VA Support',
    createdBy: fadi._id,
    members: [fadi._id, omar._id],
    createdAt: daysAgo(25),
  });
  const project4 = await Project.create({
    title: 'Mansour Trading — Virtual Assistant Support',
    description: 'Daily admin support: email management, scheduling, Google Drive, monthly reports.',
    clientId: fadi._id,
    status: 'active',
    launchDate: daysAgo(22),
    crewId: crew4._id,
    jobs: [{ jobId: job9._id, title: 'Virtual Assistant', freelancerIds: [omar._id] }],
    tasks: [
      { title: 'Set up Google Drive folder structure', assignedTo: omar._id, dueDate: daysAgo(20), completedByFreelancer: true, validatedByClient: true },
      { title: 'Handle inbox — week of April 7–11', assignedTo: omar._id, dueDate: daysAgo(14), completedByFreelancer: true, validatedByClient: true },
      { title: 'Prepare April KPI report', assignedTo: omar._id, dueDate: daysFromNow(3), completedByFreelancer: false, validatedByClient: false },
    ],
    createdAt: daysAgo(25),
  });

  console.log('  ✓  Created 4 projects + 4 crew channels.');

  // ── 6. Direct Messages ────────────────────────────────────────────────────────
  console.log('\n── Direct Messages ──────────────────────────────────────────');

  const dmThreads = [
    // JP ↔ Saba
    [
      { senderId: saba._id,  recieverId: jp._id,    text: "JP! So excited to finally kick off the project. When can we have a call?", createdAt: daysAgo(54) },
      { senderId: jp._id,    recieverId: saba._id,  text: "Hey Saba! Tomorrow at 4pm works — I'll set up a Google Meet.", createdAt: daysAgo(54) },
      { senderId: saba._id,  recieverId: jp._id,    text: "Perfect. I'll share our brand assets and reference apps before the call.", createdAt: daysAgo(54) },
      { senderId: jp._id,    recieverId: saba._id,  text: "Monorepo is set up and pushed. Repo: github.com/Lance-LB/platform", createdAt: daysAgo(50) },
      { senderId: saba._id,  recieverId: jp._id,    text: "This is looking great already! Exactly what I had in mind.", createdAt: daysAgo(50) },
      { senderId: jp._id,    recieverId: saba._id,  text: "Auth is done — registration, login, OTP, JWT all working. Ready for review.", createdAt: daysAgo(35) },
      { senderId: saba._id,  recieverId: jp._id,    text: "Tested it — works perfectly! OTP email arrived instantly. Validating that task now.", createdAt: daysAgo(34) },
      { senderId: jp._id,    recieverId: saba._id,  text: "Job wizard and application flow are live on staging. Can you test both roles?", createdAt: daysAgo(15) },
      { senderId: saba._id,  recieverId: jp._id,    text: "Tested both flows — wizard is super smooth! One bug: budget field resets on step 4. Noted in Notion.", createdAt: daysAgo(14) },
      { senderId: jp._id,    recieverId: saba._id,  text: "Bug fixed and pushed! Next: AI features — ATS scoring + job matching. Done by end of week.", createdAt: daysAgo(13) },
    ],
    // Karim ↔ Nour
    [
      { senderId: nour._id,  recieverId: karim._id, text: "Hi Karim! So glad you're on board. When can we have a kickoff call?", createdAt: daysAgo(9) },
      { senderId: karim._id, recieverId: nour._id,  text: "Hey Nour! I'm free Thursday afternoon or Friday morning.", createdAt: daysAgo(9) },
      { senderId: nour._id,  recieverId: karim._id, text: "Thursday 3pm it is. I'll send logo files and brand colors.", createdAt: daysAgo(9) },
      { senderId: karim._id, recieverId: nour._id,  text: "Perfect! I'll prepare a wireframe for the homepage to share on the call.", createdAt: daysAgo(8) },
      { senderId: nour._id,  recieverId: karim._id, text: "Just sent a Google Drive folder with everything. Talk soon 😊", createdAt: daysAgo(8) },
    ],
    // Maya Haddad ↔ Fadi
    [
      { senderId: fadi._id,  recieverId: mayaH._id, text: "Maya, we have a batch of 12 documents to translate by end of week. Feasible?", createdAt: daysAgo(7) },
      { senderId: mayaH._id, recieverId: fadi._id,  text: "Hi Mr. Mansour! Yes absolutely. Please send them and I'll start today.", createdAt: daysAgo(7) },
      { senderId: fadi._id,  recieverId: mayaH._id, text: "Shared on Drive. First 4 are urgent — customs declarations for a Monday shipment.", createdAt: daysAgo(7) },
      { senderId: mayaH._id, recieverId: fadi._id,  text: "Understood! I'll prioritize those and have them back tomorrow morning.", createdAt: daysAgo(7) },
      { senderId: fadi._id,  recieverId: mayaH._id, text: "Use 'FOB' not 'Franco' in shipping terms — our standard with European partners.", createdAt: daysAgo(6) },
      { senderId: mayaH._id, recieverId: fadi._id,  text: "Noted! 4 urgent docs done and uploaded. Remaining 8 ready by Thursday.", createdAt: daysAgo(5) },
      { senderId: fadi._id,  recieverId: mayaH._id, text: "Reviewed and approved ✓ Excellent quality, Maya.", createdAt: daysAgo(5) },
    ],
    // Tony ↔ Dina
    [
      { senderId: tony._id,  recieverId: dina._id,  text: "Hi Dina! Following up on my proposal. Happy to share examples of restaurant accounts I've grown.", createdAt: daysAgo(3) },
      { senderId: dina._id,  recieverId: tony._id,  text: "Hi Tony! Yes please, especially Lebanese restaurants.", createdAt: daysAgo(3) },
      { senderId: tony._id,  recieverId: dina._id,  text: "Here's a case study — managed a Jounieh restaurant from 1.2k to 18k followers in 5 months through Reels + campaigns.", createdAt: daysAgo(2) },
      { senderId: dina._id,  recieverId: tony._id,  text: "That's impressive! Do you handle Arabic captions yourself?", createdAt: daysAgo(2) },
      { senderId: tony._id,  recieverId: dina._id,  text: "Yes — all content is bilingual, Arabic captions written by me, not auto-translated.", createdAt: daysAgo(1) },
    ],
  ];

  let dmCount = 0;
  for (const thread of dmThreads) {
    for (const msg of thread) {
      const exists = await Message.findOne({ senderId: msg.senderId, recieverId: msg.recieverId, text: msg.text });
      if (!exists) { await Message.create(msg); dmCount++; }
    }
  }
  console.log(`  ✓  ${dmCount} direct messages inserted.`);

  // ── 7. Crew Messages ──────────────────────────────────────────────────────────
  console.log('\n── Crew Messages ────────────────────────────────────────────');

  const crewMsgThreads = [
    { crew: crew1, msgs: [
      { senderId: saba._id, text: "Welcome to the Lance project channel! Let's use this for daily updates.", createdAt: daysAgo(54) },
      { senderId: jp._id,   text: "Thanks Saba! Monorepo is initialized. First commit pushed.", createdAt: daysAgo(54) },
      { senderId: jp._id,   text: "Auth system fully built — JWT, bcrypt, OTP email via Brevo. All tests passing ✅", createdAt: daysAgo(34) },
      { senderId: saba._id, text: "Tested the full register → OTP → login flow. Flawless! Great work JP.", createdAt: daysAgo(33) },
      { senderId: jp._id,   text: "Job posting wizard done — all 6 steps, draft persistence, MongoDB save. Staging link pinned.", createdAt: daysAgo(18) },
      { senderId: saba._id, text: "The wizard is beautiful! Tested 3 jobs. Bug noted in Notion — budget resets on back navigation.", createdAt: daysAgo(17) },
      { senderId: jp._id,   text: "Bug fixed ✅ Also added localStorage draft persistence so data survives page refresh.", createdAt: daysAgo(16) },
      { senderId: jp._id,   text: "Application flow live — freelancers can apply with cover letter, budget, CV upload. ATS fires on submit.", createdAt: daysAgo(10) },
      { senderId: saba._id, text: "The ATS score breakdown UI looks great! Starting admin dashboard review this week.", createdAt: daysAgo(9) },
      { senderId: jp._id,   text: "Starting AI job matching endpoint today. ETA 3 days. Then admin KPIs to finish the sprint 🚀", createdAt: daysAgo(2) },
    ]},
    { crew: crew2, msgs: [
      { senderId: georges._id, text: "Welcome Rania! Use this for daily updates and quick questions.", createdAt: daysAgo(18) },
      { senderId: rania._id,   text: "Thanks Georges! Expo is set up, navigation configured. Initial commit pushed.", createdAt: daysAgo(18) },
      { senderId: rania._id,   text: "Tab navigation and home screen done. Loom walkthrough: loom.com/share/demo-01", createdAt: daysAgo(14) },
      { senderId: georges._id, text: "This looks perfect 🔥 Exactly what we discussed.", createdAt: daysAgo(14) },
      { senderId: rania._id,   text: "Menu browsing screens done! API fetch, pagination, Cloudinary images all working.", createdAt: daysAgo(10) },
      { senderId: georges._id, text: "Tested on my iPhone — super smooth! Keep it up 💪", createdAt: daysAgo(9) },
      { senderId: rania._id,   text: "Cart flow complete. Working on checkout API call — done tomorrow.", createdAt: daysAgo(4) },
      { senderId: rania._id,   text: "Checkout done and tested ✅ Submitted for review. Starting Firebase notifications next.", createdAt: daysAgo(2) },
      { senderId: georges._id, text: "Reviewed and approved! Restaurant owner is getting very excited. Excellent progress Rania.", createdAt: daysAgo(1) },
    ]},
    { crew: crew3, msgs: [
      { senderId: fadi._id,  text: "Maya, this is our coordination channel. Post updates here when batches are ready.", createdAt: daysAgo(10) },
      { senderId: mayaH._id, text: "Understood! I'll post whenever a batch is complete and ready for review.", createdAt: daysAgo(10) },
      { senderId: mayaH._id, text: "Batch 1 (4 customs docs) done and uploaded to Drive 📄 Please review.", createdAt: daysAgo(5) },
      { senderId: fadi._id,  text: "Reviewed and approved. Excellent quality. Proceed with remaining 8.", createdAt: daysAgo(5) },
      { senderId: mayaH._id, text: "Full batch of 12 documents delivered! All on the shared Drive.", createdAt: daysAgo(4) },
      { senderId: fadi._id,  text: "Excellent. Supplier contract (EN→AR) coming tomorrow.", createdAt: daysAgo(3) },
      { senderId: mayaH._id, text: "Contract done! Flagged clause 4.2 — English is ambiguous. Added a translator's note.", createdAt: daysAgo(1) },
      { senderId: fadi._id,  text: "Thank you for flagging that! Great attention to detail.", createdAt: daysAgo(1) },
    ]},
    { crew: crew4, msgs: [
      { senderId: fadi._id, text: "Omar, welcome! We work 8am–5pm Lebanon time. Daily check-in at 4:30pm please.", createdAt: daysAgo(22) },
      { senderId: omar._id, text: "Good morning Mr. Mansour! Understood — daily summary each afternoon.", createdAt: daysAgo(22) },
      { senderId: omar._id, text: "Google Drive organized ✅ Folders: Contracts, Invoices, Correspondence, Operations, Archives. Link sent by email.", createdAt: daysAgo(20) },
      { senderId: fadi._id, text: "Perfect structure. Exactly what we needed. Well done!", createdAt: daysAgo(19) },
      { senderId: omar._id, text: "Daily summary: 14 emails handled, 2 meetings scheduled, 3 urgent supplier inquiries flagged.", createdAt: daysAgo(14) },
      { senderId: fadi._id, text: "Good. Did you use the standard template for the supplier inquiries?", createdAt: daysAgo(14) },
      { senderId: omar._id, text: "Yes, template used for all 3. One supplier wants a call — noted in the flagged email.", createdAt: daysAgo(13) },
      { senderId: omar._id, text: "April KPI report is 70% done. Should I include March import volume figures?", createdAt: daysAgo(4) },
      { senderId: fadi._id, text: "Yes, pull those from the March closing report. Good initiative asking.", createdAt: daysAgo(4) },
    ]},
  ];

  let crewMsgCount = 0;
  for (const { crew, msgs } of crewMsgThreads) {
    for (const msg of msgs) {
      const exists = await CrewMessage.findOne({ crewId: crew._id, senderId: msg.senderId, text: msg.text });
      if (!exists) { await CrewMessage.create({ crewId: crew._id, senderId: msg.senderId, text: msg.text, createdAt: msg.createdAt }); crewMsgCount++; }
    }
  }
  console.log(`  ✓  ${crewMsgCount} crew messages inserted.`);

  // ── 8. Notifications ──────────────────────────────────────────────────────────
  console.log('\n── Notifications ────────────────────────────────────────────');

  const notifData = [
    { userId: jp._id,    type: 'application_accepted', title: 'Proposal accepted!',      message: 'Nabil Haddad accepted your proposal for "Node.js Backend Developer for E-commerce API".', senderId: nabil._id,  relatedType: 'application', read: true,  createdAt: daysAgo(18) },
    { userId: jp._id,    type: 'application_accepted', title: 'Proposal accepted!',      message: 'Saba accepted your proposal for "Full Stack Developer — Freelance Marketplace Platform".', senderId: saba._id,   relatedType: 'application', read: true,  createdAt: daysAgo(55) },
    { userId: jp._id,    type: 'project_started',      title: 'Project started',         message: 'The project "Lance Marketplace Platform" has started. A messaging channel has been created.', senderId: saba._id, relatedType: 'project', read: true, createdAt: daysAgo(54) },
    { userId: rami._id,  type: 'application_accepted', title: 'Proposal shortlisted',    message: 'Nabil Haddad shortlisted your proposal for "Build a React Dashboard for Our SaaS Platform".', senderId: nabil._id, relatedType: 'application', read: false, createdAt: daysAgo(12) },
    { userId: laraM._id, type: 'application_accepted', title: 'Proposal accepted!',      message: 'Maya Saleh accepted your proposal for "Landing Page Design & Development".', senderId: mayaS._id, relatedType: 'application', read: true, createdAt: daysAgo(42) },
    { userId: rania._id, type: 'application_accepted', title: 'Proposal accepted!',      message: 'Georges Karam accepted your proposal for "React Native Mobile App for Restaurant Ordering".', senderId: georges._id, relatedType: 'application', read: true, createdAt: daysAgo(20) },
    { userId: rania._id, type: 'project_started',      title: 'Project started',         message: 'The project "Restaurant Mobile App — Al-Karam Jounieh" has started.', senderId: georges._id, relatedType: 'project', read: true, createdAt: daysAgo(18) },
    { userId: rania._id, type: 'task_completed',       title: 'New task assigned',       message: 'You have been assigned "Cart and checkout flow" in "Restaurant Mobile App — Al-Karam Jounieh".', senderId: georges._id, relatedType: 'project', read: true, createdAt: daysAgo(5) },
    { userId: mayaH._id, type: 'application_accepted', title: 'Proposal accepted!',      message: 'Fadi Mansour accepted your proposal for "Arabic/English Business Document Translator".', senderId: fadi._id, relatedType: 'application', read: true, createdAt: daysAgo(12) },
    { userId: mayaH._id, type: 'project_started',      title: 'Project started',         message: 'The project "Mansour Trading — Translation Retainer" has started.', senderId: fadi._id, relatedType: 'project', read: true, createdAt: daysAgo(10) },
    { userId: omar._id,  type: 'application_accepted', title: 'Proposal accepted!',      message: 'Fadi Mansour accepted your proposal for "Virtual Assistant for Daily Business Operations". Please start Monday.', senderId: fadi._id, relatedType: 'application', read: true, createdAt: daysAgo(28) },
    { userId: omar._id,  type: 'project_started',      title: 'Project started',         message: 'The project "Mansour Trading — Virtual Assistant Support" has started.', senderId: fadi._id, relatedType: 'project', read: true, createdAt: daysAgo(22) },
    { userId: karim._id, type: 'application_accepted', title: 'Proposal accepted!',      message: "Nour Abi Nader accepted your proposal for \"E-commerce Website for Fashion Brand\". Let's get started!", senderId: nour._id, relatedType: 'application', read: true, createdAt: daysAgo(10) },
  ];

  let notifCount = 0;
  for (const n of notifData) {
    const exists = await Notification.findOne({ userId: n.userId, type: n.type, createdAt: n.createdAt });
    if (!exists) { await Notification.create(n); notifCount++; }
  }
  console.log(`  ✓  ${notifCount} notifications inserted.`);

  // ── 9. Reviews ────────────────────────────────────────────────────────────────
  console.log('\n── Reviews ──────────────────────────────────────────────────');

  const reviewsData = [
    { reviewerId: georges._id, revieweeId: rania._id,  projectId: project2._id, reviewerType: 'client', rating: 5, comment: "Rania is an exceptional React Native developer. Delivered clean, well-structured code on time and communicated proactively throughout. I'll definitely hire her again.", createdAt: daysAgo(2) },
    { reviewerId: fadi._id,    revieweeId: mayaH._id,  projectId: project3._id, reviewerType: 'client', rating: 5, comment: "Maya's translations are accurate, professional, and fast. She flagged an ambiguity in one contract that saved us from a potential misunderstanding. Highly recommended!", createdAt: daysAgo(3) },
    { reviewerId: fadi._id,    revieweeId: omar._id,   projectId: project4._id, reviewerType: 'client', rating: 4, comment: "Omar is organized, responsive, and handles tasks independently. Still building experience but already a reliable VA.", createdAt: daysAgo(5) },
    { reviewerId: saba._id,    revieweeId: jp._id,     projectId: project1._id, reviewerType: 'client', rating: 5, comment: "JP is an outstanding full-stack developer. The platform he's building is exactly what we envisioned. Clean code, fast delivery, always one step ahead.", createdAt: daysAgo(20) },
  ];

  let reviewCount = 0;
  for (const r of reviewsData) {
    const exists = await Review.findOne({ reviewerId: r.reviewerId, revieweeId: r.revieweeId });
    if (!exists) { await Review.create(r); reviewCount++; }
  }
  console.log(`  ✓  ${reviewCount} reviews inserted.`);

  // ── Done ──────────────────────────────────────────────────────────────────────
  await mongoose.disconnect();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    Seed Complete ✓                           ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  JP accounts                    password: 123456             ║');
  console.log('║    jeanpaul@freelancer.com   |  saba@client.com              ║');
  console.log('║  Demo accounts                  password: Demo1234!          ║');
  console.log('║    rami.khoury@demo.com      |  nabil.haddad@demo.com        ║');
  console.log('║    lara.mansour@demo.com     |  maya.saleh@demo.com          ║');
  console.log('║  Lebanese personas              password: Lance2026!          ║');
  console.log('║    karim.nassar@lancelb.demo    rania.saleh@lancelb.demo     ║');
  console.log('║    jad.merhi@lancelb.demo       omar.zreik@lancelb.demo      ║');
  console.log('║    maya.haddad@lancelb.demo     tony.rizk@lancelb.demo       ║');
  console.log('║    nour.abinader@lancelb.demo   georges.karam@lancelb.demo   ║');
  console.log('║    dina.azar@lancelb.demo       fadi.mansour@lancelb.demo    ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Jobs: 12  |  Apps: 13  |  Projects: 4  |  Crews: 4        ║`);
  console.log(`║  DMs: ${String(dmCount).padEnd(3)} |  Crew msgs: ${String(crewMsgCount).padEnd(3)} |  Notifs: ${String(notifCount).padEnd(3)} |  Reviews: ${String(reviewCount).padEnd(2)}  ║`);
  console.log('╚══════════════════════════════════════════════════════════════╚');
}

seed().catch(err => { console.error(err); process.exit(1); });
