import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Search, SendHorizontal, MoreVertical } from 'lucide-react'
import { io } from 'socket.io-client'
import './MessagesPage.css'

// Use the VITE_API_BASE environment variable when defined (e.g. in production)
// and fall back to localhost for local development.
// To configure for production, add VITE_API_BASE=https://your-api.com to your .env file.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const getUserId = (user) => user?._id || user?.id || user?.userId || ''
const getEntityId = (entity) => {
  if (!entity) return ''
  if (typeof entity === 'string') return entity
  return entity?._id || entity?.id || ''
}

const getDisplayName = (user) => {
  const first = user?.firstName || ''
  const last = user?.lastName || ''
  const full = `${first} ${last}`.trim()
  return full || user?.name || user?.email || 'User'
}

const getInitial = (user) => getDisplayName(user).charAt(0).toUpperCase()
const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const MessagesPage = () => {
  const navigate = useNavigate()
  const currentUser = useMemo(() => getCurrentUser(), [])
  const currentUserId = getUserId(currentUser)
  const homeRoute = currentUser?.userType === 'freelancer' ? '/freelancer/home' : '/client/home'

  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [crews, setCrews] = useState([])
  const [filteredCrews, setFilteredCrews] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedCrew, setSelectedCrew] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [panelMode, setPanelMode] = useState(null)
  const [panelCrewName, setPanelCrewName] = useState('')
  const [panelSearch, setPanelSearch] = useState('')
  const [panelSelectedMemberIds, setPanelSelectedMemberIds] = useState([])
  const [panelSubmitting, setPanelSubmitting] = useState(false)
  const [mobileView, setMobileView] = useState('sidebar')

  const messagesEndRef = useRef(null)
  const menuRef = useRef(null)
  const socketRef = useRef(null)
  const selectedUserRef = useRef(null)
  const selectedCrewRef = useRef(null)
  const settingsRoute = currentUser?.userType === 'freelancer' ? '/freelancer/settings' : '/client/settings'

  const loadUsers = async () => {
    setIsLoadingUsers(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/message/user`, {
        credentials: 'include',
        headers: {
          ...getAuthHeaders()
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load users')
      setUsers(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load users')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const loadCrews = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/crew`, {
        credentials: 'include',
        headers: {
          ...getAuthHeaders()
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load crews')
      setCrews(Array.isArray(data?.crews) ? data.crews : [])
    } catch (err) {
      setError(err.message || 'Failed to load crews')
    }
  }

  const loadMessages = async (userId) => {
    if (!userId) return
    setIsLoadingMessages(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/message/${userId}`, {
        credentials: 'include',
        headers: {
          ...getAuthHeaders()
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load messages')
      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load messages')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const loadCrewMessages = async (crewId) => {
    if (!crewId) return
    setIsLoadingMessages(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/crew/${crewId}/messages`, {
        credentials: 'include',
        headers: {
          ...getAuthHeaders()
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load crew messages')
      setMessages(Array.isArray(data?.messages) ? data.messages : [])
    } catch (err) {
      setError(err.message || 'Failed to load crew messages')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    const text = draft.trim()
    const activeCrewId = getEntityId(selectedCrew)
    const activeUserId = getEntityId(selectedUser)
    if (!text || (!activeUserId && !activeCrewId)) return

    const optimistic = {
      _id: `temp-${Date.now()}`,
      senderId: currentUserId,
      recieverId: activeUserId || undefined,
      crewId: activeCrewId || undefined,
      text,
      createdAt: new Date().toISOString()
    }

    setMessages((prev) => [...prev, optimistic])
    setDraft('')

    try {
      const endpoint = activeCrewId
        ? `${API_BASE}/api/crew/${activeCrewId}/messages`
        : `${API_BASE}/api/message/send/${activeUserId}`
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ text })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to send message')
      const savedMessage = activeCrewId ? data?.message : data

      setMessages((prev) =>
        prev.map((m) => (m._id === optimistic._id ? savedMessage : m))
      )
    } catch (err) {
      setError(err.message || 'Failed to send message')
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id))
      setDraft(text)
    }
  }

  useEffect(() => {
    loadUsers()
    loadCrews()
  }, [])

  useEffect(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      setFilteredUsers(users)
      setFilteredCrews(crews)
      return
    }
    setFilteredUsers(
      users.filter((u) => getDisplayName(u).toLowerCase().includes(term))
    )
    setFilteredCrews(
      crews.filter((crew) => (crew?.name || '').toLowerCase().includes(term))
    )
  }, [users, crews, search])

  useEffect(() => {
    if (selectedCrew) return
    if (!filteredUsers.length) {
      setSelectedUser(null)
      return
    }
    if (!selectedUser) {
      setSelectedUser(filteredUsers[0])
      return
    }
    const stillExists = filteredUsers.some((u) => u._id === selectedUser._id)
    if (!stillExists) setSelectedUser(filteredUsers[0])
  }, [filteredUsers, selectedUser])

  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])

  useEffect(() => {
    if (!filteredCrews.length) {
      if (selectedCrew) setSelectedCrew(null)
      return
    }
    if (!selectedCrew) return
    const crewStillExists = filteredCrews.some((c) => getEntityId(c) === getEntityId(selectedCrew))
    if (!crewStillExists) setSelectedCrew(null)
  }, [filteredCrews, selectedCrew])

  useEffect(() => {
    selectedCrewRef.current = selectedCrew
  }, [selectedCrew])

  useEffect(() => {
    if (!currentUserId) return

    const socket = io(API_BASE, {
      withCredentials: true,
      auth: { userId: String(currentUserId) },
      transports: ['websocket']
    })
    socketRef.current = socket

    socket.on('newMessage', (incomingMessage) => {
      if (String(incomingMessage.senderId) === String(currentUserId)) return
      const activeUser = selectedUserRef.current
      if (!activeUser?._id) return

      const isForActiveChat =
        String(incomingMessage.senderId) === String(activeUser._id) ||
        String(incomingMessage.recieverId) === String(activeUser._id)

      if (!isForActiveChat) return

      setMessages((prev) => {
        if (prev.some((msg) => String(msg._id) === String(incomingMessage._id))) {
          return prev
        }
        return [...prev, incomingMessage]
      })
    })

    socket.on('newCrewMessage', (incomingMessage) => {
      if (String(incomingMessage.senderId) === String(currentUserId)) return
      const activeCrew = selectedCrewRef.current
      if (!activeCrew?._id) return
      if (String(incomingMessage.crewId) !== String(activeCrew._id)) return

      setMessages((prev) => {
        if (prev.some((msg) => String(msg._id) === String(incomingMessage._id))) {
          return prev
        }
        return [...prev, incomingMessage]
      })
    })

    socket.on('crewUpdated', (payload) => {
      const crewId = getEntityId(payload?.crew)
      if (!crewId) return

      setCrews((prev) => {
        const exists = prev.some((crew) => String(getEntityId(crew)) === String(crewId))
        if (!exists) return [payload.crew, ...prev]
        return prev.map((crew) =>
          String(getEntityId(crew)) === String(crewId) ? payload.crew : crew
        )
      })

      if (String(getEntityId(selectedCrewRef.current)) === String(crewId)) {
        setSelectedCrew(payload.crew)
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [currentUserId])

  useEffect(() => {
    const activeCrewId = getEntityId(selectedCrew)
    const activeUserId = getEntityId(selectedUser)
    if (activeCrewId) {
      loadCrewMessages(activeCrewId)
      return
    }
    if (activeUserId) {
      loadMessages(activeUserId)
    }
  }, [selectedUser?._id, selectedCrew?._id])

  useEffect(() => {
    const activeCrewId = getEntityId(selectedCrew)
    const socket = socketRef.current
    if (!activeCrewId || !socket) return
    socket.emit('joinCrew', { crewId: activeCrewId })
    return () => {
      socket.emit('leaveCrew', { crewId: activeCrewId })
    }
  }, [selectedCrew?._id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  const handleOpenSettings = () => {
    setMenuOpen(false)
    navigate(settingsRoute)
  }

  const openCreateCrewPanel = () => {
    setMenuOpen(false)
    setPanelMode('create')
    setPanelCrewName(selectedUser ? `${getDisplayName(selectedUser)} Crew` : '')
    setPanelSearch('')
    setPanelSelectedMemberIds(selectedUser?._id ? [selectedUser._id] : [])
  }

  const openAddMembersPanel = () => {
    setMenuOpen(false)
    if (!selectedCrew) return
    setPanelMode('add')
    setPanelCrewName(selectedCrew.name || '')
    setPanelSearch('')
    setPanelSelectedMemberIds([])
  }

  const closeMemberPanel = () => {
    if (panelSubmitting) return
    setPanelMode(null)
    setPanelSearch('')
    setPanelSelectedMemberIds([])
    setPanelCrewName('')
  }

  const togglePanelMember = (memberId) => {
    setPanelSelectedMemberIds((prev) => (
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    ))
  }

  const activeConversation = selectedCrew || selectedUser
  const isCrewChat = Boolean(selectedCrew)
  const activeTitle = isCrewChat ? selectedCrew?.name : getDisplayName(selectedUser)
  const activeSubtitle = isCrewChat ? 'Crew chat' : 'Active now'
  const canManageCrew = Boolean(
    isCrewChat && String(getEntityId(selectedCrew?.createdBy)) === String(currentUserId)
  )
  const currentCrewMemberIds = new Set((selectedCrew?.members || []).map((m) => String(getEntityId(m))))
  const panelBaseCandidates = users.filter((u) => {
    const userId = String(getEntityId(u))
    if (!userId) return false
    return panelMode === 'add' ? !currentCrewMemberIds.has(userId) : userId !== String(currentUserId)
  })
  const panelCandidates = panelBaseCandidates.filter((u) => {
    const term = panelSearch.trim().toLowerCase()
    if (!term) return true
    const label = `${getDisplayName(u)} ${u.email || ''}`.toLowerCase()
    return label.includes(term)
  })
  const panelTitle = panelMode === 'add' ? 'Add members' : 'Create crew'

  const submitMemberPanel = async () => {
    if (!panelMode) return
    if (!panelSelectedMemberIds.length) {
      setError('Select at least one member.')
      return
    }

    if (panelMode === 'create' && !panelCrewName.trim()) {
      setError('Crew name is required.')
      return
    }

    setPanelSubmitting(true)
    setError('')
    try {
      const endpoint = panelMode === 'add'
        ? `${API_BASE}/api/crew/${getEntityId(selectedCrew)}/members`
        : `${API_BASE}/api/crew`
      const payload = panelMode === 'add'
        ? { memberIds: panelSelectedMemberIds }
        : { name: panelCrewName.trim(), memberIds: panelSelectedMemberIds }

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to save crew changes')
      }

      await loadCrews()
      if (data.crew) {
        setSelectedCrew(data.crew)
        if (panelMode === 'create') setSelectedUser(null)
      }
      closeMemberPanel()
    } catch (err) {
      setError(err.message || 'Failed to save crew changes')
    } finally {
      setPanelSubmitting(false)
    }
  }

  return (
    <div className="messages-page">
      <div className="messages-shell">
        <aside className={`messages-sidebar${mobileView === 'chat' ? ' mobile-hidden' : ''}`}>
          <div className="messages-sidebar-header">
            <button
              className="messages-back-button"
              onClick={() => navigate(homeRoute)}
              aria-label="Back to home"
            >
              Back
            </button>
            <div className="messages-sidebar-profile">
              <div className="messages-avatar">{getInitial(currentUser)}</div>
              <div>
                <h2>{getDisplayName(currentUser)}</h2>
                <p>Chats</p>
              </div>
            </div>
          </div>

          <div className="messages-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              type="text"
            />
          </div>

          <div className="messages-user-list">
            {filteredCrews.length > 0 && (
              <>
                <div className="messages-list-heading">Crews</div>
                {filteredCrews.map((crew) => {
                  const crewId = getEntityId(crew)
                  const isActive = getEntityId(selectedCrew) === crewId
                  return (
                    <button
                      key={crewId}
                      className={`messages-user-row ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCrew(crew)
                        setSelectedUser(null)
                        setMobileView('chat')
                      }}
                    >
                      <div className="messages-avatar">C</div>
                      <div className="messages-user-meta">
                        <div className="messages-user-name">{crew.name || 'Untitled Crew'}</div>
                        <div className="messages-user-sub">{(crew.members || []).length} members</div>
                      </div>
                    </button>
                  )
                })}
              </>
            )}
            <div className="messages-list-heading">Direct messages</div>
            {isLoadingUsers ? (
              <div className="messages-state">Loading users...</div>
            ) : !filteredUsers.length ? (
              <div className="messages-state">No users found.</div>
            ) : (
              filteredUsers.map((user) => {
                const isActive = selectedUser?._id === user._id && !selectedCrew
                return (
                  <button
                    key={user._id}
                    className={`messages-user-row ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedUser(user)
                      setSelectedCrew(null)
                      setMobileView('chat')
                    }}
                  >
                    <div className="messages-avatar">{getInitial(user)}</div>
                    <div className="messages-user-meta">
                      <div className="messages-user-name">{getDisplayName(user)}</div>
                      <div className="messages-user-sub">Click to open conversation</div>
                    </div>
                    <span className="messages-user-status" />
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <section className={`messages-chat-panel${mobileView === 'sidebar' ? ' mobile-hidden' : ''}`}>
          {activeConversation ? (
            <>
              <header className="messages-chat-header">
                <button
                  className="messages-mobile-back"
                  onClick={() => setMobileView('sidebar')}
                  aria-label="Back to contacts"
                >
                  ←
                </button>
                <div className="messages-avatar">
                  {isCrewChat ? 'C' : getInitial(selectedUser)}
                </div>
                <div>
                  <h3>{activeTitle}</h3>
                  <p>{activeSubtitle}</p>
                </div>
                <div className="messages-chat-menu-wrap" ref={menuRef}>
                  <button
                    className="messages-chat-menu"
                    aria-label="Conversation options"
                    onClick={() => setMenuOpen((prev) => !prev)}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {menuOpen && (
                    <div className="messages-menu-panel">
                      {currentUser?.userType === 'client' && (
                        <button className="messages-menu-item" onClick={openCreateCrewPanel}>
                          Create crew
                        </button>
                      )}
                      {canManageCrew && (
                        <button className="messages-menu-item" onClick={openAddMembersPanel}>
                          Add members
                        </button>
                      )}
                      <button className="messages-menu-item" onClick={handleOpenSettings}>
                        Settings
                      </button>
                    </div>
                  )}
                </div>
              </header>

              <div className="messages-stream">
                {isLoadingMessages ? (
                  <div className="messages-state">Loading messages...</div>
                ) : !messages.length ? (
                  <div className="messages-state">No messages yet. Say hello.</div>
                ) : (
                  messages.map((message) => {
                    const fromMe = String(message.senderId) === String(currentUserId)
                    return (
                      <div
                        key={message._id}
                        className={`message-row ${fromMe ? 'from-me' : 'from-them'}`}
                      >
                        <div className="message-stack">
                          <div className="message-bubble">
                            {message.text || '[Attachment]'}
                          </div>
                          <span className="message-time">{formatTime(message.createdAt)}</span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <footer className="messages-composer">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <button onClick={sendMessage} aria-label="Send message">
                  <SendHorizontal size={18} />
                </button>
              </footer>
            </>
          ) : (
            <div className="messages-empty-chat">
              <MessageSquare size={40} />
              <h3>Select a conversation</h3>
              <p>Choose a user from the left sidebar to start messaging.</p>
            </div>
          )}

          {error && <div className="messages-error">{error}</div>}
        </section>
      </div>

      {panelMode && (
        <div className="messages-panel-overlay" onClick={closeMemberPanel}>
          <div className="messages-panel" onClick={(e) => e.stopPropagation()}>
            <div className="messages-panel-header">
              <h3>{panelTitle}</h3>
              <button
                type="button"
                className="messages-panel-close"
                onClick={closeMemberPanel}
                aria-label="Close panel"
              >
                ×
              </button>
            </div>

            {panelMode === 'create' && (
              <label className="messages-panel-field">
                <span>Crew name</span>
                <input
                  type="text"
                  value={panelCrewName}
                  onChange={(e) => setPanelCrewName(e.target.value)}
                  placeholder="Enter crew name"
                  disabled={panelSubmitting}
                />
              </label>
            )}

            <label className="messages-panel-field">
              <span>Search members</span>
              <input
                type="text"
                value={panelSearch}
                onChange={(e) => setPanelSearch(e.target.value)}
                placeholder="Search by name or email"
                disabled={panelSubmitting}
              />
            </label>

            <div className="messages-panel-members">
              {panelCandidates.length === 0 ? (
                <div className="messages-state">No matching users.</div>
              ) : (
                panelCandidates.map((user) => {
                  const userId = getEntityId(user)
                  const checked = panelSelectedMemberIds.includes(userId)
                  return (
                    <label key={userId} className="messages-panel-member-row">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePanelMember(userId)}
                        disabled={panelSubmitting}
                      />
                      <div className="messages-avatar">{getInitial(user)}</div>
                      <div className="messages-user-meta">
                        <div className="messages-user-name">{getDisplayName(user)}</div>
                        <div className="messages-user-sub">{user.email || 'No email'}</div>
                      </div>
                    </label>
                  )
                })
              )}
            </div>

            <div className="messages-panel-actions">
              <button
                type="button"
                className="messages-panel-btn secondary"
                onClick={closeMemberPanel}
                disabled={panelSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="messages-panel-btn primary"
                onClick={submitMemberPanel}
                disabled={panelSubmitting}
              >
                {panelSubmitting ? 'Saving...' : panelMode === 'add' ? 'Add members' : 'Create crew'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessagesPage
