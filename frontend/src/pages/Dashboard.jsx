// ── Dashboard.jsx ────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CalendarDays, CheckCircle2, XCircle, ArrowRight, Clock } from 'lucide-react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
  const { user } = useAuth()
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/bookings/my?status=confirmed').then(r => setUpcoming(r.data.bookings.slice(0,3))).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const stats = [
    { label:'Total Bookings',  value: user?.stats?.totalBookings     || 0, icon:CalendarDays,  bg:'#EAF4E0', color:'var(--primary)' },
    { label:'Completed',       value: user?.stats?.completedSessions || 0, icon:CheckCircle2,  bg:'#EBF5FD', color:'#1A6AA0' },
    { label:'Cancelled',       value: user?.stats?.cancelledBookings || 0, icon:XCircle,       bg:'#FDEEE8', color:'#8C3418' },
  ]

  return (
    <div className="pt-20 pb-16" style={{background:'var(--bg)'}}>
      <div className="page-container max-w-5xl">
        <div className="py-6 mb-6">
          <p className="eyebrow mb-2">Overview</p>
          <h1 className="font-display text-3xl font-semibold" style={{color:'var(--text)'}}>
            Welcome back, {user?.firstName}! 🌿
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(({label,value,icon:Icon,bg,color}) => (
            <div key={label} className="card p-5 shadow-card">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:bg}}>
                <Icon size={18} style={{color}} />
              </div>
              <p className="font-display text-2xl font-bold" style={{color:'var(--text)'}}>{value}</p>
              <p className="text-xs mt-0.5 font-medium" style={{color:'var(--muted)'}}>{label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming sessions */}
          <div className="card p-6 shadow-card">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold" style={{color:'var(--text)'}}>Upcoming Sessions</h2>
              <Link to="/my-bookings" className="text-xs font-semibold hover:underline" style={{color:'var(--primary)'}}>
                View all →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2].map(i=><div key={i} className="skeleton h-14"/>)}</div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm mb-3" style={{color:'var(--muted)'}}>No upcoming sessions booked.</p>
                <Link to="/sessions" className="btn-primary text-xs py-2 px-4">Browse Sessions</Link>
              </div>
            ) : upcoming.map(b => (
              <div key={b._id} className="flex items-center gap-3 py-3 border-b last:border-0"
                style={{borderColor:'var(--border)'}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{background:'#EAF4E0'}}>🧘</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{color:'var(--text)'}}>{b.session?.title}</p>
                  <p className="text-xs flex items-center gap-1" style={{color:'var(--muted)'}}>
                    <Clock size={10} style={{color:'var(--primary)'}}/>
                    {new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})} at {b.sessionTime}
                  </p>
                </div>
                <Link to={`/my-bookings/${b._id}`} style={{color:'var(--primary)'}}>
                  <ArrowRight size={15}/>
                </Link>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="card p-6 shadow-card">
            <h2 className="font-semibold mb-5" style={{color:'var(--text)'}}>Quick Actions</h2>
            <div className="space-y-2">
              {[
                {to:'/sessions',    label:'Browse & Book Sessions', sub:'Find your next class'},
                {to:'/my-bookings', label:'My Bookings',            sub:'Manage all bookings'},
                {to:'/profile',     label:'Profile Settings',       sub:'Update your details'},
              ].map(({to,label,sub}) => (
                <Link key={to} to={to}
                  className="flex items-center justify-between p-3 rounded-xl transition-all group hover:bg-[#EAF4E0]">
                  <div>
                    <p className="text-sm font-medium" style={{color:'var(--text)'}}>{label}</p>
                    <p className="text-xs" style={{color:'var(--muted)'}}>{sub}</p>
                  </div>
                  <ArrowRight size={14} style={{color:'var(--primary)'}}/>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
