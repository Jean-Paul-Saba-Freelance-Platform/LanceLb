import { useState, useEffect } from 'react'
import { getInitialTheme } from './theme'

export const useTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark'
      setTheme(current)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    return () => observer.disconnect()
  }, [])

  return theme
}
