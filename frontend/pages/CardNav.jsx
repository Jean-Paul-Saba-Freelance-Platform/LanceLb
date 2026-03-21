import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { GoArrowUpRight } from 'react-icons/go'
import { LuSun, LuMoon } from 'react-icons/lu'
import { useTheme } from '../src/lib/useTheme'
import { toggleTheme } from '../src/lib/theme'
import './CardNav.css'

// LanceLB floating card navbar — expands on hamburger click to show nav cards
const CardNav = ({ ease = 'power3.out' }) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const navRef = useRef(null)
  const cardsRef = useRef([])
  const tlRef = useRef(null)

  const theme = useTheme()
  const navigate = useNavigate()

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const brandLink = user?.userType === 'freelancer'
    ? '/freelancer/home'
    : user?.userType === 'client'
      ? '/client/home'
      : '/'

  const items = [
    {
      label: 'Browse',
      links: [
        { label: 'Development & IT', href: '#development' },
        { label: 'Design & Creative', href: '#design' },
        { label: 'Sales & Marketing', href: '#sales' },
        { label: 'All Categories', href: '#categories' },
      ],
    },
    {
      label: 'Freelancers',
      links: [
        { label: 'Create a Profile', href: '/signup?role=freelancer' },
        { label: 'Browse Jobs', href: '/freelancer/home' },
        { label: 'How It Works', href: '#features' },
      ],
    },
    {
      label: 'Clients',
      links: [
        { label: 'Post a Job', href: '/signup?role=client' },
        { label: 'Browse Talent', href: '/freelancer/home' },
        { label: 'How It Works', href: '#features' },
      ],
    },
  ]

  const calculateHeight = () => {
    const navEl = navRef.current
    if (!navEl) return 260
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content')
      if (contentEl) {
        const wasVis = contentEl.style.visibility
        const wasPtr = contentEl.style.pointerEvents
        const wasPos = contentEl.style.position
        const wasH   = contentEl.style.height

        contentEl.style.visibility = 'visible'
        contentEl.style.pointerEvents = 'auto'
        contentEl.style.position = 'static'
        contentEl.style.height = 'auto'
        contentEl.offsetHeight

        const topBar = 60
        const padding = 16
        const contentHeight = contentEl.scrollHeight

        contentEl.style.visibility = wasVis
        contentEl.style.pointerEvents = wasPtr
        contentEl.style.position = wasPos
        contentEl.style.height = wasH

        return topBar + contentHeight + padding
      }
    }
    return 260
  }

  const createTimeline = () => {
    const navEl = navRef.current
    if (!navEl) return null

    gsap.set(navEl, { height: 60, overflow: 'hidden' })
    gsap.set(cardsRef.current, { y: 50, opacity: 0 })

    const tl = gsap.timeline({ paused: true })
    tl.to(navEl, { height: calculateHeight, duration: 0.4, ease })
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1')
    return tl
  }

  useLayoutEffect(() => {
    const tl = createTimeline()
    tlRef.current = tl
    return () => { tl?.kill(); tlRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease])

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return
      if (isExpanded) {
        const newHeight = calculateHeight()
        gsap.set(navRef.current, { height: newHeight })
        tlRef.current.kill()
        const newTl = createTimeline()
        if (newTl) { newTl.progress(1); tlRef.current = newTl }
      } else {
        tlRef.current.kill()
        const newTl = createTimeline()
        if (newTl) { tlRef.current = newTl }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded])

  const toggleMenu = () => {
    const tl = tlRef.current
    if (!tl) return
    if (!isExpanded) {
      setIsHamburgerOpen(true)
      setIsExpanded(true)
      tl.play(0)
    } else {
      setIsHamburgerOpen(false)
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false))
      tl.reverse()
    }
  }

  const closeMenu = () => {
    if (!isExpanded) return
    const tl = tlRef.current
    if (!tl) return
    setIsHamburgerOpen(false)
    tl.eventCallback('onReverseComplete', () => setIsExpanded(false))
    tl.reverse()
  }

  const setCardRef = i => el => { if (el) cardsRef.current[i] = el }

  // Render a link — internal if starts with '/', anchor if starts with '#'
  const renderLink = (lnk, i) => {
    const isInternal = lnk.href?.startsWith('/')
    const isAnchor = lnk.href?.startsWith('#')
    const cls = 'card-nav-link'
    if (isInternal) {
      return (
        <Link key={i} to={lnk.href} className={cls} onClick={closeMenu} aria-label={lnk.label}>
          <GoArrowUpRight className="card-nav-link-icon" aria-hidden="true" />
          {lnk.label}
        </Link>
      )
    }
    if (isAnchor) {
      return (
        <a key={i} href={lnk.href} className={cls} onClick={closeMenu} aria-label={lnk.label}>
          <GoArrowUpRight className="card-nav-link-icon" aria-hidden="true" />
          {lnk.label}
        </a>
      )
    }
    return (
      <a key={i} href={lnk.href} className={cls} onClick={closeMenu} aria-label={lnk.label}>
        <GoArrowUpRight className="card-nav-link-icon" aria-hidden="true" />
        {lnk.label}
      </a>
    )
  }

  return (
    <div className="card-nav-outer">
      <nav ref={navRef} className={`card-nav-pill ${isExpanded ? 'open' : ''}`}>
        {/* Top bar — always visible */}
        <div className="card-nav-topbar">
          <div className="card-nav-left-controls">
            <button
              className={`card-nav-hamburger ${isHamburgerOpen ? 'open' : ''}`}
              onClick={toggleMenu}
              aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            >
              <div className="hb-line" />
              <div className="hb-line" />
            </button>
            <button
              className="card-nav-theme-toggle"
              onClick={() => toggleTheme(theme)}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <LuSun size={17} /> : <LuMoon size={17} />}
            </button>
          </div>

          <Link to={brandLink} className="card-nav-brand">
            Open Hand
          </Link>

          <div className="card-nav-auth">
            <Link to="/login" className="card-nav-login">Log in</Link>
            <Link to="/signup" className="card-nav-cta">Get started</Link>
          </div>
        </div>

        {/* Expanded cards */}
        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {items.map((item, idx) => (
            <div key={item.label} className={`card-nav-card card-nav-card--${idx}`} ref={setCardRef(idx)}>
              <div className="card-nav-card-label">{item.label}</div>
              <div className="card-nav-card-links">
                {item.links.map((lnk, i) => renderLink(lnk, i))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default CardNav
