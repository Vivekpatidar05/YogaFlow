import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Clock, Users, Star, ChevronRight, Calendar, MapPin, ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const lvlBadge = {
  'Beginner':'badge-green','Intermediate':'badge-amber','Advanced':'badge-terra','All Levels':'badge-blue'
}

export default function SessionDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSel] = useState(null)

  useEffect(() => {
    api.get(`/sessions/${id}`)
      .then(r => { setSession(r.data.session); setSel(r.data.session.availability?.[0] || null) })
      .catch(() => navigate('/sessions'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner fullPage />
  if (!session) return null

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="pt-20 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="page-container">
        <Link to="/sessions" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 mt-4 transition-colors hover:underline"
          style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={15} /> Back to Sessions
        </Link>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main */}
          <div className="lg:col-span-2">
            {/* Hero image */}
            <div className="relative h-72 md:h-[400px] rounded-2xl overflow-hidden mb-8"
              style={{ background: 'var(--surface2)' }}>
              {session.image && (
                <img src={session.image} alt={session.title} className="w-full h-full object-cover"
                  onError={e => { e.target.onerror=null; e.target.style.opacity=0 }} />
              )}
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.55) 100%)' }} />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`badge ${lvlBadge[session.level] || 'badge-gray'}`}>{session.level}</span>
                <span className="badge badge-green">{session.type}</span>
              </div>
              <div className="absolute bottom-5 left-6 right-6">
                <h1 className="font-display text-3xl md:text-4xl font-semibold text-white">{session.title}</h1>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-5 text-sm mb-8 pb-6"
              style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--muted)' }}>
              <span className="flex items-center gap-1.5">
                <Clock size={15} style={{ color: 'var(--primary)' }} />{session.duration} minutes
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={15} style={{ color: 'var(--primary)' }} />Up to {session.maxCapacity} students
              </span>
              {session.rating?.count > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star size={15} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
                  {session.rating.average} ({session.rating.count} reviews)
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin size={15} style={{ color: 'var(--primary)' }} />
                {session.location?.address || '45 Green Park, Rajpur Road, Dehradun'}
              </span>
            </div>

            {/* About */}
            <div className="mb-8">
              <h2 className="font-display text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>About This Session</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{session.description}</p>
            </div>

            {/* Instructor */}
            <div className="card p-5 mb-8 shadow-card">
              <h2 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Your Instructor</h2>
              <div className="flex items-start gap-4">
                {session.instructor?.avatar && (
                  <img src={session.instructor.avatar} alt={session.instructor.name}
                    className="w-14 h-14 rounded-full object-cover border-2"
                    style={{ borderColor: '#B5D98A' }} />
                )}
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text)' }}>{session.instructor?.name}</p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{session.instructor?.bio}</p>
                </div>
              </div>
            </div>

            {/* Weekly schedule */}
            <div>
              <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Weekly Schedule</h2>
              <div className="flex flex-wrap gap-2">
                {session.schedule?.map((s, i) => (
                  <div key={i} className="card px-4 py-2.5 text-sm shadow-card">
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{s.day}</span>
                    <span className="ml-2" style={{ color: 'var(--muted)' }}>at {s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky booking sidebar */}
          <div>
            <div className="sticky top-24 card p-6 shadow-card-hover">
              {/* Price */}
              <div className="text-center mb-6 pb-5" style={{ borderBottom: '1.5px solid var(--border)' }}>
                <p className="font-display text-4xl font-semibold" style={{ color: 'var(--primary)' }}>
                  ₹{session.price?.toLocaleString('en-IN')}
                </p>
                <p className="text-xs font-medium mt-1" style={{ color: 'var(--faint)' }}>per session</p>
              </div>

              {/* Slots */}
              <div className="mb-5">
                <p className="label mb-3">Available Slots</p>
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                  {session.availability?.length > 0 ? session.availability.map((slot, i) => (
                    <button key={i} onClick={() => setSel(slot)} disabled={slot.isFull}
                      className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm"
                      style={{
                        borderColor: selectedSlot?.date === slot.date ? 'var(--primary)' : slot.isFull ? 'var(--border)' : 'var(--border2)',
                        background:  selectedSlot?.date === slot.date ? '#EAF4E0' : 'var(--surface)',
                        opacity:     slot.isFull ? 0.5 : 1,
                        cursor:      slot.isFull ? 'not-allowed' : 'pointer',
                      }}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>{fmtDate(slot.date)}</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{slot.time}</span>
                      </div>
                      <p className="text-xs mt-0.5 font-medium"
                        style={{ color: slot.isFull ? 'var(--terra)' : 'var(--primary)' }}>
                        {slot.isFull ? '⛔ Fully Booked' : `${slot.spotsLeft} spot${slot.spotsLeft !== 1 ? 's' : ''} left`}
                      </p>
                    </button>
                  )) : (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>No upcoming slots available.</p>
                  )}
                </div>
              </div>

              {/* CTA */}
              {isAuthenticated ? (
                <Link to={`/book/${session._id}`} state={{ slot: selectedSlot, session }}
                  className={`btn-primary w-full justify-center py-3.5 gap-2 ${!selectedSlot || selectedSlot.isFull ? 'opacity-50 pointer-events-none' : ''}`}>
                  Book This Session <ChevronRight size={15} />
                </Link>
              ) : (
                <Link to="/login" state={{ from: { pathname: `/book/${session._id}` } }}
                  className="btn-primary w-full justify-center py-3.5 gap-2">
                  Sign In to Book <ChevronRight size={15} />
                </Link>
              )}

              <p className="text-xs text-center mt-3" style={{ color: 'var(--faint)' }}>
                {session.cancellationPolicy || 'Free cancellation up to 2 hours before.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
