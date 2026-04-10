import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, ChevronRight, X, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS = {
  confirmed: { bg:'#EAF4E0', color:'#1A5C1E', label:'Confirmed' },
  pending:   { bg:'#FEF3E0', color:'#7A4A10', label:'Pending'   },
  cancelled: { bg:'#FDEEE8', color:'#8C3418', label:'Cancelled' },
  completed: { bg:'#EBF5FD', color:'#1A4C8A', label:'Completed' },
  'no-show': { bg:'#F5F5F4', color:'#6B6860', label:'No-Show'   },
}

export default function MyBookings() {
  const [bookings, setBookings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')
  const [cancelling, setCancelling] = useState(null)
  const [feedback, setFeedback]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = filter !== 'all' ? `?status=${filter}` : ''
      const { data } = await api.get(`/bookings/my${q}`)
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
      toast.success('Booking cancelled.'); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Cancellation failed.') }
    finally { setCancelling(null) }
  }

  const TABS = [
    {key:'all',       label:'All'},
    {key:'confirmed', label:'Upcoming'},
    {key:'completed', label:'Completed'},
    {key:'cancelled', label:'Cancelled'},
  ]

  return (
    <div className="pt-20 pb-16" style={{background:'var(--bg)'}}>
      <div className="page-container max-w-4xl">
        <div className="py-6 mb-6">
          <p className="eyebrow mb-2">History</p>
          <h1 className="font-display text-3xl font-semibold" style={{color:'var(--text)'}}>My Bookings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl w-fit mb-8" style={{background:'var(--surface2)', border:'1.5px solid var(--border)'}}>
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

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg"/></div>
        ) : bookings.length === 0 ? (
          <div className="card text-center py-20 shadow-card">
            <div className="text-5xl mb-4">🗓</div>
            <h3 className="font-display text-xl mb-2" style={{color:'var(--text)'}}>No bookings found</h3>
            <p className="text-sm mb-5" style={{color:'var(--muted)'}}>
              {filter==='all' ? "You haven't booked any sessions yet." : `No ${filter} bookings.`}
            </p>
            <Link to="/sessions" className="btn-primary text-sm px-6">Browse Sessions</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => {
              const st = STATUS[b.status] || STATUS.pending
              const isPast = new Date(b.sessionDate) < new Date()
              const canCancel = b.status==='confirmed' && !isPast

              return (
                <div key={b._id} className="card shadow-card transition-all hover:shadow-card-hover overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {b.session?.image && (
                      <div className="sm:w-28 h-24 sm:h-auto flex-shrink-0" style={{background:'var(--surface2)'}}>
                        <img src={b.session.image} alt="" className="w-full h-full object-cover"
                          onError={e=>{e.target.style.display='none'}} />
                      </div>
                    )}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="badge text-xs" style={{background:st.bg, color:st.color}}>{st.label}</span>
                            <span className="text-xs font-mono" style={{color:'var(--faint)'}}>#{b.bookingReference}</span>
                          </div>
                          <h3 className="font-display font-semibold text-lg leading-tight" style={{color:'var(--text)'}}>{b.session?.title}</h3>
                          <p className="text-xs font-medium" style={{color:'var(--muted)'}}>{b.session?.type} · {b.session?.instructor?.name}</p>
                        </div>
                        <p className="font-bold text-lg font-display shrink-0" style={{color:'var(--primary)'}}>
                          ₹{b.payment?.amount?.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs mb-3" style={{color:'var(--muted)'}}>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} style={{color:'var(--primary)'}}/>
                          {new Date(b.sessionDate).toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'})}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} style={{color:'var(--primary)'}}/>{b.sessionTime}
                        </span>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Link to={`/my-bookings/${b._id}`} className="btn-ghost text-xs py-1.5 px-3 gap-1"
                          style={{border:'1px solid var(--border)', borderRadius:'8px', color:'var(--muted)'}}>
                          Details <ChevronRight size={11}/>
                        </Link>
                        {canCancel && (
                          <button onClick={()=>cancel(b._id)} disabled={cancelling===b._id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium hover:bg-red-50"
                            style={{color:'var(--terra)', border:'1px solid #F5C4B3'}}>
                            {cancelling===b._id ? <span className="spinner w-3 h-3"/> : <X size={11}/>}
                            Cancel
                          </button>
                        )}
                        {b.status==='completed' && !b.feedback?.rating && (
                          <button onClick={()=>setFeedback(b)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium hover:bg-amber-50"
                            style={{color:'#8C5C10', border:'1px solid #FACB7A'}}>
                            <Star size={11}/> Rate Session
                          </button>
                        )}
                        {b.feedback?.rating && (
                          <span className="text-xs font-medium flex items-center gap-1" style={{color:'#8C5C10'}}>
                            {'★'.repeat(b.feedback.rating)}{'☆'.repeat(5-b.feedback.rating)} Reviewed
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

      {feedback && <FeedbackModal booking={feedback} onClose={()=>setFeedback(null)} onSuccess={load}/>}
    </div>
  )
}

function FeedbackModal({ booking, onClose, onSuccess }) {
  const [rating, setRating]   = useState(0)
  const [hover, setHover]     = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!rating) return toast.error('Please select a rating.')
    setLoading(true)
    try {
      await api.post(`/bookings/${booking._id}/feedback`, {rating, comment})
      toast.success('Thanks for your feedback!'); onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:'rgba(0,0,0,0.4)'}} onClick={onClose}>
      <div className="card p-8 max-w-md w-full shadow-card-hover" onClick={e=>e.stopPropagation()}>
        <h2 className="font-display text-2xl font-semibold mb-1" style={{color:'var(--text)'}}>Rate Your Session</h2>
        <p className="text-sm mb-6" style={{color:'var(--muted)'}}>{booking.session?.title}</p>

        <div className="flex justify-center gap-3 mb-6">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={()=>setRating(n)}
              onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}
              className="transition-transform hover:scale-110">
              <Star size={36} style={{
                fill:   n<=(hover||rating) ? '#F59E0B' : 'transparent',
                color:  n<=(hover||rating) ? '#F59E0B' : 'var(--border2)',
                transition:'all 0.15s',
              }}/>
            </button>
          ))}
        </div>

        <textarea rows={3} className="input-field mb-5 text-sm resize-none"
          placeholder="Tell us about your experience (optional)…"
          value={comment} onChange={e=>setComment(e.target.value)}/>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={submit} disabled={loading||!rating} className="btn-primary flex-1 justify-center">
            {loading ? <span className="spinner w-4 h-4"/> : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
