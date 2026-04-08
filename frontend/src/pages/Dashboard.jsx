// ─────────────────────────────────────────────
// Dashboard.jsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CalendarDays, CheckCircle2, XCircle, ArrowRight, Clock } from 'lucide-react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export function Dashboard() {
  const { user } = useAuth()
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/bookings/my?status=confirmed').then(r => setUpcoming(r.data.bookings.slice(0, 3))).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total Bookings',  value: user?.stats?.totalBookings      || 0, icon: CalendarDays,  color: 'rgba(201,168,76,0.1)',  text: 'var(--gold)' },
    { label: 'Sessions Done',   value: user?.stats?.completedSessions  || 0, icon: CheckCircle2,  color: 'rgba(74,222,128,0.1)',  text: '#4ade80' },
    { label: 'Cancelled',       value: user?.stats?.cancelledBookings  || 0, icon: XCircle,       color: 'rgba(248,113,113,0.1)', text: '#f87171' },
  ]

  return (
    <div className="pt-24 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="page-container max-w-5xl">
        <div className="mb-8">
          <p className="section-eyebrow mb-2">Overview</p>
          <h1 className="font-display text-3xl font-semibold text-[#e8e8e8]">
            Welcome back, {user?.firstName}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, text }) => (
            <div key={label} className="card p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: color }}>
                <Icon size={17} style={{ color: text }} />
              </div>
              <p className="font-display text-2xl font-bold text-[#e8e8e8]">{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold text-[#e8e8e8]">Upcoming Sessions</h2>
              <Link to="/my-bookings" className="text-xs font-medium transition-colors"
                style={{ color: 'var(--gold)' }}>View all →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton h-14" />)}</div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>No upcoming sessions booked.</p>
                <Link to="/sessions" className="btn-gold text-xs py-2">Browse Sessions</Link>
              </div>
            ) : upcoming.map(b => (
              <div key={b._id} className="flex items-center gap-3 py-3 border-b last:border-0"
                style={{ borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: 'rgba(201,168,76,0.08)' }}>🧘</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e8e8e8] truncate">{b.session?.title}</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                    <Clock size={10} />
                    {new Date(b.sessionDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} at {b.sessionTime}
                  </p>
                </div>
                <Link to={`/my-bookings/${b._id}`} style={{ color: 'var(--gold)' }}>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-[#e8e8e8] mb-5">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { to: '/sessions',    label: 'Browse & Book Sessions', sub: 'Find your next class' },
                { to: '/my-bookings', label: 'My Bookings',            sub: 'Manage all bookings' },
                { to: '/profile',     label: 'Profile Settings',       sub: 'Update your details' },
              ].map(({ to, label, sub }) => (
                <Link key={to} to={to} className="flex items-center justify-between p-3 rounded-xl transition-all group"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <p className="text-sm font-medium text-[#e8e8e8]">{label}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</p>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--gold)' }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
