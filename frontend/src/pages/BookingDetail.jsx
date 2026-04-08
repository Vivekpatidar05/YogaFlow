// BookingDetail.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, Clock, Calendar, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const statusStyle = {
  confirmed:  { bg: 'rgba(74,222,128,0.1)',  color: '#4ade80'  },
  cancelled:  { bg: 'rgba(248,113,113,0.1)', color: '#f87171'  },
  completed:  { bg: 'rgba(147,197,253,0.1)', color: '#93c5fd'  },
  pending:    { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24'  },
}

export function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then(r => setBooking(r.data.booking))
      .catch(() => { toast.error('Booking not found.'); navigate('/my-bookings') })
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!confirm('Cancel this booking?')) return
    setCancelling(true)
    try {
      const { data } = await api.patch(`/bookings/${id}/cancel`, { reason: 'Cancelled by user' })
      setBooking(data.booking)
      toast.success('Booking cancelled.')
    } catch (err) { toast.error(err.response?.data?.message || 'Cancellation failed.') }
    finally { setCancelling(false) }
  }

  if (loading) return <LoadingSpinner fullPage />
  if (!booking) return null

  const s = booking.session
  const isPast = new Date(booking.sessionDate) < new Date()
  const canCancel = booking.status === 'confirmed' && !isPast
  const st = statusStyle[booking.status] || statusStyle.pending

  return (
    <div className="pt-24 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="page-container max-w-2xl">
        <Link to="/my-bookings" className="inline-flex items-center gap-1 text-sm mb-6 transition-colors"
          style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={14} /> Back to My Bookings
        </Link>

        <div className="card overflow-hidden">
          {s?.image && (
            <div className="h-44" style={{ background: 'var(--surface2)' }}>
              <img src={s.image} alt="" className="w-full h-full object-cover" style={{ opacity: 0.55 }}
                onError={e => { e.target.style.display = 'none' }} />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="badge text-xs mb-2" style={{ background: st.bg, color: st.color }}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
                <h1 className="font-display text-2xl font-semibold text-[#e8e8e8] mt-1">{s?.title}</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{s?.type} · {s?.instructor?.name}</p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-xs font-mono" style={{ color: 'var(--faint)' }}>{booking.bookingReference}</p>
                <p className="font-bold text-2xl mt-1" style={{ color: 'var(--gold)' }}>
                  ₹{booking.payment?.amount?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 rounded-xl mb-6"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              {[
                [<Calendar size={13} />, 'Date', new Date(booking.sessionDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })],
                [<Clock size={13} />, 'Time', booking.sessionTime],
                [<Clock size={13} />, 'Duration', `${s?.duration} min`],
                [<MapPin size={13} />, 'Location', s?.location?.address || '45 Green Park, Rajpur Road, Dehradun'],
              ].map(([icon, label, val]) => (
                <div key={label}>
                  <p className="text-xs flex items-center gap-1 mb-0.5" style={{ color: 'var(--muted)' }}>
                    <span style={{ color: 'var(--gold)' }}>{icon}</span>{label}
                  </p>
                  <p className="text-sm font-medium text-[#e8e8e8]">{val}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                style={{ color: 'var(--gold)' }}>
                <CreditCard size={12} /> Payment
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {[['Method', booking.payment?.method?.toUpperCase()], ['Status', booking.payment?.status], ['Amount', `₹${booking.payment?.amount?.toLocaleString('en-IN')}`]].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{k}</p>
                    <p className="font-medium text-[#e8e8e8]">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {booking.notes && (
              <div className="p-4 rounded-xl mb-4"
                style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gold)' }}>Notes</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{booking.notes}</p>
              </div>
            )}

            {booking.status === 'cancelled' && booking.cancellation && (
              <div className="p-4 rounded-xl mb-5"
                style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#f87171' }}>Cancellation</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{booking.cancellation.reason}</p>
              </div>
            )}

            {booking.feedback?.rating && (
              <div className="p-4 rounded-xl mb-4"
                style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.1)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--gold)' }}>Your Review</p>
                <div className="flex gap-0.5 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: i < booking.feedback.rating ? 'var(--gold)' : 'var(--border2)', fontSize: 18 }}>★</span>
                  ))}
                </div>
                {booking.feedback.comment && <p className="text-sm italic" style={{ color: 'var(--muted)' }}>"{booking.feedback.comment}"</p>}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/sessions" className="btn-outline flex-1 justify-center text-sm py-2.5">Browse Sessions</Link>
              {canCancel && (
                <button onClick={handleCancel} disabled={cancelling}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors"
                  style={{ borderColor: 'rgba(248,113,113,0.3)', color: '#f87171' }}>
                  {cancelling ? <span className="spinner w-4 h-4" /> : null}
                  {cancelling ? 'Cancelling…' : 'Cancel Booking'}
                </button>
              )}
            </div>
            {canCancel && (
              <p className="text-xs text-center mt-3" style={{ color: 'var(--faint)' }}>
                {s?.cancellationPolicy || 'Free cancellation up to 2 hours before.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingDetail
