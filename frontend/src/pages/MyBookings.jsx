import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, ChevronRight, X, Star, AlertCircle, BellRing } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS = {
  confirmed: { bg:'var(--tint-green)', color:'var(--tint-green-text)', label:'Confirmed'  },
  pending:   { bg:'var(--tint-amber)', color:'var(--tint-amber-text)', label:'Pending'    },
  cancelled: { bg:'var(--tint-terra)', color:'var(--tint-terra-text)', label:'Cancelled'  },
  completed: { bg:'var(--tint-blue)', color:'var(--tint-blue-text)', label:'Completed'  },
  'no-show': { bg:'var(--surface2)', color:'var(--muted)', label:'No-Show'    },
}

export default function MyBookings() {
  const [bookings, setBookings]     = useState([])
  const [waitlist, setWaitlist]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')
  const [cancelling, setCancelling] = useState(null)
  const [feedback, setFeedback]     = useState(null)
  const [error, setError]           = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (filter === 'waitlist') {
        const { data } = await api.get('/waitlist/my')
        setWaitlist(data.entries || [])
      } else {
        const q = filter !== 'all' ? `?status=${filter}` : ''
        const { data } = await api.get(`/bookings/my${q}`)
        setBookings(data.bookings || [])
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load bookings.'
      setError(msg)
      toast.error(msg)
    } finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  const leaveWaitlist = async (entryId) => {
    try {
      await api.delete(`/waitlist/${entryId}`)
      toast.success('Removed from waitlist.')
      setWaitlist(prev => prev.filter(w => w._id !== entryId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave waitlist.')
    }
  }

  const cancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    setCancelling(id)
    try {
      await api.patch(`/bookings/${id}/cancel`, { reason: 'Cancelled by user' })
      toast.success('Booking cancelled. Confirmation email sent.')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Cancellation failed.') }
    finally { setCancelling(null) }
  }

  const TABS = [
    { key:'all',       label:'All' },
    { key:'confirmed', label:'Upcoming' },
    { key:'completed', label:'Completed' },
    { key:'cancelled', label:'Cancelled' },
    { key:'waitlist',  label:'Waitlist' },
  ]

  return (
    <div className="pt-20 pb-16" style={{ background:'var(--bg)' }}>
      <div className="page-container max-w-4xl">

        {/* Header */}
        <div className="py-6 mb-6">
          <p className="eyebrow mb-2">History</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold" style={{ color:'var(--text)' }}>
            My Bookings
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl w-fit mb-8"
          style={{ background:'var(--surface2)', border:'1.5px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: filter===t.key ? 'var(--surface)' : 'transparent',
                color:      filter===t.key ? 'var(--primary)' : 'var(--muted)',
                boxShadow:  filter===t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="card p-5 mb-6 flex items-center gap-3"
            style={{ background:'var(--tint-terra)', border:'1px solid var(--tint-terra-brd)' }}>
            <AlertCircle size={18} style={{ color:'var(--terra)', flexShrink:0 }} />
            <div>
              <p className="font-semibold text-sm" style={{ color:'var(--terra)' }}>Could not load bookings</p>
              <p className="text-xs mt-0.5" style={{ color:'var(--tint-terra-text)' }}>{error}</p>
            </div>
            <button onClick={load} className="ml-auto btn-outline text-xs py-1.5 px-3">Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

        /* Waitlist tab */
        ) : filter === 'waitlist' ? (
          waitlist.length === 0 ? (
            <div className="card text-center py-20 shadow-card">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="font-display text-xl mb-2" style={{ color:'var(--text)' }}>No waitlist entries</h3>
              <p className="text-sm mb-6" style={{ color:'var(--muted)' }}>
                When a session is full, join its waitlist and we'll notify you the moment a spot opens.
              </p>
              <Link to="/sessions" className="btn-primary text-sm px-6">Browse Sessions</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {waitlist.map(w => <WaitlistCard key={w._id} w={w} onLeave={leaveWaitlist} />)}
            </div>
          )

        /* Empty state */
        ) : bookings.length === 0 ? (
          <div className="card text-center py-20 shadow-card">
            <div className="text-5xl mb-4">🗓</div>
            <h3 className="font-display text-xl mb-2" style={{ color:'var(--text)' }}>
              No {filter !== 'all' ? filter : ''} bookings found
            </h3>
            <p className="text-sm mb-6" style={{ color:'var(--muted)' }}>
              {filter === 'all'
                ? "You haven't booked any sessions yet."
                : `You have no ${filter} bookings.`}
            </p>
            <Link to="/sessions" className="btn-primary text-sm px-6">Browse Sessions</Link>
          </div>

        /* Booking list */
        ) : (
          <div className="space-y-4">
            {bookings.map(b => <BookingCard key={b._id} b={b} onCancel={cancel} cancelling={cancelling} onFeedback={() => setFeedback(b)} />)}
          </div>
        )}
      </div>

      {feedback && (
        <FeedbackModal booking={feedback}
          onClose={() => setFeedback(null)}
          onSuccess={load} />
      )}
    </div>
  )
}

// ── Waitlist entry card ───────────────────────────────────────────────────────
function WaitlistCard({ w, onLeave }) {
  return (
    <div className="card shadow-card overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {w.session?.image && (
          <div className="sm:w-28 h-24 sm:h-auto flex-shrink-0" style={{ background:'var(--surface2)' }}>
            <img src={w.session.image} alt="" className="w-full h-full object-cover"
              onError={e => { e.target.style.display='none' }} />
          </div>
        )}
        <div className="flex-1 p-5">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="badge" style={{ background:'var(--tint-amber)', color:'var(--tint-amber-text)' }}>
              <BellRing size={10} className="mr-1" /> #{w.position} in line
            </span>
            {w.status === 'notified' && (
              <span className="badge badge-green">Spot opened — book now!</span>
            )}
          </div>
          <h3 className="font-display font-semibold text-lg leading-tight" style={{ color:'var(--text)' }}>
            {w.session?.title || 'Session unavailable'}
          </h3>
          {w.session && (
            <p className="text-xs font-medium mt-0.5 mb-3" style={{ color:'var(--muted)' }}>
              {w.session.type} · {w.session.instructor?.name}
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-xs mb-3" style={{ color:'var(--muted)' }}>
            <span className="flex items-center gap-1.5">
              <Calendar size={11} style={{ color:'var(--primary)' }} />
              {new Date(w.sessionDate).toLocaleDateString('en-IN',{ weekday:'short', month:'short', day:'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} style={{ color:'var(--primary)' }} /> {w.sessionTime}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {w.session && (
              <Link to={`/sessions/${w.session._id}`}
                className="btn-ghost text-xs py-1.5 px-3 gap-1"
                style={{ border:'1px solid var(--border)', borderRadius:'8px', color:'var(--muted)' }}>
                View Session <ChevronRight size={11} />
              </Link>
            )}
            <button onClick={() => onLeave(w._id)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
              style={{ color:'var(--terra)', border:'1px solid var(--tint-terra-brd)', background:'var(--tint-terra)' }}>
              <X size={11} /> Leave Waitlist
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Single booking card ───────────────────────────────────────────────────────
function BookingCard({ b, onCancel, cancelling, onFeedback }) {
  const st      = STATUS[b.status] || STATUS.pending
  const session = b.session          // may be null if session was deleted
  const isPast  = new Date(b.sessionDate) < new Date()
  const canCancel = b.status === 'confirmed' && !isPast

  return (
    <div className="card shadow-card transition-all hover:shadow-card-hover overflow-hidden">
      <div className="flex flex-col sm:flex-row">

        {/* Session image thumbnail */}
        {session?.image && (
          <div className="sm:w-28 h-24 sm:h-auto flex-shrink-0" style={{ background:'var(--surface2)' }}>
            <img src={session.image} alt="" className="w-full h-full object-cover"
              onError={e => { e.target.style.display='none' }} />
          </div>
        )}

        <div className="flex-1 p-5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="badge text-xs" style={{ background:st.bg, color:st.color }}>
                  {st.label}
                </span>
                <span className="text-xs font-mono" style={{ color:'var(--faint)' }}>
                  #{b.bookingReference || 'N/A'}
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg leading-tight"
                style={{ color:'var(--text)' }}>
                {session?.title || 'Session details unavailable'}
              </h3>
              {session && (
                <p className="text-xs font-medium mt-0.5" style={{ color:'var(--muted)' }}>
                  {session.type} · {session.instructor?.name}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-lg font-display" style={{ color:'var(--primary)' }}>
                ₹{b.payment?.amount?.toLocaleString('en-IN') || '—'}
              </p>
              <p className="text-xs" style={{ color:'var(--faint)' }}>
                {b.payment?.method?.toUpperCase() || ''}
              </p>
            </div>
          </div>

          {/* Date + time */}
          <div className="flex flex-wrap gap-4 text-xs mb-3" style={{ color:'var(--muted)' }}>
            <span className="flex items-center gap-1.5">
              <Calendar size={11} style={{ color:'var(--primary)' }} />
              {new Date(b.sessionDate).toLocaleDateString('en-IN', {
                weekday:'short', month:'short', day:'numeric', year:'numeric'
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} style={{ color:'var(--primary)' }} />
              {b.sessionTime}
            </span>
            {session?.duration && (
              <span style={{ color:'var(--faint)' }}>{session.duration} min</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Link to={`/my-bookings/${b._id}`}
              className="btn-ghost text-xs py-1.5 px-3 gap-1"
              style={{ border:'1px solid var(--border)', borderRadius:'8px', color:'var(--muted)' }}>
              Full Details <ChevronRight size={11} />
            </Link>

            {canCancel && (
              <button onClick={() => onCancel(b._id)} disabled={cancelling === b._id}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                style={{ color:'var(--terra)', border:'1px solid var(--tint-terra-brd)', background:'var(--tint-terra)' }}>
                {cancelling === b._id
                  ? <span className="spinner w-3 h-3" />
                  : <X size={11} />
                }
                Cancel Booking
              </button>
            )}

            {b.status === 'completed' && !b.feedback?.rating && (
              <button onClick={onFeedback}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                style={{ color:'var(--tint-amber-text)', border:'1px solid var(--tint-amber-brd)', background:'var(--tint-amber)' }}>
                <Star size={11} /> Rate Session
              </button>
            )}

            {b.feedback?.rating && (
              <span className="text-xs font-semibold flex items-center gap-1"
                style={{ color:'#B8860B' }}>
                {'★'.repeat(b.feedback.rating)}{'☆'.repeat(5 - b.feedback.rating)}
                <span style={{ color:'var(--faint)' }}> Reviewed</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Feedback modal ────────────────────────────────────────────────────────────
function FeedbackModal({ booking, onClose, onSuccess }) {
  const [rating,  setRating]  = useState(0)
  const [hover,   setHover]   = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!rating) return toast.error('Please select a rating.')
    setLoading(true)
    try {
      await api.post(`/bookings/${booking._id}/feedback`, { rating, comment })
      toast.success('Feedback submitted! Thank you.')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="card p-8 max-w-md w-full shadow-card-hover" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-2xl font-semibold mb-1" style={{ color:'var(--text)' }}>
          Rate Your Session
        </h2>
        <p className="text-sm mb-6" style={{ color:'var(--muted)' }}>
          {booking.session?.title || 'Session'}
        </p>

        <div className="flex justify-center gap-3 mb-6">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110">
              <Star size={36} style={{
                fill:  n <= (hover || rating) ? '#F59E0B' : 'transparent',
                color: n <= (hover || rating) ? '#F59E0B' : 'var(--border2)',
                transition:'all 0.15s',
              }} />
            </button>
          ))}
        </div>

        <textarea rows={3} className="input-field mb-5 text-sm resize-none"
          placeholder="Tell us about your experience (optional)…"
          value={comment} onChange={e => setComment(e.target.value)} />

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-2.5">Cancel</button>
          <button onClick={submit} disabled={loading || !rating}
            className="btn-primary flex-1 justify-center py-2.5">
            {loading ? <span className="spinner w-4 h-4" /> : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
