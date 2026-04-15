import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Clock, Users, Star, ChevronRight, Calendar, MapPin, ChevronLeft, GraduationCap } from 'lucide-react'
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
  const [session,  setSession]  = useState(null)
  const [reviews,  setReviews]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selectedSlot, setSel]  = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/sessions/${id}`),
      api.get(`/sessions/${id}/reviews`).catch(() => ({ data: { reviews: [] } })),
    ]).then(([sessionRes, reviewRes]) => {
      setSession(sessionRes.data.session)
      setSel(sessionRes.data.session.availability?.[0] || null)
      setReviews(reviewRes.data.reviews || [])
    }).catch(() => navigate('/sessions'))
    .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner fullPage />
  if (!session) return null

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})
  const avgRating = reviews.length ? (reviews.reduce((s,r)=>s+r.feedback.rating,0)/reviews.length).toFixed(1) : null

  return (
    <div className="pt-20 pb-16" style={{ background:'var(--bg)' }}>
      <div className="page-container">
        <Link to="/sessions" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 mt-4 hover:underline"
          style={{ color:'var(--muted)' }}>
          <ChevronLeft size={15}/> Back to Sessions
        </Link>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main */}
          <div className="lg:col-span-2">
            {/* Hero */}
            <div className="relative h-72 md:h-[400px] rounded-2xl overflow-hidden mb-8"
              style={{ background:'var(--surface2)' }}>
              {session.image && (
                <img src={session.image} alt={session.title} className="w-full h-full object-cover"/>
              )}
              <div className="absolute inset-0"
                style={{ background:'linear-gradient(180deg,transparent 45%,rgba(0,0,0,0.55) 100%)' }}/>
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`badge ${lvlBadge[session.level]||'badge-gray'}`}>{session.level}</span>
                <span className="badge badge-green">{session.type}</span>
              </div>
              <div className="absolute bottom-5 left-6 right-6">
                <h1 className="font-display text-3xl md:text-4xl font-semibold text-white">{session.title}</h1>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-5 text-sm mb-8 pb-6"
              style={{ borderBottom:'1.5px solid var(--border)', color:'var(--muted)' }}>
              <span className="flex items-center gap-1.5">
                <Clock size={15} style={{ color:'var(--primary)' }}/>{session.duration} minutes
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={15} style={{ color:'var(--primary)' }}/>Up to {session.maxCapacity} students
              </span>
              {avgRating && (
                <span className="flex items-center gap-1.5">
                  <Star size={15} style={{ fill:'#F59E0B',color:'#F59E0B' }}/>
                  {avgRating} ({reviews.length} review{reviews.length!==1?'s':''})
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin size={15} style={{ color:'var(--primary)' }}/>
                {session.location?.address||'45 Green Park, Rajpur Road, Dehradun'}
              </span>
            </div>

            {/* About */}
            <div className="mb-8">
              <h2 className="font-display text-xl font-semibold mb-3" style={{ color:'var(--text)' }}>About This Session</h2>
              <p className="text-sm leading-relaxed" style={{ color:'var(--muted)' }}>{session.description}</p>
            </div>

            {/* Instructor */}
            <div className="card p-5 mb-8 shadow-card">
              <h2 className="font-display text-lg font-semibold mb-4" style={{ color:'var(--text)' }}>Your Instructor</h2>
              <div className="flex items-start gap-4">
                {session.instructor?.avatar ? (
                  <img src={session.instructor.avatar} alt={session.instructor.name}
                    className="w-14 h-14 rounded-full object-cover border-2" style={{ borderColor:'#B5D98A' }}/>
                ) : (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ background:'#EAF4E0', color:'var(--primary)', border:'2px solid #B5D98A', fontFamily:'Georgia,serif' }}>
                    {session.instructor?.name?.[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold" style={{ color:'var(--text)' }}>{session.instructor?.name}</p>
                  {session.instructor?.bio && (
                    <p className="text-sm mt-1 leading-relaxed" style={{ color:'var(--muted)' }}>{session.instructor.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="mb-8">
              <h2 className="font-display text-xl font-semibold mb-4" style={{ color:'var(--text)' }}>Weekly Schedule</h2>
              <div className="flex flex-wrap gap-2">
                {session.schedule?.map((s,i)=>(
                  <div key={i} className="card px-4 py-2.5 text-sm shadow-card">
                    <span className="font-semibold" style={{ color:'var(--text)' }}>{s.day}</span>
                    <span className="ml-2" style={{ color:'var(--muted)' }}>at {s.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Reviews section ────────────────────────────────────────────── */}
            {reviews.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl font-semibold" style={{ color:'var(--text)' }}>
                    Student Reviews
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={16}
                          style={{ fill:n<=Math.round(avgRating)?'#F59E0B':'transparent', color:'#F59E0B' }}/>
                      ))}
                    </div>
                    <span className="font-bold text-lg" style={{ color:'var(--text)' }}>{avgRating}</span>
                    <span className="text-sm" style={{ color:'var(--muted)' }}>({reviews.length})</span>
                  </div>
                </div>

                {/* Rating breakdown */}
                <div className="card p-5 shadow-card mb-5">
                  {[5,4,3,2,1].map(n => {
                    const count = reviews.filter(r=>r.feedback.rating===n).length
                    const pct   = reviews.length ? Math.round((count/reviews.length)*100) : 0
                    return (
                      <div key={n} className="flex items-center gap-3 mb-2">
                        <span className="text-xs w-4 text-right" style={{ color:'var(--muted)' }}>{n}</span>
                        <Star size={11} style={{ fill:'#F59E0B',color:'#F59E0B',flexShrink:0 }}/>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:'var(--border)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width:`${pct}%`, background:'#F59E0B' }}/>
                        </div>
                        <span className="text-xs w-8" style={{ color:'var(--muted)' }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-4">
                  {reviews.slice(0, 6).map((r, i) => (
                    <div key={i} className="card p-5 shadow-card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background:'#EAF4E0', color:'var(--primary)' }}>
                            {r.user?.firstName?.[0]}{r.user?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color:'var(--text)' }}>
                              {r.user?.firstName} {r.user?.lastName}
                            </p>
                            <p className="text-xs" style={{ color:'var(--faint)' }}>
                              {new Date(r.feedback.submittedAt).toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}
                            </p>
                          </div>
                        </div>
                        <div className="flex">
                          {[1,2,3,4,5].map(n=>(
                            <Star key={n} size={13}
                              style={{ fill:n<=r.feedback.rating?'#F59E0B':'transparent',color:'#F59E0B' }}/>
                          ))}
                        </div>
                      </div>
                      {r.feedback.comment && (
                        <p className="text-sm leading-relaxed italic" style={{ color:'var(--muted)' }}>
                          "{r.feedback.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky sidebar */}
          <div>
            <div className="sticky top-24 card p-6 shadow-card-hover">
              <div className="text-center mb-6 pb-5" style={{ borderBottom:'1.5px solid var(--border)' }}>
                <p className="font-display text-4xl font-semibold" style={{ color:'var(--primary)' }}>
                  ₹{session.price?.toLocaleString('en-IN')}
                </p>
                <p className="text-xs font-medium mt-1" style={{ color:'var(--faint)' }}>per session</p>
              </div>

              {/* Slots */}
              <div className="mb-5">
                <p className="label mb-3">Available Slots</p>
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                  {session.availability?.length > 0 ? session.availability.map((slot,i)=>(
                    <button key={i} onClick={()=>setSel(slot)} disabled={slot.isFull}
                      className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm"
                      style={{
                        borderColor: selectedSlot?.date===slot.date ? 'var(--primary)' : slot.isFull ? 'var(--border)' : 'var(--border2)',
                        background:  selectedSlot?.date===slot.date ? '#EAF4E0' : 'var(--surface)',
                        opacity:     slot.isFull ? 0.5 : 1,
                        cursor:      slot.isFull ? 'not-allowed' : 'pointer',
                      }}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold" style={{ color:'var(--text)' }}>{fmtDate(slot.date)}</span>
                        <span className="text-xs font-medium" style={{ color:'var(--muted)' }}>{slot.time}</span>
                      </div>
                      <p className="text-xs mt-0.5 font-medium"
                        style={{ color:slot.isFull?'var(--terra)':'var(--primary)' }}>
                        {slot.isFull ? '⛔ Fully Booked' : `${slot.spotsLeft} spot${slot.spotsLeft!==1?'s':''} left`}
                      </p>
                    </button>
                  )) : (
                    <p className="text-sm text-center py-4" style={{ color:'var(--muted)' }}>No upcoming slots.</p>
                  )}
                </div>
              </div>

              {isAuthenticated ? (
                <Link to={`/book/${session._id}`} state={{ slot:selectedSlot, session }}
                  className={`btn-primary w-full justify-center py-3.5 gap-2 ${!selectedSlot||selectedSlot.isFull?'opacity-50 pointer-events-none':''}`}>
                  Book This Session <ChevronRight size={15}/>
                </Link>
              ) : (
                <Link to="/login" state={{ from:{ pathname:`/book/${session._id}` } }}
                  className="btn-primary w-full justify-center py-3.5 gap-2">
                  Sign In to Book <ChevronRight size={15}/>
                </Link>
              )}

              <p className="text-xs text-center mt-3" style={{ color:'var(--faint)' }}>
                {session.cancellationPolicy||'Free cancellation up to 2 hours before.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
