import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Dither from './Dither'
import GooeyNav from './GooeyNav'
import './Home.css'

const Home = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="landing-container">
      <div className="landing-dither">
        <Dither
          waveColor={[0.58, 0.3, 0.96]}
          disableAnimation={false}
          enableMouseInteraction={false}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.02}
        />
      </div>

      {/* Simplified Header with only GooeyNav */}
      <header className="header">
        <div className="header-categories">
          <div className="header-content header-content-center">
            <GooeyNav
              items={[
                { label: 'Development & IT', href: '#development' },
                { label: 'Design & Creative', href: '#design' },
                { label: 'Sales & Marketing', href: '#sales' },
                { label: 'Admin & Support', href: '#admin' },
                { label: 'More', href: '#more' }
              ]}
            />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
        <div className="sidebar-content glass-sidebar">
          <div className="sidebar-header">
            <Link to="/" className="brand-link" onClick={closeSidebar}>
              <span className="brand-name">LanceLB</span>
            </Link>
            <button
              className="sidebar-close"
              onClick={closeSidebar}
              aria-label="Close menu"
            >
              x
            </button>
          </div>

          <nav className="sidebar-nav">
            <a href="#development" className="sidebar-link" onClick={closeSidebar}>Development & IT</a>
            <a href="#design" className="sidebar-link" onClick={closeSidebar}>Design & Creative</a>
            <a href="#sales" className="sidebar-link" onClick={closeSidebar}>Sales & Marketing</a>
            <a href="#admin" className="sidebar-link" onClick={closeSidebar}>Admin & Support</a>
          </nav>

          <div className="sidebar-actions">
            <Link to="/login" className="sidebar-button" onClick={closeSidebar}>
              Log in
            </Link>
            <Link to="/signup" className="sidebar-button sidebar-button-primary" onClick={closeSidebar}>
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">LanceLB</h1>
            <p className="hero-subtitle">
              Find the right freelancer to begin working on your project within minutes.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="hero-cta-button">
                Get started
              </Link>
              <Link to="/login" className="hero-secondary-button">
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="features-container">
            <div className="feature-tile glass">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 className="feature-title">Over 1M reviews</h3>
              <p className="feature-description">
                Trusted by millions of clients and freelancers worldwide
              </p>
            </div>

            <div className="feature-tile glass">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3 className="feature-title">Protected payments</h3>
              <p className="feature-description">
                Secure escrow system ensures you only pay for work you approve
              </p>
            </div>

            <div className="feature-tile glass">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className="feature-title">Hire who you need</h3>
              <p className="feature-description">
                Access to skilled professionals across all industries
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <p className="footer-text">
            © 2024 LanceLB. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Home
