import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Code2, Palette, TrendingUp, Headphones, PenTool, DollarSign, Wrench, Scale, Users, BarChart2, Globe, Camera } from 'lucide-react'
import { motion } from 'motion/react'
import Grainient from '../src/components/Grainient'
import CountUp from './CountUp'
import GradientText from './GradientText'
import BorderGlow from './BorderGlow'
import ShinyText from './ShinyText'
import CardNav from './CardNav'
import { useTheme } from '../src/lib/useTheme'
import './Home.css'

// GLOW is computed inside the component so it responds to theme changes

const CATEGORIES = [
  { icon: <Code2 size={28} color="#00a884" />,     label: 'Development & IT',      slug: 'development' },
  { icon: <Palette size={28} color="#00a884" />,   label: 'Design & Creative',     slug: 'design' },
  { icon: <TrendingUp size={28} color="#00a884" />,label: 'Sales & Marketing',     slug: 'marketing' },
  { icon: <Headphones size={28} color="#00a884" />,label: 'Admin & Support',       slug: 'admin' },
  { icon: <PenTool size={28} color="#00a884" />,   label: 'Writing & Content',     slug: 'writing' },
  { icon: <DollarSign size={28} color="#00a884" />,label: 'Finance & Accounting',  slug: 'finance' },
  { icon: <Wrench size={28} color="#00a884" />,    label: 'Engineering',           slug: 'engineering' },
  { icon: <Scale size={28} color="#00a884" />,     label: 'Legal',                 slug: 'legal' },
  { icon: <Users size={28} color="#00a884" />,     label: 'HR & Training',         slug: 'hr' },
  { icon: <BarChart2 size={28} color="#00a884" />, label: 'Data Science & AI',     slug: 'data-science' },
  { icon: <Globe size={28} color="#00a884" />,     label: 'Translation',           slug: 'translation' },
  { icon: <Camera size={28} color="#00a884" />,    label: 'Photography & Video',   slug: 'media' },
]

const HIRING_STEPS = [
  {
    num: '01',
    title: 'Post a Job',
    desc: 'Describe your project, set your budget, and list the skills you need. Takes less than 5 minutes.',
  },
  {
    num: '02',
    title: 'Review Proposals',
    desc: 'Browse AI-ranked applications, review portfolios, and chat with candidates before deciding.',
  },
  {
    num: '03',
    title: 'Get It Done',
    desc: 'Collaborate through our platform, approve milestones, and release payment only when satisfied.',
  },
]

const FREELANCER_STEPS = [
  {
    num: '01',
    title: 'Build Your Profile',
    desc: 'Showcase your skills, experience, and portfolio. The stronger your profile, the better your matches.',
  },
  {
    num: '02',
    title: 'Find & Apply',
    desc: 'Browse jobs matched to your skillset by our AI engine, and submit tailored proposals.',
  },
  {
    num: '03',
    title: 'Deliver & Earn',
    desc: 'Complete work, get paid securely, and build your reputation with verified client reviews.',
  },
]

