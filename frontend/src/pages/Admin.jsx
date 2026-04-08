import { useState, useEffect } from 'react'
import { Users, CalendarDays, BookOpen, TrendingUp, CheckSquare, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'users',    label: 'Users' },
]

const statusStyle = {
  confirmed: { bg: 'rgba(74,222,128,0.1)',  color: '#4ade80' },
  cancelled: { bg: 'rgba(248,113,113,0.1)', color: '#f87171' },
  completed: { bg: 'rgba(147,197,253,0.1)', color: '#93c5fd' },
  pending:   { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24' },
}

export default function Admin() {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'overview') { const { data } = await api.get('/admin/stats'); setStats(data.stats) }
      else if (tab === 'bookings') { const { data } = await api.get('/admin/bookings?limit=30'); setBookings(data.bookings) }
      else if (tab === 'users') { const { data } = await api.get('/admin/users?limit=30'); setUsers(data.users) }
    } catch { toast.error('Failed to load data.') }
    finally { setLoading(false) }
  }

  const checkIn = async (id) => {
    try {
      await api.patch(`/admin/bookings/${id}/checkin`)
      toast.success('Checked in!')
      loadData()
    } catch (err) { toast.error(err.response?.data?.message || 'Check-in failed.') }
  }

  return (
    <div className="pt-24 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="page-container max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="section-eyebrow mb-2">Admin</p>
            <h1 className="font-display text-3xl font-semibold text-[#e8e8e8]">Control Panel</h1>
          </div>
          <button onClick={loadData} className="btn-outline gap-2 text-sm py-2">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit mb-8" style={{ background: 'var(--surface)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t.key ? 'var(--surface2)' : 'transparent',
                color: tab === t.key ? 'var(--gold)' : 'var(--muted)',
                border: tab === t.key ? '1px solid var(--border2)' : '1px solid transparent'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && stats && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users',    value: stats.totalUsers,    icon: Users,       color: 'rgba(147,197,253,0.1)', text: '#93c5fd' },
                    { label: 'Sessions',       value: stats.totalSessions, icon: CalendarDays, color: 'rgba(201,168,76,0.1)', text: 'var(--gold)' },
                    { label: 'Bookings',       value: stats.totalBookings, icon: BookOpen,    color: 'rgba(74,222,128,0.1)',  text: '#4ade80' },
                    { label: 'Revenue',        value: `₹${(stats.totalRevenue||0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'rgba(201,168,76,0.12)', text: 'var(--gold)' },
                  ].map(({ label, value, icon: Icon, color, text }) => (
                    <div key={label} className="card p-5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color }}>
                        <Icon size={17} style={{ color: text }} />
                      </div>
                      <p className="font-display text-2xl font-bold text-[#e8e8e8]">{value}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {stats.popularSessions?.length > 0 && (
                  <div className="card p-6">
                    <h2 className="font-semibold text-[#e8e8e8] mb-4">Most Booked Sessions</h2>
                    <div className="space-y-3">
                      {stats.popularSessions.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0"
                          style={{ borderColor: 'var(--border)' }}>
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                              style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold)' }}>{i + 1}</span>
                            <div>
                              <p className="text-sm font-medium text-[#e8e8e8]">{item.session?.title}</p>
                              <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.session?.type}</p>
                            </div>
                          </div>
                          <span className="badge" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold)' }}>
                            {item.count} bookings
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card overflow-hidden">
                  <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h2 className="font-semibold text-[#e8e8e8]">Recent Bookings</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead style={{ background: 'var(--surface2)' }}>
                        <tr>{['Reference','User','Session','Date','Status','Amount'].map(h => (
                          <th key={h} className="text-left p-4 text-xs font-medium uppercase tracking-wider"
                            style={{ color: 'var(--muted)' }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {stats.recentBookings?.map(b => {
                          const st = statusStyle[b.status] || statusStyle.pending
                          return (
                            <tr key={b._id} className="border-t transition-colors"
                              style={{ borderColor: 'var(--border)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <td className="p-4 font-mono text-xs" style={{ color: 'var(--gold)' }}>{b.bookingReference}</td>
                              <td className="p-4 text-[#e8e8e8]">{b.user?.firstName} {b.user?.lastName}</td>
                              <td className="p-4 max-w-32 truncate" style={{ color: 'var(--muted)' }}>{b.session?.title}</td>
                              <td className="p-4 text-xs" style={{ color: 'var(--muted)' }}>
                                {new Date(b.sessionDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </td>
                              <td className="p-4"><span className="badge text-xs" style={{ background: st.bg, color: st.color }}>{b.status}</span></td>
                              <td className="p-4 font-medium" style={{ color: 'var(--gold)' }}>₹{b.payment?.amount?.toLocaleString('en-IN')}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings */}
            {tab === 'bookings' && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h2 className="font-semibold text-[#e8e8e8]">All Bookings ({bookings.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ background: 'var(--surface2)' }}>
                      <tr>{['Reference','Student','Session','Date','Status','Amount','Action'].map(h => (
                        <th key={h} className="text-left p-4 text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'var(--muted)' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => {
                        const st = statusStyle[b.status] || statusStyle.pending
                        return (
                          <tr key={b._id} className="border-t" style={{ borderColor: 'var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td className="p-4 font-mono text-xs" style={{ color: 'var(--gold)' }}>{b.bookingReference}</td>
                            <td className="p-4">
                              <p className="font-medium text-[#e8e8e8]">{b.user?.firstName} {b.user?.lastName}</p>
                              <p className="text-xs" style={{ color: 'var(--muted)' }}>{b.user?.email}</p>
                            </td>
                            <td className="p-4 max-w-36">
                              <p className="text-[#e8e8e8] truncate">{b.session?.title}</p>
                              <p className="text-xs" style={{ color: 'var(--muted)' }}>{b.session?.type}</p>
                            </td>
                            <td className="p-4 text-xs" style={{ color: 'var(--muted)' }}>
                              {new Date(b.sessionDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}<br/>{b.sessionTime}
                            </td>
                            <td className="p-4">
                              <span className="badge text-xs" style={{ background: st.bg, color: st.color }}>{b.status}</span>
                              {b.checkedIn && <span className="badge text-xs ml-1" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>✓ In</span>}
                            </td>
                            <td className="p-4 font-bold" style={{ color: 'var(--gold)' }}>₹{b.payment?.amount?.toLocaleString('en-IN')}</td>
                            <td className="p-4">
                              {b.status === 'confirmed' && !b.checkedIn && (
                                <button onClick={() => checkIn(b._id)}
                                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                                  style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80' }}>
                                  <CheckSquare size={11} /> Check In
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users */}
            {tab === 'users' && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h2 className="font-semibold text-[#e8e8e8]">All Users ({users.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ background: 'var(--surface2)' }}>
                      <tr>{['User','Email','Phone','Role','Bookings','Joined'].map(h => (
                        <th key={h} className="text-left p-4 text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'var(--muted)' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} className="border-t" style={{ borderColor: 'var(--border)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                                style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold)' }}>
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </div>
                              <span className="font-medium text-[#e8e8e8]">{u.firstName} {u.lastName}</span>
                            </div>
                          </td>
                          <td className="p-4" style={{ color: 'var(--muted)' }}>{u.email}</td>
                          <td className="p-4" style={{ color: 'var(--muted)' }}>{u.phone || '—'}</td>
                          <td className="p-4">
                            <span className="badge text-xs capitalize"
                              style={{
                                background: u.role === 'admin' ? 'rgba(167,139,250,0.1)' : 'rgba(201,168,76,0.1)',
                                color: u.role === 'admin' ? '#a78bfa' : 'var(--gold)'
                              }}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-center font-medium text-[#e8e8e8]">{u.stats?.totalBookings || 0}</td>
                          <td className="p-4 text-xs" style={{ color: 'var(--muted)' }}>
                            {new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
