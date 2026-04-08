import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, ChevronRight, X, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const statusStyle = {
  confirmed:  { bg: 'rgba(74,222,128,0.1)',  color: '#4ade80'  },
  pending:    { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24'  },
  cancelled:  { bg: 'rgba(248,113,113,0.1)', color: '#f87171'  },
  completed:  { bg: 'rgba(147,197,253,0.1)', color: '#93c5fd'  },
  'no-show':  { bg: 'rgba(100,100,100,0.1)', color: '#666'     },
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [cancelling, setCancelling] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const { data } = await api.get(`/bookings/my${params}`)
      setBookings(data.bookings)
    } catch { toast.error('Failed to load bookings.') }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    setCancelling(id)
    try {
      await api.patch(`/bookings/${id}/cancel`, { reason: 'Cancelled by user' })
      toast.success('Booking cancelled.')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Cancellation failed.') }
    finally { setCancelling(null) }
  }

  const tabs = [
    { key: 'all',       label: 'All' },
    { key: 'confirmed', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="pt-24 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="page-container max-w-4xl">
        <div className="mb-8">
          <p className="section-eyebrow mb-2">Bookings</p>
          <h1 className="font-display text-3xl font-semibold text-[#e8e8e8]">My Bookings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit mb-8" style={{ background: 'var(--surface)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === t.key ? 'var(--surface2)' : 'transparent',
                color: filter === t.key ? 'var(--gold)' : 'var(--muted)',
                border: filter === t.key ? '1px solid var(--border2)' : '1px solid transparent'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : bookings.length === 0 ? (
          <div className="card text-center py-20">
            <div className="text-4xl mb-4">🗓</div>
            <h3 className="font-display text-xl text-[#e8e8e8] mb-2">No bookings found</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
              {filter === 'all' ? "You haven't booked any sessions yet." : `No ${filter} bookings.`}
            </p>
            <Link to="/sessions" className="btn-gold text-sm">Browse Sessions</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => {
              const st = statusStyle[b.status] || statusStyle.pending
              const isPast = new Date(b.sessionDate) < new Date()
              const canCancel = b.status === 'confirmed' && !isPast

              return (
                <div key={b._id} className="card overflow-hidden transition-all hover:border-[var(--border2)]">
                  <div className="flex flex-col sm:flex-row">
                    {b.session?.image && (
                      <div className="sm:w-28 h-24 sm:h-auto flex-shrink-0" style={{ background: 'var(--surface2)' }}>
                        <img src={b.session.image} alt="" className="w-full h-full object-cover" style={{ opacity: 0.55 }}
                          onError={e => { e.target.style.display = 'none' }} />
                      </div>
                    )}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="badge text-xs" style={{ background: st.bg, color: st.color }}>
                              {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                            </span>
                            <span className="text-xs font-mono" style={{ color: 'var(--faint)' }}>
                              #{b.bookingReference}
                            </span>
                          </div>
                          <h3 className="font-display font-semibold text-lg text-[#e8e8e8]">{b.session?.title}</h3>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{b.session?.type} · {b.session?.instructor?.name}</p>
                        </div>
                        <p className="font-bold text-[#e8e8e8] shrink-0" style={{ color: 'var(--gold)' }}>
                          ₹{b.payment?.amount?.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs mb-3" style={{ color: 'var(--muted)' }}>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} style={{ color: 'var(--gold)' }} />
                          {new Date(b.sessionDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} style={{ color: 'var(--gold)' }} />{b.sessionTime}
                        </span>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Link to={`/my-bookings/${b._id}`} className="btn-ghost text-xs py-1.5 px-3 gap-1"
                          style={{ color: 'var(--muted)' }}>
                          View Details <ChevronRight size={11} />
                        </Link>
                        {canCancel && (
                          <button onClick={() => cancel(b._id)} disabled={cancelling === b._id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: '#f87171' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            {cancelling === b._id
                              ? <span className="w-3 h-3 spinner" />
                              : <X size={11} />
                            }
                            Cancel
                          </button>
                        )}
                        {b.status === 'completed' && !b.feedback?.rating && (
                          <button onClick={() => setFeedbackModal(b)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--gold)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Star size={11} /> Rate Session
                          </button>
                        )}
                        {b.feedback?.rating && (
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--gold)' }}>
                            {'★'.repeat(b.feedback.rating)} Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {feedbackModal && (
        <FeedbackModal booking={feedbackModal}
          onClose={() => setFeedbackModal(null)} onSuccess={load} />
      )}
    </div>
  )
}

function FeedbackModal({ booking, onClose, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!rating) return toast.error('Please select a rating.')
    setLoading(true)
    try {
      await api.post(`/bookings/${booking._id}/feedback`, { rating, comment })
      toast.success('Feedback submitted!')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Feedback failed.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="card p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-2xl font-semibold text-[#e8e8e8] mb-1">Rate Your Session</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>{booking.session?.title}</p>

        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110">
              <Star size={36} style={{
                fill: n <= (hover || rating) ? 'var(--gold)' : 'transparent',
                color: n <= (hover || rating) ? 'var(--gold)' : 'var(--border2)',
                transition: 'all 0.15s'
              }} />
            </button>
          ))}
        </div>

        <textarea rows={3} className="input-field mb-5 text-sm resize-none"
          placeholder="Tell us about your experience (optional)..."
          value={comment} onChange={e => setComment(e.target.value)} />

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={submit} disabled={loading || !rating} className="btn-gold flex-1 justify-center">
            {loading ? <span className="spinner w-4 h-4" /> : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
