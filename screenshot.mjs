import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots')
const AUTH_FILE = path.join(__dirname, '.screenshot-auth.json')
const VIEWPORT = { width: 1440, height: 900 }

function getNextIndex() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
    return 1
  }
  const files = fs.readdirSync(SCREENSHOTS_DIR)
    .filter(f => f.startsWith('screenshot-') && f.endsWith('.png'))
    .map(f => { const match = f.match(/screenshot-(\d+)/); return match ? parseInt(match[1]) : 0 })
  return files.length > 0 ? Math.max(...files) + 1 : 1
}

function loadAuth() {
  if (!fs.existsSync(AUTH_FILE)) {
    console.log('⚠️  No .screenshot-auth.json found. Create it with your token and user info.')
    return null
  }
  try {
    return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'))
  } catch {
    console.error('❌ Failed to parse .screenshot-auth.json')
    return null
  }
}

const [,, url, label] = process.argv
if (!url) { console.error('Usage: node screenshot.mjs <url> [label]'); process.exit(1) }

const auth = loadAuth()
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const page = await browser.newPage()
await page.setViewport(VIEWPORT)

if (auth) {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' })
  await page.evaluate((a) => {
    if (a.token) localStorage.setItem('token', a.token)
    if (a.user) localStorage.setItem('user', JSON.stringify(a.user))
  }, auth)
  console.log(`✅ Auth injected for: ${auth.user?.name || 'unknown'}`)
}

console.log(`📸 Navigating to: ${url}`)
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 1500))

const index = getNextIndex()
const filename = label ? `screenshot-${index}-${label}.png` : `screenshot-${index}.png`
const filepath = path.join(SCREENSHOTS_DIR, filename)
await page.screenshot({ path: filepath, fullPage: true })
await browser.close()

console.log(`✅ Saved: screenshots/${filename}`)
console.log(`   Size: ${(fs.statSync(filepath).size / 1024).toFixed(1)} KB`)