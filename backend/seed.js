import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './server/models/userModels.js';

const MONGO_URI = process.env.MONGO_URI;

const freelancers = [
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
    skills: ['Figma', 'React', 'CSS', 'UI Design', 'Prototyping', 'Tailwind CSS'],
    experienceLevel: 'intermediate',
  },
];

const clients = [
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

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const all = [...freelancers, ...clients];

  for (const u of all) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`  Skipping ${u.email} — already exists`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ ...u, password: hashed, isAccountVerified: true });
    console.log(`  Created ${u.userType}: ${u.name} (${u.email})`);
  }

  console.log('\nDone. All accounts use password: Demo1234!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