const MotionLink = motion(Link)

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const Home = () => {
  const theme = useTheme()

  // Shared BorderGlow props — switches background and fill for light/dark
  const GLOW = {
    glowColor: '162 70 55',
    backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(14, 12, 20, 0.6)',
    borderRadius: 22,
    glowRadius: 35,
    glowIntensity: theme === 'light' ? 0.75 : 0.9,
    coneSpread: 25,
    edgeSensitivity: 25,
    fillOpacity: theme === 'light' ? 0.12 : 0.35,
    colors: ['#00a884', '#0d9a76', '#1a6b58'],
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('hiring')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/public/stats`)
      .then(r => r.json())
      .then(data => { if (data.success) setStats(data.stats) })
      .catch(() => {}) // silent fail — keeps hardcoded fallback
  }, [])
  const navigate = useNavigate()

  // Navigate to freelancer search with the entered query
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/freelancer/home?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const steps = activeTab === 'hiring' ? HIRING_STEPS : FREELANCER_STEPS

  return (
    <div className="landing-container">
      <div className="landing-dither">
        <Grainient
          color1={theme === 'light' ? '#00a884' : '#00A884'}
          color2={theme === 'light' ? '#d6f0ea' : '#111B21'}
          color3={theme === 'light' ? '#eaf7f3' : '#202C33'}
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={theme === 'light' ? 1.1 : 1.5}
          gamma={1}
          saturation={theme === 'light' ? 0.6 : 1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>

      <CardNav />

      {/* Main Content */}
      <main className="landing-main">

        {/* ── HERO ── */}
        <section className="hero-section">
          <motion.div className="hero-content" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <div className="hero-badge">Lebanon's Freelance Marketplace</div>
            <h1 className="hero-title">
              <ShinyText text="Hire the " color="#7a9aaa" shineColor="#ffffff" speed={3} spread={90} delay={0.5} />
              <span className="hero-accent">talent</span>
              <ShinyText text=" your" color="#7a9aaa" shineColor="#ffffff" speed={3} spread={90} delay={0.5} />
              <br />
              <span className="hero-accent">business</span>
              <ShinyText text=" needs" color="#7a9aaa" shineColor="#ffffff" speed={3} spread={90} delay={1.2} />
            </h1>
            <p className="hero-subtitle">
              Find the right freelancer to begin working on your project within minutes.
            </p>
            
            <div className="hero-actions">
              <MotionLink to="/signup" className="hero-cta-button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>Get started</MotionLink>
              <MotionLink to="/login" className="hero-secondary-button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>Sign in</MotionLink>
            </div>
          </motion.div>
        </section>

        {/* ── KPI STRIP ── */}
        <section className="kpi-section">
          <p className="kpi-eyebrow">Growing every day</p>
          <div className="kpi-grid">
            <BorderGlow {...GLOW}>
              <div className="kpi-card">
                <span className="kpi-value">
                  <GradientText><CountUp from={0} to={stats ? stats.totalFreelancers : 15} duration={2} className="stat-number" startWhen={!!stats} />+</GradientText>
                </span>
                <span className="kpi-label">Registered Freelancers</span>
              </div>
            </BorderGlow>
            <BorderGlow {...GLOW}>
              <div className="kpi-card">
                <span className="kpi-value">
                  <GradientText><CountUp from={0} to={stats ? stats.totalJobs : 7} duration={2} className="stat-number" startWhen={!!stats} />+</GradientText>
                </span>
                <span className="kpi-label">Jobs Posted</span>
              </div>
            </BorderGlow>
            <BorderGlow {...GLOW}>
              <div className="kpi-card">
                <span className="kpi-value">
                  <GradientText><CountUp from={0} to={stats ? stats.totalApplications : 15} duration={2} className="stat-number" startWhen={!!stats} />+</GradientText>
                </span>
                <span className="kpi-label">Proposals Submitted</span>
              </div>
            </BorderGlow>
            <BorderGlow {...GLOW}>
              <div className="kpi-card">
                <span className="kpi-value">
                  <GradientText><CountUp from={0} to={stats ? stats.jobFillRate : 71} duration={2} className="stat-number" startWhen={!!stats} />%</GradientText>
                </span>
                <span className="kpi-label">Job Fill Rate</span>
              </div>
            </BorderGlow>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="features" className="how-section">
          <h2 className="section-title">How it works</h2>
          <div className="how-tabs-wrap">
            <div className="how-tabs">
              <button
                className={`how-tab ${activeTab === 'hiring' ? 'active' : ''}`}
                onClick={() => setActiveTab('hiring')}
              >
                For Hiring
              </button>
              <button
                className={`how-tab ${activeTab === 'freelancing' ? 'active' : ''}`}
                onClick={() => setActiveTab('freelancing')}
              >
                For Finding Work
              </button>
            </div>
          </div>
          <div className="how-steps">
            {steps.map((step) => (
              <BorderGlow key={step.num} {...GLOW}>
                <div className="how-card">
                  <span className="how-step-num">{step.num}</span>
                  <h3 className="how-step-title">{step.title}</h3>
                  <p className="how-step-desc">{step.desc}</p>
                </div>
              </BorderGlow>
            ))}
          </div>
        </section>

        {/* ── CATEGORY GRID ── */}
        <section id="categories" className="categories-section">
          <h2 className="section-title">Find freelancers for every type of work</h2>
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <BorderGlow key={cat.slug} {...GLOW} borderRadius={22}>
                <Link
                  to={`/freelancer/home?category=${cat.slug}`}
                  className="category-card"
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-label">{cat.label}</span>
                </Link>
              </BorderGlow>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <BorderGlow {...GLOW} glowRadius={45} glowIntensity={1.0} edgeSensitivity={20}>
          <section className="cta-banner">
            <h2 className="cta-title">Ready to get started?</h2>
            <p className="cta-subtitle">Join Lebanon's growing freelance community today.</p>
            <div className="cta-actions">
              <Link to="/signup?role=client" className="cta-primary-button">Hire a Freelancer</Link>
              <Link to="/signup?role=freelancer" className="cta-secondary-button">Find Work</Link>
            </div>
          </section>
        </BorderGlow>

      </main>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <span className="footer-brand-name">LanceLB</span>
            <p className="footer-tagline">
              Lebanon's dedicated freelance marketplace.<br />Built for talent, built for growth.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4 className="footer-col-title">For Clients</h4>
              <Link to="/signup?role=client" className="footer-link">Post a Job</Link>
              <a href="#categories" className="footer-link">Browse Categories</a>
              <Link to="/login" className="footer-link">Sign In</Link>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">For Freelancers</h4>
              <Link to="/signup?role=freelancer" className="footer-link">Create a Profile</Link>
              <Link to="/freelancer/home" className="footer-link">Browse Jobs</Link>
              <Link to="/login" className="footer-link">Sign In</Link>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Platform</h4>
              <a href="#features" className="footer-link">How It Works</a>
              <a href="#categories" className="footer-link">Categories</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 LanceLB. All rights reserved. Made in Lebanon 🇱🇧</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
