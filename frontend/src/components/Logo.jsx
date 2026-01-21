import React from 'react'
import './Logo.css'

const Logo = ({ size = 80, animated = true }) => {
  return (
    <div className={`logo-container ${animated ? 'animated' : ''}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="freelancer-logo"
      >
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2"
          className="logo-circle"
        />
        
        {/* Lance (thrown) */}
        <g className="lance-group">
          <line
            x1="140"
            y1="60"
            x2="180"
            y2="40"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth="3"
            strokeLinecap="round"
            className="lance-shaft"
          />
          <polygon
            points="180,40 185,38 183,42 180,40"
            fill="rgba(255, 255, 255, 0.9)"
            className="lance-tip"
          />
          {/* Lance trail effect */}
          <line
            x1="140"
            y1="60"
            x2="180"
            y2="40"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="8"
            strokeLinecap="round"
            className="lance-trail"
          />
        </g>

        {/* Freelancer figure */}
        <g className="freelancer-group">
          {/* Head */}
          <circle
            cx="100"
            cy="80"
            r="12"
            fill="rgba(255, 255, 255, 0.7)"
            className="head"
          />
          
          {/* Helmet */}
          <path
            d="M 88 80 Q 100 70 112 80 L 110 85 Q 100 90 90 85 Z"
            fill="rgba(255, 255, 255, 0.5)"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="1.5"
            className="helmet"
          />
          
          {/* Body/Torso */}
          <rect
            x="90"
            y="92"
            width="20"
            height="30"
            rx="3"
            fill="rgba(255, 255, 255, 0.6)"
            className="torso"
          />
          
          {/* Throwing arm (extended) */}
          <line
            x1="110"
            y1="100"
            x2="140"
            y2="60"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="4"
            strokeLinecap="round"
            className="throwing-arm"
          />
          
          {/* Other arm */}
          <line
            x1="90"
            y1="100"
            x2="75"
            y2="110"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="4"
            strokeLinecap="round"
            className="other-arm"
          />
          
          {/* Legs */}
          <line
            x1="100"
            y1="122"
            x2="95"
            y2="150"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="5"
            strokeLinecap="round"
            className="leg-left"
          />
          <line
            x1="100"
            y1="122"
            x2="105"
            y2="150"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="5"
            strokeLinecap="round"
            className="leg-right"
          />
          
          {/* Cape/Cloak */}
          <path
            d="M 90 92 Q 85 100 80 110 Q 75 120 70 130 Q 85 125 90 115 Q 95 105 100 100"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="3"
            strokeLinecap="round"
            className="cape"
          />
        </g>

        {/* Motion lines */}
        <g className="motion-lines">
          <line
            x1="50"
            y1="100"
            x2="85"
            y2="100"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="2"
            strokeDasharray="5,5"
            className="motion-line-1"
          />
          <line
            x1="50"
            y1="110"
            x2="80"
            y2="110"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="2"
            strokeDasharray="5,5"
            className="motion-line-2"
          />
        </g>
      </svg>
    </div>
  )
}

export default Logo

