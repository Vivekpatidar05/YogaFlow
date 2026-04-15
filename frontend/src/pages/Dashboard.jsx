import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CalendarDays, CheckCircle2, XCircle, ArrowRight, Clock, Flame, Trophy, Star, TrendingUp } from 'lucide-react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const MILESTONES = [
  { count: 1,   icon:'🎯', label:'First Step',       desc:'Completed your first session' },
  { count: 5,   icon:'🌱', label:'Budding Yogi',     desc:'5 sessions completed' },
  { count: 10,  icon:'🧘', label:'Regular Practitioner', desc:'10 sessions completed' },
  { count: 25,  icon:'⭐', label:'Dedicated Yogi',   desc:'25 sessions completed' },
  { count: 50,  icon:'🏆', label:'Yoga Champion',    desc:'50 sessions completed' },
  { count: 100, icon:'💎', label:'Yoga Master',      desc:'100 sessions completed' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [upcoming, setUpcoming] = useState([])
  const [recent,   setRecent]   = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/bookings/my?status=confirmed&limit=3'),
      api.get('/bookings/my?status=completed&limit=5'),
    ]).then(([upRes, recRes]) => {
      setUpcoming(upRes.data.bookings || [])
      setRecent(recRes.data.bookings || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalSessions  = user?.stats?.completedSessions || 0
  const nextMilestone  = MILESTONES.find(m => m.count > totalSessions) || MILESTONES[MILESTONES.length - 1]
  const prevMilestone  = MILESTONES.filter(m => m.count <= totalSessions).pop() || null
  const milestonesPct  = prevMilestone
    ? Math.round(((totalSessions - prevMilestone.count) / (nextMilestone.count - prevMilestone.count)) * 100)
    : Math.round((totalSessions / nextMilestone.count) * 100)
  const earnedMilestones = MILESTONES.filter(m => m.count <= totalSessions)

  const stats = [
    { label:'Total Bookings',  value:user?.stats?.totalBookings||0,      icon:CalendarDays, bg:'#EAF4E0', color:'var(--primary)' },
    { label:'Completed',       value:user?.stats?.completedSessions||0,  icon:CheckCircle2, bg:'#EBF5FD', color:'#1A4C8A' },
    { label:'Cancelled',       value:user?.stats?.cancelledBookings||0,  icon:XCircle,      bg:'#FDEEE8', color:'var(--terra)' },
  ]

  return (
    <div className="pt-20 pb-16" style={{ background:'var(--bg)' }}>
      <div className="page-container max-w-5xl">
        <div className="py-6 mb-6">
          <p className="eyebrow mb-2">Overview</p>
          <h1 className="font-display text-3xl font-semibold" style={{ color:'var(--text)' }}>
            Welcome back, {user?.firstName}! 🌿
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map(({ label, value, icon:Icon, bg, color }) => (
            <div key={label} className="card p-5 shadow-card">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background:bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className="font-display text-2xl font-bold" style={{ color:'var(--text)' }}>{value}</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color:'var(--muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Progress to next milestone */}
        <div className="card p-6 mb-6 shadow-card" style={{ background:'linear-gradient(135deg,#EAF4E0 0%,#F0F7EC 100%)', border:'1.5px solid #B5D98A' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} style={{ color:'var(--primary)' }}/>
              <h3 className="font-semibold" style={{ color:'var(--primary)' }}>Your Progress</h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background:'rgba(44,95,46,0.12)', color:'var(--primary)' }}>
              <Flame size={12}/> {totalSessions} sessions
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{prevMilestone?.icon || '🌱'}</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1" style={{ color:'#3A6A1E' }}>
                <span>{prevMilestone?.label || 'Start'}</span>
                <span>{nextMilestone.icon} {nextMilestone.label}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background:'rgba(44,95,46,0.15)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width:`${Math.min(milestonesPct,100)}%`, background:'var(--primary)' }}/>
              </div>
              <p className="text-xs mt-1" style={{ color:'#3A6A1E' }}>
                {totalSessions} / {nextMilestone.count} sessions · {nextMilestone.count - totalSessions} to go
              </p>
            </div>
          </div>

          {/* Earned badges */}
          {earnedMilestones.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {earnedMilestones.map(m => (
                <div key={m.count} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background:'rgba(44,95,46,0.1)', color:'var(--primary)' }}>
                  <span>{m.icon}</span>{m.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming sessions */}
          <div className="card p-6 shadow-card">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold" style={{ color:'var(--text)' }}>Upcoming Sessions</h2>
              <Link to="/my-bookings" className="text-xs font-semibold hover:underline" style={{ color:'var(--primary)' }}>
                View all →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2].map(i=><div key={i} className="skeleton h-14"/>)}</div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm mb-3" style={{ color:'var(--muted)' }}>No upcoming sessions booked.</p>
                <Link to="/sessions" className="btn-primary text-xs py-2 px-4">Browse Sessions</Link>
              </div>
            ) : upcoming.map(b => (
              <Link key={b._id} to={`/my-bookings/${b._id}`}
                className="flex items-center gap-3 py-3 border-b last:border-0 group hover:bg-[#F5F8F0] -mx-2 px-2 rounded-xl transition-all"
                style={{ borderColor:'var(--border)', textDecoration:'none' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background:'#EAF4E0' }}>🧘</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color:'var(--text)' }}>{b.session?.title}</p>
                  <p className="text-xs flex items-center gap-1" style={{ color:'var(--muted)' }}>
                    <Clock size={10} style={{ color:'var(--primary)' }}/>
                    {new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})} at {b.sessionTime}
                  </p>
                </div>
                <ArrowRight size={14} style={{ color:'var(--primary)' }}/>
              </Link>
            ))}
          </div>

          {/* Quick actions + recent */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="card p-5 shadow-card">
              <h2 className="font-semibold mb-4" style={{ color:'var(--text)' }}>Quick Actions</h2>
              <div className="space-y-1">
                {[
                  { to:'/sessions',    label:'Browse & Book Sessions', sub:'Find your next class' },
                  { to:'/my-bookings', label:'My Bookings',            sub:'View booking history' },
                  { to:'/profile',     label:'Profile Settings',       sub:'Update your details' },
                ].map(({ to, label, sub }) => (
                  <Link key={to} to={to}
                    className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-[#EAF4E0] group">
                    <div>
                      <p className="text-sm font-medium" style={{ color:'var(--text)' }}>{label}</p>
                      <p className="text-xs" style={{ color:'var(--muted)' }}>{sub}</p>
                    </div>
                    <ArrowRight size={14} style={{ color:'var(--primary)' }}/>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            {recent.length > 0 && (
              <div className="card p-5 shadow-card">
                <h2 className="font-semibold mb-4" style={{ color:'var(--text)' }}>Recent Activity</h2>
                <div className="space-y-3">
                  {recent.slice(0,3).map(b => (
                    <div key={b._id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background:'#EBF5FD' }}>
                        <CheckCircle2 size={14} style={{ color:'#1A4C8A' }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color:'var(--text)' }}>{b.session?.title}</p>
                        <p className="text-xs" style={{ color:'var(--faint)' }}>
                          {new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}
                          {b.feedback?.rating && ` · ${b.feedback.rating}★`}
                        </p>
                      </div>
                      {!b.feedback?.rating && (
                        <Link to={`/my-bookings/${b._id}`}
                          className="text-xs font-semibold" style={{ color:'var(--terra)', whiteSpace:'nowrap' }}>
                          Rate
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* All milestones */}
        <div className="card p-6 mt-6 shadow-card">
          <h2 className="font-semibold mb-5 flex items-center gap-2" style={{ color:'var(--text)' }}>
            <Trophy size={18} style={{ color:'var(--primary)' }}/> Achievement Badges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {MILESTONES.map(m => {
              const earned = totalSessions >= m.count
              return (
                <div key={m.count}
                  className="text-center p-3 rounded-xl border transition-all"
                  style={{
                    background:   earned ? '#EAF4E0' : 'var(--surface2)',
                    borderColor:  earned ? '#B5D98A' : 'var(--border)',
                    opacity:      earned ? 1 : 0.5,
                  }}>
                  <div className="text-2xl mb-1" style={{ filter: earned ? 'none' : 'grayscale(1)' }}>{m.icon}</div>
                  <p className="text-xs font-bold leading-snug" style={{ color: earned ? 'var(--primary)' : 'var(--faint)' }}>
                    {m.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color:'var(--faint)' }}>{m.count} sessions</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
