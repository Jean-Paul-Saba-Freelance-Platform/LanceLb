import React, { useState, useEffect } from 'react'
import TopNav from '../src/components/TopNav.jsx'
import JobCard from '../src/components/JobCard.jsx'
import RightSidebarCard from '../src/components/RightSidebarCard.jsx'
import './FreelancerHomePage.css'

const FreelancerHomePage = () => {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('bestMatches')
  const [searchQuery, setSearchQuery] = useState('')
  const [profileProgress, setProfileProgress] = useState(40)

  // Mock jobs data
  const mockJobs = [
    {
      id: 1,
      postedTime: 'Posted yesterday',
      title: 'Arabic Proofreader & Transcriber',
      type: 'Hourly',
      experience: 'Intermediate',
      duration: 'Ongoing',
      description: 'We are looking for an experienced Arabic proofreader and transcriber to work on various projects. Must have excellent attention to detail and native-level Arabic proficiency.',
      tags: ['Proofreading', 'Arabic', 'General Transcription'],
      paymentVerified: true,
      rating: 4.8,
      spent: '$5k+ spent',
      location: 'Lebanon',
      proposals: '5-10',
      category: 'bestMatches'
    },
    {
      id: 2,
      postedTime: 'Posted 2 days ago',
      title: 'React Developer for E-commerce Platform',
      type: 'Fixed-price',
      experience: 'Expert',
      duration: '1-3 months',
      description: 'Looking for an experienced React developer to build a modern e-commerce platform. Must have experience with React, TypeScript, and payment integrations.',
      tags: ['React', 'TypeScript', 'E-commerce', 'Payment Integration'],
      paymentVerified: true,
      rating: 4.9,
      spent: '$10k+ spent',
      location: 'United States',
      proposals: '10-15',
      category: 'bestMatches'
    },
    {
      id: 3,
      postedTime: 'Posted 3 days ago',
      title: 'UI/UX Designer for Mobile App',
      type: 'Hourly',
      experience: 'Intermediate',
      duration: '1-2 months',
      description: 'We need a talented UI/UX designer to create beautiful and intuitive designs for our mobile application. Experience with Figma and design systems required.',
      tags: ['UI/UX Design', 'Figma', 'Mobile App', 'Design Systems'],
      paymentVerified: false,
      rating: 4.5,
      spent: '$2k+ spent',
      location: 'United Kingdom',
      proposals: 'Less than 5',
      category: 'recent'
    },
    {
      id: 4,
      postedTime: 'Posted 4 days ago',
      title: 'Content Writer for Tech Blog',
      type: 'Fixed-price',
      experience: 'Entry level',
      duration: 'Ongoing',
      description: 'Seeking a skilled content writer to create engaging articles for our technology blog. Topics include web development, AI, and software engineering.',
      tags: ['Content Writing', 'Blogging', 'Technology', 'SEO'],
      paymentVerified: true,
      rating: 4.7,
      spent: '$3k+ spent',
      location: 'Canada',
      proposals: '5-10',
      category: 'bestMatches'
    },
    {
      id: 5,
      postedTime: 'Posted 5 days ago',
      title: 'Full Stack Developer - Node.js & React',
      type: 'Hourly',
      experience: 'Expert',
      duration: '3-6 months',
      description: 'Join our team as a full stack developer working on cutting-edge web applications. Must be proficient in Node.js, React, and database design.',
      tags: ['Node.js', 'React', 'Full Stack', 'Database Design'],
      paymentVerified: true,
      rating: 5.0,
      spent: '$20k+ spent',
      location: 'Australia',
      proposals: '15-20',
      category: 'recent'
    },
    {
      id: 6,
      postedTime: 'Posted 1 week ago',
      title: 'Social Media Manager',
      type: 'Hourly',
      experience: 'Intermediate',
      duration: 'Ongoing',
      description: 'We are looking for an experienced social media manager to handle our brand presence across multiple platforms. Experience with analytics and content creation required.',
      tags: ['Social Media', 'Content Creation', 'Analytics', 'Marketing'],
      paymentVerified: true,
      rating: 4.6,
      spent: '$8k+ spent',
      location: 'Germany',
      proposals: '10-15',
      category: 'saved'
    }
  ]

  useEffect(() => {
    // Get user from localStorage
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        setUser(JSON.parse(userStr))
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }, [])

  // Get current date and greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Filter jobs based on active tab and search query
  const getFilteredJobs = () => {
    let filtered = mockJobs

    // Filter by tab
    if (activeTab === 'bestMatches') {
      filtered = mockJobs.filter(job => job.category === 'bestMatches')
    } else if (activeTab === 'recent') {
      filtered = mockJobs.filter(job => job.category === 'recent')
    } else if (activeTab === 'saved') {
      filtered = mockJobs.filter(job => job.category === 'saved')
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    return filtered
  }

  const filteredJobs = getFilteredJobs()
  // Use fallback name if no user in localStorage (for preview/testing)
  const userName = user?.name || user?.firstName || 'Freelancer'

  return (
    <div className="freelancer-home">
      <TopNav userName={userName} />

      <div className="freelancer-home-container">
        {/* Main Content */}
        <div className="freelancer-main-content">
          {/* Greeting Card */}
          <div className="greeting-card">
            <div className="greeting-content">
              <div className="greeting-date">{getCurrentDate()}</div>
              <h2 className="greeting-text">{getGreeting()}, {userName}.</h2>
            </div>
            <div className="greeting-illustration">
              <div className="illustration-placeholder">
                <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="40" fill="#a855f7" opacity="0.2"/>
                  <path d="M30 50 L45 65 L70 35" stroke="#a855f7" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="jobs-search-bar">
            <input
              type="text"
              placeholder="Search for jobs"
              className="jobs-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Section Title */}
          <h2 className="section-title">Jobs you might like</h2>

          {/* Tabs */}
          <div className="jobs-tabs">
            <button
              className={`tab-button ${activeTab === 'bestMatches' ? 'active' : ''}`}
              onClick={() => setActiveTab('bestMatches')}
            >
              Best Matches
            </button>
            <button
              className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveTab('recent')}
            >
              Most Recent
            </button>
            <button
              className={`tab-button ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved Jobs
            </button>
          </div>

          {/* Jobs Feed */}
          <div className="jobs-feed">
            {filteredJobs.length > 0 ? (
              filteredJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <div className="no-jobs-message">
                <p>No jobs found. Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="freelancer-sidebar">
          {/* Profile Strength Card */}
          <RightSidebarCard title="Profile Strength">
            <div className="profile-progress-content">
              <div className="profile-avatar-large">
                {user?.avatar ? (
                  <img src={user.avatar} alt={userName} />
                ) : (
                  <div className="avatar-placeholder-large">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h4 className="profile-name">{userName}</h4>
              <p className="profile-category">Freelancer</p>
              <p className="sidebar-text">Improve your profile to get better matches.</p>
              <div className="profile-progress-section">
                <div className="profile-progress-header">
                  <span>Profile strength: {profileProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${profileProgress}%` }}></div>
                </div>
              </div>
              <button className="sidebar-button-secondary">Update profile</button>
            </div>
          </RightSidebarCard>

          {/* Trust & Safety Card */}
          <RightSidebarCard title="Trust & Safety">
            <p className="sidebar-text">Add verification steps to increase trust.</p>
            <button className="sidebar-button-primary">Verify account</button>
          </RightSidebarCard>

          {/* Promote with Ads Card */}
          <RightSidebarCard title="Promote with ads" collapsible={true} defaultExpanded={true}>
            <div className="promote-options">
              <div className="promote-option">
                <div className="promote-option-content">
                  <span className="promote-option-label">Availability badge</span>
                  <span className="promote-option-desc">Show clients you're available</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="promote-option">
                <div className="promote-option-content">
                  <span className="promote-option-label">Boost your profile</span>
                  <span className="promote-option-desc">Get more visibility</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </RightSidebarCard>

          {/* Credits Card */}
          <RightSidebarCard title="Credits">
            <div className="credits-content">
              <div className="credits-amount">Credits: 0</div>
              <button className="sidebar-button-primary">Get Credits</button>
              <a href="#" className="sidebar-link">Learn more</a>
            </div>
          </RightSidebarCard>

          {/* Preferences Card */}
          <RightSidebarCard title="Preferences" collapsible={true} defaultExpanded={false}>
            <p className="sidebar-text">Manage your job preferences, notifications, and account settings.</p>
          </RightSidebarCard>
        </div>
      </div>
    </div>
  )
}

export default FreelancerHomePage
