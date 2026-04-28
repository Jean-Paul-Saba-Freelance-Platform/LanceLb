import { ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './AccountBlockedScreen.css'

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const AccountBlockedScreen = ({ statusType, reason, timeoutUntil }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  const isBanned = statusType === 'banned'

  return (
    <div className="blocked-screen">
      <div className="blocked-card">
        <div className="blocked-icon-wrap">
          <ShieldOff size={32} strokeWidth={1.5} />
        </div>

        <h1 className="blocked-title">
          {isBanned ? 'Account Banned' : 'Account Suspended'}
        </h1>

        <p className="blocked-subtitle">
          {isBanned
            ? 'Your account has been permanently banned from LanceLB.'
            : 'Your account has been temporarily suspended by an administrator.'}
        </p>

        {isBanned && reason && (
          <div className="blocked-reason">
            <strong>Reason: </strong>{reason}
          </div>
        )}

        {!isBanned && timeoutUntil && (
          <div className="blocked-until">
            Suspended until <strong>{formatDate(timeoutUntil)}</strong>
          </div>
        )}

        <hr className="blocked-divider" />

        <button className="blocked-logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  )
}

export default AccountBlockedScreen
