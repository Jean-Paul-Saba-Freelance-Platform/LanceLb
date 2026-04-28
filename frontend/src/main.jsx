import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme, getInitialTheme } from './lib/theme'
import whiteFavicon from '../Assets/white favicon.svg'

applyTheme(getInitialTheme())

const faviconEl = document.getElementById('app-favicon')
if (faviconEl) faviconEl.href = whiteFavicon

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

