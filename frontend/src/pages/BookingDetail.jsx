// ── BookingDetail.jsx ────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, Clock, Calendar, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const ST = {
  confirmed: {bg:'#EAF4E0',color:'#1A5C1E'},
  cancelled: {bg:'#FDEEE8',color:'#8C3418'},
  completed: {bg:'#EBF5FD',color:'#1A4C8A'},
  pending:   {bg:'#FEF3E0',color:'#7A4A10'},
}

export default function BookingDetail() {
  const {id} = useParams()
  const navigate = useNavigate()
  const [booking, setBooking]       = useState(null)
  const [loading, setLoading]       = useState(true)
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
      const {data} = await api.patch(`/bookings/${id}/cancel`, {reason:'Cancelled by user'})
      setBooking(data.booking); toast.success('Booking cancelled.')
    } catch (err) { toast.error(err.response?.data?.message||'Cancellation failed.') }
    finally { setCancelling(false) }
  }

  if (loading) return <LoadingSpinner fullPage/>
  if (!booking) return null

  const s = booking.session
  const isPast    = new Date(booking.sessionDate) < new Date()
  const canCancel = booking.status==='confirmed' && !isPast
  const st        = ST[booking.status] || ST.pending
  const fmtDate   = (d) => new Date(d).toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})

  return (
    <div className="pt-20 pb-16" style={{background:'var(--bg)'}}>
      <div className="page-container max-w-2xl">
        <Link to="/my-bookings" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 mt-4 hover:underline" style={{color:'var(--muted)'}}>
          <ChevronLeft size={15}/> Back to My Bookings
        </Link>

        <div className="card shadow-card-hover overflow-hidden">
          {s?.image && (
            <div className="h-48" style={{background:'var(--surface2)'}}>
              <img src={s.image} alt={s.title} className="w-full h-full object-cover"
                onError={e=>{e.target.style.display='none'}}/>
            </div>
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="badge text-xs mb-2" style={{background:st.bg,color:st.color}}>
                  {booking.status.charAt(0).toUpperCase()+booking.status.slice(1)}
                </span>
                <h1 className="font-display text-2xl font-semibold mt-1" style={{color:'var(--text)'}}>{s?.title}</h1>
                <p className="text-sm mt-0.5" style={{color:'var(--muted)'}}>{s?.type} · {s?.instructor?.name}</p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-xs font-mono" style={{color:'var(--faint)'}}>{booking.bookingReference}</p>
                <p className="font-display font-bold text-2xl mt-1" style={{color:'var(--primary)'}}>
                  ₹{booking.payment?.amount?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 p-5 rounded-2xl mb-6" style={{background:'var(--surface2)',border:'1.5px solid var(--border)'}}>
              {[
                [<Calendar size={13}/>, 'Date',     fmtDate(booking.sessionDate)],
                [<Clock size={13}/>,    'Time',     booking.sessionTime],
                [<Clock size={13}/>,    'Duration', `${s?.duration} min`],
                [<MapPin size={13}/>,   'Location', s?.location?.address||'45 Green Park, Rajpur Road, Dehradun'],
              ].map(([icon,label,val]) => (
                <div key={label}>
                  <p className="text-xs flex items-center gap-1 mb-0.5 font-medium" style={{color:'var(--faint)'}}>
                    <span style={{color:'var(--primary)'}}>{icon}</span>{label}
                  </p>
                  <p className="text-sm font-semibold" style={{color:'var(--text)'}}>{val}</p>
                </div>
              ))}
            </div>

            {/* Payment */}
            <div className="p-4 rounded-xl mb-5" style={{background:'#EAF4E0',border:'1px solid #B5D98A'}}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{color:'var(--primary)'}}>
                <CreditCard size={12}/> Payment
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {[['Method',booking.payment?.method?.toUpperCase()],['Status',booking.payment?.status],['Amount',`₹${booking.payment?.amount?.toLocaleString('en-IN')}`]].map(([k,v]) => (
                  <div key={k}>
                    <p className="text-xs" style={{color:'var(--primary)'}}>{k}</p>
                    <p className="font-semibold text-sm" style={{color:'#1A3A1C'}}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {booking.notes && (
              <div className="p-4 rounded-xl mb-4" style={{background:'var(--surface2)',border:'1.5px solid var(--border)'}}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--muted)'}}>Your Notes</p>
                <p className="text-sm" style={{color:'var(--text)'}}>{booking.notes}</p>
              </div>
            )}

            {booking.status==='cancelled' && booking.cancellation && (
              <div className="p-4 rounded-xl mb-4" style={{background:'#FDEEE8',border:'1px solid #F5C4B3'}}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--terra)'}}>Cancellation</p>
                <p className="text-sm" style={{color:'#6C2810'}}>{booking.cancellation.reason}</p>
              </div>
            )}

            {booking.feedback?.rating && (
              <div className="p-4 rounded-xl mb-4" style={{background:'#FEF3E0',border:'1px solid #FACB7A'}}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#8C5C10'}}>Your Review</p>
                <div className="flex gap-0.5 mb-1">
                  {[...Array(5)].map((_,i) => (
                    <span key={i} style={{color:i<booking.feedback.rating?'#F59E0B':'#E8E2D9',fontSize:18}}>★</span>
                  ))}
                </div>
                {booking.feedback.comment && <p className="text-sm italic" style={{color:'#7A4A10'}}>"{booking.feedback.comment}"</p>}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/sessions" className="btn-outline flex-1 justify-center text-sm py-2.5">Browse Sessions</Link>
              {canCancel && (
                <button onClick={handleCancel} disabled={cancelling}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={{borderColor:'#F5C4B3',color:'var(--terra)',background:'#FDEEE8'}}>
                  {cancelling ? <span className="spinner w-4 h-4"/> : null}
                  {cancelling ? 'Cancelling…' : 'Cancel Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
