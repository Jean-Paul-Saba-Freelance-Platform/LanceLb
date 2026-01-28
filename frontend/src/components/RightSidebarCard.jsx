import React, { useState } from 'react'
import './RightSidebarCard.css'

const RightSidebarCard = ({ title, children, collapsible = false, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (!collapsible) {
    return (
      <div className="sidebar-card">
        {title && <h3 className="sidebar-card-title">{title}</h3>}
        <div className="sidebar-card-content">{children}</div>
      </div>
    )
  }

  return (
    <div className="sidebar-card">
      <div className="sidebar-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="sidebar-card-title">{title}</h3>
        <button className="sidebar-card-toggle" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={isExpanded ? 'expanded' : ''}
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </div>
      {isExpanded && <div className="sidebar-card-content">{children}</div>}
    </div>
  )
}

export default RightSidebarCard
