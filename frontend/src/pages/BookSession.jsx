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

  const [session, setSession]       = useState(location.state?.session || null)
  const [availability, setAvail]    = useState([])
  const [selectedSlot, setSel]      = useState(location.state?.slot || null)
  const [form, setForm]             = useState({ notes:'', specialRequirements:'', paymentMethod:'cash' })
  const [loading, setLoading]       = useState(!session)
  const [submitting, setSubmitting] = useState(false)
  const [booked, setBooked]         = useState(null)

  useEffect(() => {
    if (!session) {
      api.get(`/sessions/${id}`).then(r => {
        setSession(r.data.session)
        setAvail(r.data.session.availability || [])
        if (!selectedSlot) setSel(r.data.session.availability?.[0] || null)
      }).catch(() => navigate('/sessions')).finally(() => setLoading(false))
    } else {
      api.get(`/sessions/${id}`).then(r => setAvail(r.data.session.availability || [])).catch(() => {})
    }
  }, [id])

  const handleBook = async (e) => {
    e.preventDefault()
    if (!selectedSlot) return toast.error('Please select a date and time first.')
    setSubmitting(true)
    try {
      const { data } = await api.post('/bookings', {
        sessionId: id,
        sessionDate: selectedSlot.date,
        sessionTime: selectedSlot.time,
        notes: form.notes,
        specialRequirements: form.specialRequirements,
        paymentMethod: form.paymentMethod,
      })
      setBooked(data.booking)
      toast.success('Booking confirmed! Check your email.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally { setSubmitting(false) }
  }

  if (loading) return <LoadingSpinner fullPage />

  // ── Success screen ──────────────────────────────────────────────────────────
  if (booked) return (
    <div className="pt-20 pb-16 min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="max-w-md w-full mx-auto px-4">
        <div className="card p-10 text-center shadow-card-hover">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: '#EAF4E0', border: '3px solid #B5D98A' }}>
            <CheckCircle size={36} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-2" style={{ color: 'var(--text)' }}>Booking Confirmed!</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Confirmation sent to <strong style={{ color: 'var(--text)' }}>{user?.email}</strong>
          </p>

          <div className="rounded-2xl p-5 mb-6 text-left space-y-3"
            style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)' }}>
            <SumRow label="Reference"
              value={<span className="font-mono font-bold text-sm" style={{ color: 'var(--primary)' }}>{booked.bookingReference}</span>} />
            <SumRow label="Session"  value={session?.title} />
            <SumRow label="Date"     value={new Date(booked.sessionDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} />
            <SumRow label="Time"     value={booked.sessionTime} />
            <SumRow label="Amount"   value={`₹${booked.payment?.amount?.toLocaleString('en-IN')}`} />
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/my-bookings" className="btn-primary w-full justify-center py-3.5">View My Bookings</Link>
            <Link to="/sessions" className="btn-ghost w-full justify-center text-sm" style={{ color: 'var(--muted)' }}>Browse More Sessions</Link>
          </div>
        </div>
      </div>
    </div>
  )

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="pt-20 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="page-container max-w-5xl">
        <Link to={`/sessions/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 mt-4 hover:underline"
          style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={15} /> Back to Session
        </Link>
        <h1 className="font-display text-3xl font-semibold mb-8" style={{ color: 'var(--text)' }}>Complete Your Booking</h1>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Steps */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step 1 – Date */}
            <div className="card p-6 shadow-card">
              <h2 className="font-semibold flex items-center gap-2 mb-5" style={{ color: 'var(--text)' }}>
                <StepBadge n="1" /> Select Date &amp; Time
              </h2>
              {availability.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>No upcoming slots available.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availability.map((slot, i) => (
                    <button key={i} onClick={() => setSel(slot)} disabled={slot.isFull}
                      className="p-3 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: selectedSlot?.date === slot.date ? 'var(--primary)' : slot.isFull ? 'var(--border)' : 'var(--border2)',
                        background:  selectedSlot?.date === slot.date ? '#EAF4E0' : 'var(--surface)',
                        opacity:     slot.isFull ? 0.45 : 1,
                        cursor:      slot.isFull ? 'not-allowed' : 'pointer',
                      }}>
                      <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{fmtDate(slot.date)}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{slot.time}</p>
                      <p className="text-xs mt-1 font-semibold"
                        style={{ color: slot.isFull ? 'var(--terra)' : 'var(--primary)' }}>
                        {slot.isFull ? 'Full' : `${slot.spotsLeft} left`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2 – Your details */}
            <div className="card p-6 shadow-card">
              <h2 className="font-semibold flex items-center gap-2 mb-5" style={{ color: 'var(--text)' }}>
                <StepBadge n="2" /> Your Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {[['First Name', user?.firstName], ['Last Name', user?.lastName], ['Email', user?.email], ['Phone', user?.phone || '—']].map(([l, v]) => (
                  <div key={l}>
                    <label className="label">{l}</label>
                    <input readOnly value={v} className="input-field text-sm" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                style={{ background: '#EAF4E0', border: '1px solid #B5D98A', color: 'var(--primary)' }}>
                <Info size={12} style={{ flexShrink: 0 }} />
                Details loaded from your profile.{' '}
                <Link to="/profile" className="font-semibold underline" style={{ color: 'var(--primary)' }}>Update profile →</Link>
              </div>
            </div>

            {/* Step 3 – Notes + Payment */}
            <div className="card p-6 shadow-card">
              <h2 className="font-semibold flex items-center gap-2 mb-5" style={{ color: 'var(--text)' }}>
                <StepBadge n="3" /> Notes &amp; Payment
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Notes for instructor
                    <span className="ml-1 normal-case tracking-normal font-normal text-xs" style={{ color: 'var(--faint)' }}>(optional)</span>
                  </label>
                  <textarea rows={3} className="input-field resize-none text-sm"
                    placeholder="Preferences or questions for the instructor…"
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Special Requirements
                    <span className="ml-1 normal-case tracking-normal font-normal text-xs" style={{ color: 'var(--faint)' }}>(optional)</span>
                  </label>
                  <textarea rows={2} className="input-field resize-none text-sm"
                    placeholder="Injuries, medical conditions, props needed…"
                    value={form.specialRequirements} onChange={e => setForm(f => ({ ...f, specialRequirements: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ v:'cash',l:'💵 Cash' }, { v:'upi',l:'📱 UPI' }, { v:'card',l:'💳 Card' }].map(m => (
                      <button key={m.v} type="button" onClick={() => setForm(f => ({ ...f, paymentMethod: m.v }))}
                        className="p-3 rounded-xl border-2 text-center transition-all"
                        style={{
                          borderColor: form.paymentMethod === m.v ? 'var(--primary)' : 'var(--border)',
                          background:  form.paymentMethod === m.v ? '#EAF4E0' : 'var(--surface)',
                        }}>
                        <div className="text-sm font-medium">{m.l}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--faint)' }}>Pay at studio</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleBook} disabled={submitting || !selectedSlot}
              className="btn-primary w-full justify-center py-4 text-base">
              {submitting
                ? <><span className="spinner w-5 h-5" />Confirming…</>
                : 'Confirm Booking'
              }
            </button>
          </div>

          {/* Sidebar summary */}
          <div>
            <div className="sticky top-24 card p-5 shadow-card">
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Booking Summary</h3>
              {session?.image && (
                <div className="h-28 rounded-xl overflow-hidden mb-4" style={{ background: 'var(--surface2)' }}>
                  <img src={session.image} alt="" className="w-full h-full object-cover"
                    onError={e => { e.target.onerror=null; e.target.style.display='none' }} />
                </div>
              )}
              <h4 className="font-display font-semibold mb-1" style={{ color: 'var(--text)' }}>{session?.title}</h4>
              <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>{session?.type} · {session?.instructor?.name}</p>

              <div className="space-y-3 text-sm border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <SumRow icon={<Calendar size={13} />} label="Date"     value={selectedSlot ? fmtDate(selectedSlot.date) : 'Select a date'} />
                <SumRow icon={<Clock size={13} />}    label="Time"     value={selectedSlot?.time || '—'} />
                <SumRow icon={<User size={13} />}     label="Duration" value={session?.duration ? `${session.duration} min` : '—'} />
                <SumRow icon={<CreditCard size={13}/>} label="Payment" value={form.paymentMethod.toUpperCase()} />
              </div>

              <div className="border-t mt-4 pt-4 flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Total</span>
                <span className="font-bold text-2xl font-display" style={{ color: 'var(--primary)' }}>
                  ₹{session?.price?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const StepBadge = ({ n }) => (
  <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white shrink-0"
    style={{ background: 'var(--primary)' }}>{n}</span>
)

const SumRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between">
    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
      {icon && <span style={{ color: 'var(--primary)' }}>{icon}</span>}{label}
    </span>
    <span className="font-semibold text-xs max-w-[60%] text-right truncate" style={{ color: 'var(--text)' }}>{value}</span>
  </div>
)
