import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Clock, User, CreditCard, CheckCircle, ChevronLeft, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function BookSession() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [session, setSession] = useState(location.state?.session || null)
  const [availability, setAvailability] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(location.state?.slot || null)
  const [form, setForm] = useState({ notes: '', specialRequirements: '', paymentMethod: 'cash' })
  const [loading, setLoading] = useState(!session)
  const [submitting, setSubmitting] = useState(false)
  const [booked, setBooked] = useState(null)

  useEffect(() => {
    if (!session) {
      api.get(`/sessions/${id}`).then(r => {
        setSession(r.data.session)
        setAvailability(r.data.session.availability || [])
        if (!selectedSlot) setSelectedSlot(r.data.session.availability?.[0] || null)
      }).catch(() => navigate('/sessions')).finally(() => setLoading(false))
    } else {
      api.get(`/sessions/${id}`).then(r => setAvailability(r.data.session.availability || [])).catch(() => {})
    }
  }, [id])

  const handleBook = async (e) => {
    e.preventDefault()
    if (!selectedSlot) return toast.error('Please select a session date.')
    setSubmitting(true)
    try {
      const { data } = await api.post('/bookings', {
        sessionId: id, sessionDate: selectedSlot.date, sessionTime: selectedSlot.time,
        notes: form.notes, specialRequirements: form.specialRequirements, paymentMethod: form.paymentMethod
      })
      setBooked(data.booking)
      toast.success('Booking confirmed! Check your email.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally { setSubmitting(false) }
  }

  if (loading) return <LoadingSpinner fullPage />

  if (booked) return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
      <div className="max-w-md w-full mx-auto px-4">
        <div className="card p-10 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.2)'}}>
            <CheckCircle size={36} style={{color:'var(--gold)'}} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-[#e8e8e8] mb-2">Booking Confirmed!</h1>
          <p className="text-sm mb-6" style={{color:'var(--muted)'}}>
            Confirmation sent to <strong className="text-[#e8e8e8]">{user?.email}</strong>
          </p>

          <div className="rounded-xl p-5 mb-6 text-left space-y-3"
            style={{background:'var(--surface2)', border:'1px solid var(--border)'}}>
            <SumRow label="Reference" value={<span className="font-mono font-bold" style={{color:'var(--gold)'}}>{booked.bookingReference}</span>} />
            <SumRow label="Session" value={session?.title} />
            <SumRow label="Date" value={new Date(booked.sessionDate).toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})} />
            <SumRow label="Time"  value={booked.sessionTime} />
            <SumRow label="Amount" value={`₹${booked.payment?.amount?.toLocaleString('en-IN')}`} />
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/my-bookings" className="btn-gold w-full justify-center py-3.5">View My Bookings</Link>
            <Link to="/sessions" className="btn-ghost w-full justify-center text-sm">Browse More Sessions</Link>
          </div>
        </div>
      </div>
    </div>
  )

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'})

  return (
    <div className="pt-24 pb-16" style={{background:'var(--bg)'}}>
      <div className="page-container max-w-5xl">
        <Link to={`/sessions/${id}`} className="inline-flex items-center gap-1 text-sm mb-6 transition-colors"
          style={{color:'var(--muted)'}}>
          <ChevronLeft size={14}/> Back to Session
        </Link>
        <h1 className="font-display text-3xl font-semibold text-[#e8e8e8] mb-8">Complete Your Booking</h1>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">

            {/* Step 1 */}
            <div className="card p-6">
              <h2 className="font-medium text-[#e8e8e8] flex items-center gap-2 mb-5">
                <StepNum n="1"/> Select a Date & Time
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availability.map((slot, i) => (
                  <button key={i} onClick={() => setSelectedSlot(slot)} disabled={slot.isFull}
                    className="p-3 rounded-xl text-left transition-all border"
                    style={{
                      borderColor: selectedSlot?.date===slot.date ? 'var(--gold)' : slot.isFull ? 'var(--border)' : 'var(--border2)',
                      background: selectedSlot?.date===slot.date ? 'rgba(201,168,76,0.08)' : 'var(--surface2)',
                      opacity: slot.isFull ? 0.4 : 1,
                      cursor: slot.isFull ? 'not-allowed' : 'pointer'
                    }}>
                    <p className="text-xs font-semibold text-[#e8e8e8]">{formatDate(slot.date)}</p>
                    <p className="text-xs mt-0.5" style={{color:'var(--muted)'}}>{slot.time}</p>
                    <p className="text-xs mt-1 font-medium" style={{color: slot.isFull?'#f87171':'var(--gold)'}}>
                      {slot.isFull ? 'Full' : `${slot.spotsLeft} left`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 */}
            <div className="card p-6">
              <h2 className="font-medium text-[#e8e8e8] flex items-center gap-2 mb-5">
                <StepNum n="2"/> Your Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {[['First Name', user?.firstName], ['Last Name', user?.lastName], ['Email', user?.email], ['Phone', user?.phone || '—']].map(([l, v]) => (
                  <div key={l}>
                    <label className="label">{l}</label>
                    <input readOnly value={v} className="input-field text-sm" style={{opacity:0.6, cursor:'not-allowed'}} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.1)', color:'var(--muted)'}}>
                <Info size={11} style={{color:'var(--gold)',flexShrink:0}}/>
                Loaded from your profile.{' '}
                <Link to="/profile" style={{color:'var(--gold)'}}>Update profile →</Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card p-6">
              <h2 className="font-medium text-[#e8e8e8] flex items-center gap-2 mb-5">
                <StepNum n="3"/> Notes & Payment
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Notes for instructor <span style={{textTransform:'none',letterSpacing:'normal',fontWeight:'normal',fontSize:'11px',color:'var(--faint)'}}>(optional)</span></label>
                  <textarea rows={3} className="input-field resize-none text-sm"
                    placeholder="Preferences or questions for the instructor..."
                    value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
                </div>
                <div>
                  <label className="label">Special Requirements <span style={{textTransform:'none',letterSpacing:'normal',fontWeight:'normal',fontSize:'11px',color:'var(--faint)'}}>(optional)</span></label>
                  <textarea rows={2} className="input-field resize-none text-sm"
                    placeholder="Injuries, medical conditions, props..."
                    value={form.specialRequirements} onChange={e => setForm(f=>({...f,specialRequirements:e.target.value}))} />
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{v:'cash',l:'💵 Cash'},{v:'upi',l:'📱 UPI'},{v:'card',l:'💳 Card'}].map(m => (
                      <button key={m.v} type="button" onClick={() => setForm(f=>({...f,paymentMethod:m.v}))}
                        className="p-3 rounded-xl text-center transition-all border"
                        style={{
                          borderColor: form.paymentMethod===m.v ? 'var(--gold)' : 'var(--border)',
                          background: form.paymentMethod===m.v ? 'rgba(201,168,76,0.08)' : 'var(--surface2)'
                        }}>
                        <div className="text-sm">{m.l}</div>
                        <div className="text-xs mt-0.5" style={{color:'var(--muted)'}}>Pay at studio</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleBook} disabled={submitting || !selectedSlot}
              className="btn-gold w-full justify-center py-4 text-base">
              {submitting
                ? <><span className="spinner w-5 h-5"/><span>Confirming...</span></>
                : 'Confirm Booking'
              }
            </button>
          </div>

          {/* Summary sidebar */}
          <div>
            <div className="sticky top-24 card p-5">
              <h3 className="font-medium text-[#e8e8e8] text-sm mb-4">Summary</h3>
              {session?.image && (
                <div className="h-28 rounded-xl overflow-hidden mb-4" style={{background:'var(--surface2)'}}>
                  <img src={session.image} alt="" className="w-full h-full object-cover" style={{opacity:0.6}}
                    onError={e=>{e.target.onerror=null;e.target.style.display='none'}} />
                </div>
              )}
              <h4 className="font-display font-semibold text-[#e8e8e8] mb-1">{session?.title}</h4>
              <p className="text-xs mb-4" style={{color:'var(--muted)'}}>{session?.type} · {session?.instructor?.name}</p>

              <div className="space-y-2 text-sm border-t pt-4" style={{borderColor:'var(--border)'}}>
                <SumRow icon={<Calendar size={12}/>} label="Date"     value={selectedSlot ? formatDate(selectedSlot.date) : '—'} />
                <SumRow icon={<Clock size={12}/>}    label="Time"     value={selectedSlot?.time || '—'} />
                <SumRow icon={<User size={12}/>}     label="Duration" value={session?.duration ? `${session.duration} min` : '—'} />
                <SumRow icon={<CreditCard size={12}/>} label="Payment" value={form.paymentMethod.toUpperCase()} />
              </div>

              <div className="border-t mt-4 pt-4 flex justify-between items-center" style={{borderColor:'var(--border)'}}>
                <span className="font-medium text-[#e8e8e8] text-sm">Total</span>
                <span className="font-bold text-xl" style={{color:'var(--gold)'}}>₹{session?.price?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const StepNum = ({ n }) => (
  <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
    style={{background:'var(--gold)', color:'#0a0a0a'}}>{n}</span>
)

const SumRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between">
    <span className="flex items-center gap-1.5 text-xs" style={{color:'var(--muted)'}}>
      {icon && <span style={{color:'var(--gold)'}}>{icon}</span>}{label}
    </span>
    <span className="font-medium text-right max-w-32 truncate text-xs text-[#e8e8e8]">{value}</span>
  </div>
)
