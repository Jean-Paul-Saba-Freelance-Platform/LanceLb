import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { Bot, Send, Loader2, Sparkles } from 'lucide-react'
import './AdminAIAssistant.css'

const API_BASE = 'http://127.0.0.1:4000'

const SUGGESTED = [
  'How is the platform growing?',
  'Which job categories are most active?',
  'Generate a summary report of platform health',
  'What is the hire rate and what does it mean?',
]

export default function AdminAIAssistant({ stats, growth, categories }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your Lance Platform Analyst. I have access to your current platform statistics and can help you analyze growth trends, generate reports, and identify opportunities. What would you like to know?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }, 50)
    return () => clearTimeout(timer)
  }, [messages, loading])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMsg = { role: 'user', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const history = newMessages.map(m => ({ role: m.role, content: m.content }))
      const statsContext = { stats, growth, categories }
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: history.slice(0, -1),
          mode: 'admin',
          stats: statsContext,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="adm-ai-wrap">
      <div className="adm-ai-header">
        <div className="adm-ai-header-left">
          <div className="adm-ai-avatar">
            <Bot size={18} />
          </div>
          <div>
            <p className="adm-ai-title">Platform AI Analyst</p>
            <p className="adm-ai-subtitle">Ask questions about your platform data</p>
          </div>
        </div>
        <div className="adm-ai-badge">
          <Sparkles size={12} />
          <span>Live Data</span>
        </div>
      </div>

      {/* Suggested prompts */}
      <div className="adm-ai-suggestions">
        {SUGGESTED.map((s, i) => (
          <button
            key={i}
            className="adm-ai-suggestion"
            onClick={() => sendMessage(s)}
            disabled={loading}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="adm-ai-messages">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className={`adm-ai-bubble-wrap ${msg.role}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`adm-ai-bubble ${msg.role}`}>
              {msg.role === 'assistant' && <Bot size={13} className="adm-ai-bubble-icon" />}
              <p className="adm-ai-bubble-text" dangerouslySetInnerHTML={{ __html: msg.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/^\* (.+)$/gm, '<span class="ai-bullet">$1</span>')
                .replace(/\n/g, '<br/>')
              }} />
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div
            className="adm-ai-bubble-wrap assistant"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="adm-ai-bubble assistant adm-ai-typing">
              <Loader2 size={13} className="adm-ai-spin" />
              <span>Analyzing…</span>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="adm-ai-input-wrap">
        <textarea
          ref={textareaRef}
          className="adm-ai-input"
          placeholder="Ask about platform stats, trends, or request a report…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onInput={e => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
          }}
          rows={1}
          disabled={loading}
        />
        <button
          className="adm-ai-send"
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          aria-label="Send"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
