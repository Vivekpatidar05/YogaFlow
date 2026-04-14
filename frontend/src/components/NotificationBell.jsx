import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../contexts/AuthContext'

const TYPE_ICONS = {
  booking_confirmed:           '✅',
  booking_cancelled:           '❌',
  session_reminder:            '⏰',
  waitlist_spot:               '🎯',
  instructor_approved:         '🎉',
  instructor_rejected:         '📋',
  new_booking_on_session:      '🧘',
  session_cancelled_by_instructor: '⚠️',
  review_received:             '⭐',
  system:                      '📢',
}

export default function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen]           = useState(false)
  const [notifications, setN]     = useState([])
  const [unread, setUnread]       = useState(0)
  const [loading, setLoading]     = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [isAuthenticated])

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications?limit=1')
      setUnread(data.unreadCount || 0)
    } catch {}
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications?limit=15')
      setN(data.notifications || [])
      setUnread(data.unreadCount || 0)
    } catch {}
    finally { setLoading(false) }
  }

  const handleOpen = () => {
    setOpen(!open)
    if (!open) fetchNotifications()
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setN(prev => prev.map(n => ({ ...n, read: true })))
      setUnread(0)
    } catch {}
  }

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setN(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
      setUnread(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const remove = async (e, id) => {
    e.stopPropagation()
    try {
      await api.delete(`/notifications/${id}`)
      setN(prev => prev.filter(n => n._id !== id))
    } catch {}
  }

  const fmtTime = (d) => {
    const diff = Date.now() - new Date(d).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins < 1)  return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl transition-colors"
        style={{ color: 'var(--muted)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        title="Notifications"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center"
            style={{ background: 'var(--terra)', fontSize: 10, fontWeight: 700 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border2)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              Notifications {unread > 0 && (
                <span className="badge badge-terra ml-1 text-xs">{unread} new</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="p-1.5 rounded-lg hover:bg-[#EAF4E0] transition-colors"
                  style={{ color: 'var(--primary)' }}>
                  <CheckCheck size={14} />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#FDEEE8] transition-colors"
                style={{ color: 'var(--terra)' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto scrollbar-hide">
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="spinner w-5 h-5" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto mb-2" style={{ color: 'var(--faint)' }} />
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No notifications yet</p>
              </div>
            ) : notifications.map(n => (
              <div key={n._id}
                className="flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition-colors"
                style={{
                  borderColor:  'var(--border)',
                  background:   n.read ? 'transparent' : 'rgba(44,95,46,0.03)',
                }}
                onClick={() => { markRead(n._id); if (n.link) window.location.href = n.link }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(44,95,46,0.03)'}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ background: 'var(--surface2)' }}>
                  {TYPE_ICONS[n.type] || '📢'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
                        style={{ background: 'var(--primary)' }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {n.message}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--faint)' }}>{fmtTime(n.createdAt)}</p>
                </div>
                <button onClick={e => remove(e, n._id)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#FDEEE8] transition-all shrink-0"
                  style={{ color: 'var(--terra)' }}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
