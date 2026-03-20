import { useEffect, useState } from 'react'
import './FollowButton.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

/**
 * FollowButton
 *
 * Displays the current follow state between the logged-in user and `targetUserId`
 * and lets the user send, cancel, or undo a follow.
 *
 * States shown:
 *   null outgoing  → "Follow"
 *   'requested'    → "Requested" (click to cancel)
 *   'accepted'     → "Following" (click to unfollow)
 */
const FollowButton = ({ targetUserId, onStatusChange }) => {
  const [outgoing, setOutgoing] = useState(null) // null | 'requested' | 'accepted'
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!targetUserId) return
    let cancelled = false

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/follow/status/${targetUserId}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (!cancelled && data.success) {
          setOutgoing(data.outgoing)
        }
      } catch {
        // silently ignore — button will show "Follow"
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStatus()
    return () => { cancelled = true }
  }, [targetUserId])

  const handleClick = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (!outgoing) {
        // Send follow request
        const res = await fetch(`${API_BASE}/api/follow/${targetUserId}`, {
          method: 'POST',
          credentials: 'include',
          headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (data.success) {
          setOutgoing('requested')
          onStatusChange?.('requested')
        }
      } else {
        // Cancel request or unfollow
        const res = await fetch(`${API_BASE}/api/follow/${targetUserId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (data.success) {
          setOutgoing(null)
          onStatusChange?.(null)
        }
      }
    } catch {
      // ignore — state unchanged
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <button className="follow-btn follow-btn--loading" disabled>···</button>

  const label = outgoing === 'accepted' ? 'Following' : outgoing === 'requested' ? 'Requested' : 'Follow'
  const modifier = outgoing === 'accepted' ? 'following' : outgoing === 'requested' ? 'requested' : 'follow'

  return (
    <button
      className={`follow-btn follow-btn--${modifier}`}
      onClick={handleClick}
      disabled={busy}
    >
      {busy ? '···' : label}
    </button>
  )
}

export default FollowButton
