// ── Admin.jsx ────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Users, CalendarDays, BookOpen, TrendingUp, CheckSquare, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const ST = {
  confirmed:{bg:'#EAF4E0',color:'#1A5C1E'},
  cancelled:{bg:'#FDEEE8',color:'#8C3418'},
  completed:{bg:'#EBF5FD',color:'#1A4C8A'},
  pending:  {bg:'#FEF3E0',color:'#7A4A10'},
}
const TABS = [{key:'overview',label:'Overview'},{key:'bookings',label:'Bookings'},{key:'users',label:'Users'}]

export default function Admin() {
  const [tab, setTab]         = useState('overview')
  const [stats, setStats]     = useState(null)
  const [bookings, setBookings]= useState([])
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ load() },[tab])

  const load = async () => {
    setLoading(true)
    try {
      if (tab==='overview') { const {data}=await api.get('/admin/stats'); setStats(data.stats) }
      else if (tab==='bookings') { const {data}=await api.get('/admin/bookings?limit=30'); setBookings(data.bookings) }
      else if (tab==='users') { const {data}=await api.get('/admin/users?limit=30'); setUsers(data.users) }
    } catch { toast.error('Failed to load.') }
    finally { setLoading(false) }
  }

  const checkIn = async (id) => {
    try { await api.patch(`/admin/bookings/${id}/checkin`); toast.success('Checked in!'); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }

  return (
    <div className="pt-20 pb-16" style={{background:'var(--bg)'}}>
      <div className="page-container max-w-6xl">
        <div className="py-6 mb-6 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-2">Management</p>
            <h1 className="font-display text-3xl font-semibold" style={{color:'var(--text)'}}>Admin Panel</h1>
          </div>
          <button onClick={load} className="btn-outline gap-2 text-sm py-2.5">
            <RefreshCw size={13}/> Refresh
          </button>
        </div>

        <div className="flex gap-1 p-1 rounded-2xl w-fit mb-8" style={{background:'var(--surface2)',border:'1.5px solid var(--border)'}}>
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab===t.key?'var(--surface)':'transparent',
                color:      tab===t.key?'var(--primary)':'var(--muted)',
                boxShadow:  tab===t.key?'0 1px 4px rgba(0,0,0,0.08)':'none',
              }}>{t.label}</button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-20"><LoadingSpinner size="lg"/></div> : <>

          {/* Overview */}
          {tab==='overview' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {label:'Total Users',   value:stats.totalUsers,    icon:Users,       bg:'#EBF5FD',color:'#1A4C8A'},
                  {label:'Sessions',      value:stats.totalSessions, icon:CalendarDays,bg:'#EAF4E0',color:'var(--primary)'},
                  {label:'Bookings',      value:stats.totalBookings, icon:BookOpen,    bg:'#FEF3E0',color:'#7A4A10'},
                  {label:'Revenue',       value:`₹${(stats.totalRevenue||0).toLocaleString('en-IN')}`, icon:TrendingUp, bg:'#EAF4E0',color:'var(--primary)'},
                ].map(({label,value,icon:Icon,bg,color})=>(
                  <div key={label} className="card p-5 shadow-card">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:bg}}>
                      <Icon size={18} style={{color}}/>
                    </div>
                    <p className="font-display text-2xl font-bold" style={{color:'var(--text)'}}>{value}</p>
                    <p className="text-xs font-medium mt-0.5" style={{color:'var(--muted)'}}>{label}</p>
                  </div>
                ))}
              </div>

              <div className="card shadow-card overflow-hidden">
                <div className="p-5 border-b" style={{borderColor:'var(--border)'}}>
                  <h2 className="font-semibold" style={{color:'var(--text)'}}>Recent Bookings</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{background:'var(--surface2)'}}>
                      <tr>{['Reference','User','Session','Date','Status','Amount'].map(h=>(
                        <th key={h} className="text-left p-4 text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {stats.recentBookings?.map(b=>{
                        const st=ST[b.status]||ST.pending
                        return (
                          <tr key={b._id} className="border-t hover:bg-[#F5F8F0] transition-colors" style={{borderColor:'var(--border)'}}>
                            <td className="p-4 font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{b.bookingReference}</td>
                            <td className="p-4 font-medium" style={{color:'var(--text)'}}>{b.user?.firstName} {b.user?.lastName}</td>
                            <td className="p-4 max-w-32 truncate" style={{color:'var(--muted)'}}>{b.session?.title}</td>
                            <td className="p-4 text-xs" style={{color:'var(--muted)'}}>
                              {new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}
                            </td>
                            <td className="p-4"><span className="badge text-xs" style={{background:st.bg,color:st.color}}>{b.status}</span></td>
                            <td className="p-4 font-bold" style={{color:'var(--primary)'}}>₹{b.payment?.amount?.toLocaleString('en-IN')}</td>
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
          {tab==='bookings' && (
            <div className="card shadow-card overflow-hidden">
              <div className="p-5 border-b" style={{borderColor:'var(--border)'}}>
                <h2 className="font-semibold" style={{color:'var(--text)'}}>All Bookings ({bookings.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{background:'var(--surface2)'}}>
                    <tr>{['Ref','Student','Session','Date & Time','Status','Amount','Action'].map(h=>(
                      <th key={h} className="text-left p-4 text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {bookings.map(b=>{
                      const st=ST[b.status]||ST.pending
                      return (
                        <tr key={b._id} className="border-t hover:bg-[#F5F8F0] transition-colors" style={{borderColor:'var(--border)'}}>
                          <td className="p-4 font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{b.bookingReference}</td>
                          <td className="p-4">
                            <p className="font-medium" style={{color:'var(--text)'}}>{b.user?.firstName} {b.user?.lastName}</p>
                            <p className="text-xs" style={{color:'var(--muted)'}}>{b.user?.email}</p>
                          </td>
                          <td className="p-4 max-w-36">
                            <p className="truncate" style={{color:'var(--text)'}}>{b.session?.title}</p>
                            <p className="text-xs" style={{color:'var(--muted)'}}>{b.session?.type}</p>
                          </td>
                          <td className="p-4 text-xs" style={{color:'var(--muted)'}}>
                            <p>{new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}</p>
                            <p>{b.sessionTime}</p>
                          </td>
                          <td className="p-4"><span className="badge text-xs" style={{background:st.bg,color:st.color}}>{b.status}</span></td>
                          <td className="p-4 font-bold" style={{color:'var(--primary)'}}>₹{b.payment?.amount?.toLocaleString('en-IN')}</td>
                          <td className="p-4">
                            {b.status==='confirmed' && !b.checkedIn && (
                              <button onClick={()=>checkIn(b._id)}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                                style={{background:'#EAF4E0',color:'var(--primary)',border:'1px solid #B5D98A'}}>
                                <CheckSquare size={11}/> Check In
                              </button>
                            )}
                            {b.checkedIn && <span className="badge badge-green text-xs">✓ In</span>}
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
          {tab==='users' && (
            <div className="card shadow-card overflow-hidden">
              <div className="p-5 border-b" style={{borderColor:'var(--border)'}}>
                <h2 className="font-semibold" style={{color:'var(--text)'}}>All Users ({users.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{background:'var(--surface2)'}}>
                    <tr>{['User','Email','Phone','Role','Bookings','Joined'].map(h=>(
                      <th key={h} className="text-left p-4 text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-t hover:bg-[#F5F8F0] transition-colors" style={{borderColor:'var(--border)'}}>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{background:'#EAF4E0',color:'var(--primary)'}}>
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <span className="font-medium" style={{color:'var(--text)'}}>{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td className="p-4" style={{color:'var(--muted)'}}>{u.email}</td>
                        <td className="p-4" style={{color:'var(--muted)'}}>{u.phone||'—'}</td>
                        <td className="p-4">
                          <span className={`badge text-xs capitalize ${u.role==='admin'?'badge-terra':'badge-green'}`}>{u.role}</span>
                        </td>
                        <td className="p-4 text-center font-bold" style={{color:'var(--primary)'}}>{u.stats?.totalBookings||0}</td>
                        <td className="p-4 text-xs" style={{color:'var(--muted)'}}>
                          {new Date(u.createdAt).toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>}
      </div>
    </div>
  )
}
