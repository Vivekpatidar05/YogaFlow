import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Clock, Users, Star, ChevronRight, Calendar, MapPin, ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const levelColors = {
  'Beginner':     { bg: 'rgba(74,222,128,0.1)',  color: '#4ade80' },
  'Intermediate': { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24' },
  'Advanced':     { bg: 'rgba(248,113,113,0.1)', color: '#f87171' },
  'All Levels':   { bg: 'rgba(147,197,253,0.1)', color: '#93c5fd' },
}

export default function SessionDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    api.get(`/sessions/${id}`)
      .then(r => { setSession(r.data.session); setSelectedSlot(r.data.session.availability?.[0] || null) })
      .catch(() => navigate('/sessions'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner fullPage />
  if (!session) return null

  const lvl = levelColors[session.level] || { bg: 'rgba(255,255,255,0.06)', color: '#aaa' }
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="pt-24 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="page-container">
        <Link to="/sessions" className="inline-flex items-center gap-1 text-sm mb-6 transition-colors"
          style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={14} /> Back to Sessions
        </Link>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Hero image */}
            <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-8"
              style={{ background: 'var(--surface2)' }}>
              {session.image && (
                <img src={session.image} alt={session.title}
                  className="w-full h-full object-cover" style={{ opacity: 0.6 }}
                  onError={e => { e.target.onerror = null; e.target.style.opacity = 0 }} />
              )}
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8) 100%)' }} />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="badge" style={{ background: lvl.bg, color: lvl.color }}>{session.level}</span>
                  <span className="badge" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold)' }}>
                    {session.type}
                  </span>
                </div>
                <h1 className="font-display text-3xl font-semibold text-[#e8e8e8]">{session.title}</h1>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-5 text-sm mb-8" style={{ color: 'var(--muted)' }}>
              <span className="flex items-center gap-1.5"><Clock size={14} style={{ color: 'var(--gold)' }} />{session.duration} minutes</span>
              <span className="flex items-center gap-1.5"><Users size={14} style={{ color: 'var(--gold)' }} />Up to {session.maxCapacity} students</span>
              {session.rating?.count > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star size={14} style={{ fill: 'var(--gold)', color: 'var(--gold)' }} />
                  {session.rating.average} ({session.rating.count} reviews)
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin size={14} style={{ color: 'var(--gold)' }} />
                {session.location?.address || '45 Green Park, Rajpur Road, Dehradun'}
              </span>
            </div>

            {/* About */}
            <div className="mb-8">
              <h2 className="font-display text-xl font-semibold text-[#e8e8e8] mb-3">About This Session</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{session.description}</p>
            </div>

            {/* Instructor */}
            <div className="card p-5 mb-8">
              <h2 className="font-display text-lg font-semibold text-[#e8e8e8] mb-4">Your Instructor</h2>
              <div className="flex items-start gap-4">
                {session.instructor?.avatar && (
                  <img src={session.instructor.avatar} alt={session.instructor.name}
                    className="w-14 h-14 rounded-full object-cover border"
                    style={{ borderColor: 'rgba(201,168,76,0.3)' }} />
                )}
                <div>
                  <p className="font-semibold text-[#e8e8e8]">{session.instructor?.name}</p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {session.instructor?.bio}
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h2 className="font-display text-xl font-semibold text-[#e8e8e8] mb-4">Weekly Schedule</h2>
              <div className="flex flex-wrap gap-2">
                {session.schedule?.map((s, i) => (
                  <div key={i} className="card px-4 py-2.5 text-sm">
                    <span className="font-medium text-[#e8e8e8]">{s.day}</span>
                    <span className="ml-2" style={{ color: 'var(--muted)' }}>at {s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking sidebar */}
          <div>
            <div className="sticky top-24 card p-6">
              <div className="text-center mb-5">
                <p className="font-bold text-3xl" style={{ color: 'var(--gold)' }}>
                  ₹{session.price?.toLocaleString('en-IN')}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>per session</p>
              </div>

              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#e8e8e8]">
                  Available Slots
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-hide">
                  {session.availability?.length > 0 ? session.availability.map((slot, i) => (
                    <button key={i} onClick={() => setSelectedSlot(slot)} disabled={slot.isFull}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl border transition-all text-sm"
                      style={{
                        borderColor: selectedSlot?.date === slot.date ? 'var(--gold)' : slot.isFull ? 'var(--border)' : 'var(--border2)',
                        background: selectedSlot?.date === slot.date ? 'rgba(201,168,76,0.08)' : 'var(--surface2)',
                        opacity: slot.isFull ? 0.5 : 1,
                        cursor: slot.isFull ? 'not-allowed' : 'pointer'
                      }}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-[#e8e8e8]">{formatDate(slot.date)}</span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{slot.time}</span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: slot.isFull ? '#f87171' : 'var(--gold)' }}>
                        {slot.isFull ? '⛔ Fully Booked' : `${slot.spotsLeft} spot${slot.spotsLeft !== 1 ? 's' : ''} left`}
                      </div>
                    </button>
                  )) : (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>No upcoming slots.</p>
                  )}
                </div>
              </div>

              {isAuthenticated ? (
                <Link to={`/book/${session._id}`} state={{ slot: selectedSlot, session }}
                  className={`btn-gold w-full justify-center py-3.5 gap-2 ${!selectedSlot || selectedSlot.isFull ? 'opacity-40 pointer-events-none' : ''}`}>
                  Book This Session <ChevronRight size={15} />
                </Link>
              ) : (
                <Link to="/login" state={{ from: { pathname: `/book/${session._id}` } }}
                  className="btn-gold w-full justify-center py-3.5 gap-2">
                  Sign In to Book <ChevronRight size={15} />
                </Link>
              )}

              <p className="text-xs text-center mt-3" style={{ color: 'var(--faint)' }}>
                {session.cancellationPolicy}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
