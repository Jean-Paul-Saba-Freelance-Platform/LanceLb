import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'

const Landing = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  // Smooth scroll for anchor links
  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target.closest('a')
      if (target) {
        const href = target.getAttribute('href')
        if (href && href.startsWith('#')) {
          e.preventDefault()
          const element = document.querySelector(href)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Mock freelancer profiles
  const freelancers = [
    { name: 'Sarah Chen', role: 'UI/UX Designer', avatar: '👩‍💻' },
    { name: 'Michael Torres', role: 'Full Stack Dev', avatar: '👨‍💻' },
    { name: 'Emma Wilson', role: 'Marketing Expert', avatar: '👩‍💼' },
    { name: 'David Kim', role: 'Data Analyst', avatar: '👨‍🔬' },
  ]

  return (
    <div className="landing-container">
      {/* Two-Level Header */}
      <header className="header">
        {/* Top Row */}
        <div className="header-top glass glass-header">
          <div className="header-content">
            <div className="header-brand">
              <Link to="/" className="brand-link">
                <span className="brand-logo">💼</span>
                <span className="brand-name">FreelanceHub</span>
              </Link>
            </div>

            <div className="header-actions">
              <Link to="/login" className="nav-link-button">Log in</Link>
              <Link to="/signup" className="nav-cta-button">Sign up</Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-button"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <span className={`menu-line ${sidebarOpen ? 'open' : ''}`}></span>
              <span className={`menu-line ${sidebarOpen ? 'open' : ''}`}></span>
              <span className={`menu-line ${sidebarOpen ? 'open' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* Second Row - Categories */}
        <div className="header-categories glass glass-header">
          <div className="header-content">
            <nav className="categories-nav">
              <a href="#development" className="category-link">Development & IT</a>
              <a href="#design" className="category-link">Design & Creative</a>
              <a href="#sales" className="category-link">Sales & Marketing</a>
              <a href="#admin" className="category-link">Admin & Support</a>
              <a href="#more" className="category-link">More</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
        <div className="sidebar-content glass-sidebar">
          <div className="sidebar-header">
            <Link to="/" className="brand-link" onClick={closeSidebar}>
              <span className="brand-logo">💼</span>
              <span className="brand-name">FreelanceHub</span>
            </Link>
            <button 
              className="sidebar-close"
              onClick={closeSidebar}
              aria-label="Close menu"
            >
              ×
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
            <h1 className="hero-title">
              Build your business with top freelancers
            </h1>
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

          {/* Floating Profile Cards - 4 cards, 2 left, 2 right */}
          <div className="hero-profiles">
            {freelancers.slice(0, 4).map((freelancer, index) => (
              <div 
                key={index} 
                className="profile-card glass"
                style={{
                  '--delay': `${index * 0.2}s`,
                  '--offset-x': index % 2 === 0 ? '-15px' : '15px',
                  '--offset-y': `${index * 25}px`
                }}
              >
                <div className="profile-avatar">{freelancer.avatar}</div>
                <div className="profile-info">
                  <div className="profile-name">{freelancer.name}</div>
                  <div className="profile-role">{freelancer.role}</div>
                </div>
              </div>
            ))}
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
            © 2024 FreelanceHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
