import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Send, Bot, User, Loader2 } from 'lucide-react'
import './AIChatPanel.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

export default function AIChatPanel({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your LanceLB Support Assistant 👋 I can help you with posting jobs, applying for work, improving your profile, writing cover letters, and anything else on the platform. What can I help you with?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // Blur any focused page element before focusing the textarea
      if (document.activeElement) {
        document.activeElement.blur()
      }
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 300)
    }
  }, [isOpen])

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }, 50)
    return () => clearTimeout(timer)
  }, [messages, loading])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    // Reset textarea height immediately
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const history = newMessages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(0, -1), mode: 'user' }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please check your network and try again.' }])
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="aichat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            className="aichat-panel"
            onKeyDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            {/* Header */}
            <div className="aichat-header">
              <div className="aichat-header-left">
                <div className="aichat-avatar">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="aichat-title">LanceLB Assistant</p>
                  <p className="aichat-subtitle">Powered by AI · Always here to help</p>
                </div>
              </div>
              <button className="aichat-close" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="aichat-messages">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`aichat-bubble-wrap ${msg.role}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`aichat-bubble ${msg.role}`}>
                    {msg.role === 'assistant' && <Bot size={14} className="aichat-bubble-icon" />}
                    {msg.role === 'user' && <User size={14} className="aichat-bubble-icon" />}
                    <p className="aichat-bubble-text" dangerouslySetInnerHTML={{ __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/^\* (.+)$/gm, '<span class="ai-bullet">$1</span>')
                      .replace(/\n/g, '<br/>')
                    }} />
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  className="aichat-bubble-wrap assistant"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="aichat-bubble assistant aichat-typing">
                    <Loader2 size={14} className="aichat-spin" />
                    <span>Thinking…</span>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="aichat-input-wrap">
              <textarea
                ref={textareaRef}
                className="aichat-input"
                placeholder="Ask me anything about LanceLB…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                rows={1}
                disabled={loading}
              />
              <button
                className="aichat-send"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
