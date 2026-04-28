import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme, getInitialTheme } from './lib/theme'
import mintFavicon from '../Assets/mint favicon.png'

applyTheme(getInitialTheme())

const faviconEl = document.getElementById('app-favicon')
if (faviconEl) faviconEl.href = mintFavicon

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

