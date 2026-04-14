import { useState, useEffect, useCallback } from 'react'
import {
  Users, CalendarDays, BookOpen, TrendingUp, CheckSquare,
  RefreshCw, Plus, Pencil, X, Save, ToggleLeft, ToggleRight,
  Search, Ban, ShieldCheck, BarChart3, AlertTriangle, GraduationCap, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import ImageUpload from '../components/ImageUpload'

const TABS = [
  { key:'overview',      label:'Overview',      icon:BarChart3 },
  { key:'bookings',      label:'Bookings',      icon:BookOpen },
  { key:'sessions',      label:'Sessions',      icon:CalendarDays },
  { key:'instructors',   label:'Instructors',   icon:GraduationCap },
  { key:'users',         label:'Users',         icon:Users },
]

const SC = {
  confirmed:{ bg:'#EAF4E0', color:'#1A5C1E' },
  cancelled:{ bg:'#FDEEE8', color:'#8C3418' },
  completed:{ bg:'#EBF5FD', color:'#1A4C8A' },
  pending:  { bg:'#FEF3E0', color:'#7A4A10' },
}

const SESSION_TYPES  = ['Hatha','Vinyasa','Yin','Kundalini','Ashtanga','Restorative','Prenatal','Power','Hot Yoga','Meditation']
const SESSION_LEVELS = ['Beginner','Intermediate','Advanced','All Levels']
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function Admin() {
  const [tab, setTab]             = useState('overview')
  const [stats, setStats]         = useState(null)
  const [bookings, setBookings]   = useState([])
  const [sessions, setSessions]   = useState([])
  const [users, setUsers]         = useState([])
  const [applications, setApps]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [bFilter, setBF]          = useState('all')
  const [appFilter, setAF]        = useState('pending')
  const [sessionModal, setSM]     = useState(null)
  const [confirmModal, setCM]     = useState(null)
  const [rejectModal, setRM]      = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'overview') {
        const { data } = await api.get('/admin/stats'); setStats(data.stats)
      } else if (tab === 'bookings') {
        const q = bFilter !== 'all' ? `&status=${bFilter}` : ''
        const { data } = await api.get(`/admin/bookings?limit=50${q}${search?`&search=${search}`:''}`)
        setBookings(data.bookings)
      } else if (tab === 'sessions') {
        const { data } = await api.get('/admin/sessions'); setSessions(data.sessions)
      } else if (tab === 'instructors') {
        const { data } = await api.get(`/admin/instructor-applications?status=${appFilter}`)
        setApps(data.applications)
      } else if (tab === 'users') {
        const { data } = await api.get(`/admin/users?limit=50${search?`&search=${search}`:''}`)
        setUsers(data.users)
      }
    } catch { toast.error('Failed to load.') }
    finally { setLoading(false) }
  }, [tab, bFilter, search, appFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setSearch('') }, [tab])

  const cancelBooking = async (id) => {
    try { await api.patch(`/admin/bookings/${id}/cancel`,{reason:'Cancelled by admin'}); toast.success('Booking cancelled.'); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
    finally { setCM(null) }
  }

  const checkIn = async (id) => {
    try { const{data}=await api.patch(`/admin/bookings/${id}/checkin`); toast.success(data.message); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }

  const toggleSession = async (id) => {
    try { const{data}=await api.patch(`/admin/sessions/${id}/toggle`); toast.success(data.message); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }

  const toggleUser = async (id, name) => {
    try { const{data}=await api.patch(`/admin/users/${id}/toggle`); toast.success(`${name}'s account ${data.isActive?'activated':'deactivated'}.`); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }

  const changeRole = async (id, role, name) => {
    try { await api.patch(`/admin/users/${id}/role`,{role}); toast.success(`${name} is now ${role}.`); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }

  const reviewApplication = async (id, action, adminNote='') => {
    try {
      const{data}=await api.patch(`/admin/instructor-applications/${id}`,{action,adminNote})
      toast.success(data.message); load()
    } catch (err) { toast.error(err.response?.data?.message||'Failed.') }
    finally { setRM(null) }
  }

  return (
    <div className="pt-20 pb-16" style={{background:'var(--bg)'}}>
      <div className="page-container max-w-7xl">
        <div className="py-6 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow mb-2">Management</p>
            <h1 className="font-display text-3xl font-semibold" style={{color:'var(--text)'}}>Admin Panel</h1>
          </div>
          <button onClick={load} className="btn-outline gap-2 text-sm py-2.5">
            <RefreshCw size={13}/> Refresh
          </button>
        </div>

        <div className="flex gap-1 p-1 rounded-2xl w-fit mb-8" style={{background:'var(--surface2)',border:'1.5px solid var(--border)'}}>
          {TABS.map(({key,label,icon:Icon})=>(
            <button key={key} onClick={()=>setTab(key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{background:tab===key?'var(--surface)':'transparent',color:tab===key?'var(--primary)':'var(--muted)',boxShadow:tab===key?'0 1px 4px rgba(0,0,0,0.08)':'none'}}>
              <Icon size={14}/>{label}
              {key==='instructors' && applications.filter(a=>a.status==='pending').length>0 && tab!=='instructors' && (
                <span className="w-4 h-4 rounded-full text-white flex items-center justify-center" style={{background:'var(--terra)',fontSize:10,fontWeight:700}}>
                  {applications.filter(a=>a.status==='pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-20"><LoadingSpinner size="lg"/></div> : <>

          {/* ══ OVERVIEW ══ */}
          {tab==='overview' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {label:'Total Users',   value:stats.totalUsers,   icon:Users,        bg:'#EBF5FD',c:'#1A4C8A'},
                  {label:'Sessions',      value:stats.totalSessions,icon:CalendarDays, bg:'#EAF4E0',c:'var(--primary)'},
                  {label:'Bookings',      value:stats.totalBookings,icon:BookOpen,     bg:'#FEF3E0',c:'#7A4A10'},
                  {label:'Revenue',       value:`₹${(stats.totalRevenue||0).toLocaleString('en-IN')}`,icon:TrendingUp,bg:'#EAF4E0',c:'var(--primary)'},
                ].map(({label,value,icon:Icon,bg,c})=>(
                  <div key={label} className="card p-5 shadow-card">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:bg}}><Icon size={18} style={{color:c}}/></div>
                    <p className="font-display text-2xl font-bold" style={{color:'var(--text)'}}>{value}</p>
                    <p className="text-xs font-medium mt-0.5" style={{color:'var(--muted)'}}>{label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-5 shadow-card" style={{background:'#EAF4E0',border:'1px solid #B5D98A'}}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--primary)'}}>Today's Bookings</p>
                  <p className="font-display text-3xl font-bold" style={{color:'var(--primary)'}}>{stats.todayBookings||0}</p>
                </div>
                <div className="card p-5 shadow-card" style={{background:'#EBF5FD',border:'1px solid #9DC8E8'}}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'#1A4C8A'}}>Today's Revenue</p>
                  <p className="font-display text-3xl font-bold" style={{color:'#1A4C8A'}}>₹{(stats.todayRevenue||0).toLocaleString('en-IN')}</p>
                </div>
              </div>
              {stats.recentBookings?.length>0 && (
                <div className="card shadow-card overflow-hidden">
                  <div className="p-5 border-b flex items-center justify-between" style={{borderColor:'var(--border)'}}>
                    <h2 className="font-semibold" style={{color:'var(--text)'}}>Recent Bookings</h2>
                    <button onClick={()=>setTab('bookings')} className="text-xs font-semibold hover:underline" style={{color:'var(--primary)'}}>View all →</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead style={{background:'var(--surface2)'}}><tr>{['Ref','User','Session','Date','Status','Amount'].map(h=>(
                        <th key={h} className="text-left p-3.5 text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>{h}</th>
                      ))}</tr></thead>
                      <tbody>{stats.recentBookings.map(b=>{const s=SC[b.status]||SC.pending;return(
                        <tr key={b._id} className="border-t hover:bg-[#F5F8F0]" style={{borderColor:'var(--border)'}}>
                          <td className="p-3.5 font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{b.bookingReference}</td>
                          <td className="p-3.5" style={{color:'var(--text)'}}>{b.user?.firstName} {b.user?.lastName}</td>
                          <td className="p-3.5 max-w-28 truncate" style={{color:'var(--muted)'}}>{b.session?.title}</td>
                          <td className="p-3.5 text-xs" style={{color:'var(--muted)'}}>{new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}</td>
                          <td className="p-3.5"><span className="badge text-xs" style={{background:s.bg,color:s.color}}>{b.status}</span></td>
                          <td className="p-3.5 font-bold" style={{color:'var(--primary)'}}>₹{b.payment?.amount?.toLocaleString('en-IN')}</td>
                        </tr>
                      )})}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ BOOKINGS ══ */}
          {tab==='bookings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--faint)'}}/>
                  <input type="text" className="input-field pl-10 h-11 text-sm" placeholder="Search name, email, reference…" value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <div className="flex gap-1 p-1 rounded-xl" style={{background:'var(--surface2)',border:'1px solid var(--border)'}}>
                  {['all','confirmed','completed','cancelled','pending'].map(s=>(
                    <button key={s} onClick={()=>setBF(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                      style={{background:bFilter===s?'var(--surface)':'transparent',color:bFilter===s?'var(--primary)':'var(--muted)'}}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="card shadow-card overflow-hidden">
                <div className="p-4 border-b" style={{borderColor:'var(--border)'}}>
                  <p className="font-semibold text-sm" style={{color:'var(--text)'}}>{bookings.length} booking{bookings.length!==1?'s':''}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{background:'var(--surface2)'}}><tr>{['Reference','Student','Session','Date & Time','Status','Amount','Actions'].map(h=>(
                      <th key={h} className="text-left p-3.5 text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>{h}</th>
                    ))}</tr></thead>
                    <tbody>{bookings.length===0?(<tr><td colSpan={7} className="text-center py-12 text-sm" style={{color:'var(--muted)'}}>No bookings found</td></tr>):bookings.map(b=>{const s=SC[b.status]||SC.pending;return(
                      <tr key={b._id} className="border-t hover:bg-[#F5F8F0] transition-colors" style={{borderColor:'var(--border)'}}>
                        <td className="p-3.5 font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{b.bookingReference}</td>
                        <td className="p-3.5"><p className="font-medium" style={{color:'var(--text)'}}>{b.user?.firstName} {b.user?.lastName}</p><p className="text-xs" style={{color:'var(--muted)'}}>{b.user?.email}</p></td>
                        <td className="p-3.5 max-w-[160px]"><p className="truncate text-sm" style={{color:'var(--text)'}}>{b.session?.title}</p><p className="text-xs" style={{color:'var(--muted)'}}>{b.session?.type}</p></td>
                        <td className="p-3.5 text-xs" style={{color:'var(--muted)'}}><p>{new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}</p><p className="font-medium">{b.sessionTime}</p></td>
                        <td className="p-3.5"><span className="badge text-xs" style={{background:s.bg,color:s.color}}>{b.status}</span>{b.checkedIn&&<span className="badge badge-green text-xs ml-1">✓In</span>}</td>
                        <td className="p-3.5 font-bold" style={{color:'var(--primary)'}}>₹{b.payment?.amount?.toLocaleString('en-IN')}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            {b.status==='confirmed'&&!b.checkedIn&&(<button onClick={()=>checkIn(b._id)} title="Check in" className="p-1.5 rounded-lg hover:bg-[#EAF4E0]" style={{color:'var(--primary)'}}><CheckSquare size={15}/></button>)}
                            {['confirmed','pending'].includes(b.status)&&(<button title="Cancel" onClick={()=>setCM({id:b._id,label:`#${b.bookingReference}`})} className="p-1.5 rounded-lg hover:bg-[#FDEEE8]" style={{color:'var(--terra)'}}><Ban size={15}/></button>)}
                          </div>
                        </td>
                      </tr>
                    )})}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ SESSIONS ══ */}
          {tab==='sessions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm" style={{color:'var(--muted)'}}>{sessions.length} sessions</p>
                <button onClick={()=>setSM('create')} className="btn-primary text-sm py-2.5 gap-2"><Plus size={15}/>Add Session</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map(s=>(
                  <div key={s._id} className="card shadow-card overflow-hidden" style={{opacity:s.isActive?1:0.6}}>
                    {s.image&&<div className="h-32 overflow-hidden" style={{background:'var(--surface2)'}}><img src={s.image} alt={s.title} className="w-full h-full object-cover" onError={e=>{e.target.style.display='none'}}/></div>}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm leading-tight truncate" style={{color:'var(--text)'}}>{s.title}</h3>
                        <span className={`badge text-xs ${s.isActive?'badge-green':'badge-gray'}`}>{s.isActive?'Active':'Off'}</span>
                      </div>
                      <p className="text-xs mb-2" style={{color:'var(--muted)'}}>{s.type}·{s.level}·{s.duration}min·<strong style={{color:'var(--primary)'}}>₹{s.price?.toLocaleString('en-IN')}</strong></p>
                      <p className="text-xs mb-3" style={{color:'var(--faint)'}}>{s.totalBookings||0} bookings·{s.activeBookings||0} upcoming</p>
                      <div className="flex gap-2">
                        <button onClick={()=>setSM(s)} className="btn-outline text-xs py-1.5 px-3 gap-1 flex-1 justify-center"><Pencil size={11}/>Edit</button>
                        <button onClick={()=>toggleSession(s._id)} className="btn-outline text-xs py-1.5 px-3 gap-1 flex-1 justify-center" style={{color:s.isActive?'var(--terra)':'var(--primary)'}}>
                          {s.isActive?<ToggleRight size={14}/>:<ToggleLeft size={14}/>}{s.isActive?'Disable':'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ INSTRUCTOR APPLICATIONS ══ */}
          {tab==='instructors' && (
            <div className="space-y-4">
              <div className="flex gap-1 p-1 rounded-xl w-fit" style={{background:'var(--surface2)',border:'1px solid var(--border)'}}>
                {['pending','approved','rejected','all'].map(s=>(
                  <button key={s} onClick={()=>setAF(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                    style={{background:appFilter===s?'var(--surface)':'transparent',color:appFilter===s?'var(--primary)':'var(--muted)'}}>{s}</button>
                ))}
              </div>

              {applications.length===0 ? (
                <div className="card text-center py-16 shadow-card">
                  <GraduationCap size={36} className="mx-auto mb-3" style={{color:'var(--faint)'}}/>
                  <p className="font-semibold" style={{color:'var(--text)'}}>No {appFilter} applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map(app=>(
                    <div key={app._id} className="card p-6 shadow-card">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4">
                          {app.profilePhoto||app.user?.avatar ? (
                            <img src={app.profilePhoto||app.user?.avatar} alt="" className="w-14 h-14 rounded-full object-cover border-2" style={{borderColor:'#B5D98A'}}/>
                          ) : (
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold" style={{background:'#EAF4E0',color:'var(--primary)'}}>
                              {app.user?.firstName?.[0]}{app.user?.lastName?.[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-base" style={{color:'var(--text)'}}>{app.user?.firstName} {app.user?.lastName}</p>
                            <p className="text-sm" style={{color:'var(--muted)'}}>{app.user?.email}</p>
                            <p className="text-xs mt-1" style={{color:'var(--faint)'}}>{app.experience}</p>
                          </div>
                        </div>
                        <span className={`badge text-xs capitalize ${app.status==='pending'?'badge-amber':app.status==='approved'?'badge-green':'badge-terra'}`}
                          style={app.status==='pending'?{background:'#FEF3E0',color:'#8C5C10'}:{}}>
                          {app.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--muted)'}}>Bio</p>
                          <p className="text-sm leading-relaxed" style={{color:'var(--text)'}}>{app.bio}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--muted)'}}>Specialties</p>
                          <div className="flex flex-wrap gap-1">
                            {app.specialties?.map(s=><span key={s} className="badge badge-green text-xs">{s}</span>)}
                          </div>
                          {app.certifications?.length>0 && (
                            <div className="mt-2">
                              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--muted)'}}>Certifications</p>
                              <p className="text-xs" style={{color:'var(--text)'}}>{app.certifications.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {app.adminNote && (
                        <div className="mt-3 p-3 rounded-lg text-sm" style={{background:'#FEF3E0',color:'#8C5C10'}}>
                          <strong>Admin note:</strong> {app.adminNote}
                        </div>
                      )}

                      {app.status === 'pending' && (
                        <div className="flex gap-3 mt-5 pt-4" style={{borderTop:'1px solid var(--border)'}}>
                          <button onClick={()=>reviewApplication(app._id,'approve')}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{background:'#EAF4E0',color:'var(--primary)',border:'1px solid #B5D98A'}}>
                            <Check size={15}/> Approve Instructor
                          </button>
                          <button onClick={()=>setRM({id:app._id,name:`${app.user?.firstName} ${app.user?.lastName}`})}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{background:'#FDEEE8',color:'var(--terra)',border:'1px solid #F5C4B3'}}>
                            <X size={15}/> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ USERS ══ */}
          {tab==='users' && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--faint)'}}/>
                <input type="text" className="input-field pl-10 h-11 text-sm" placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div className="card shadow-card overflow-hidden">
                <div className="p-4 border-b" style={{borderColor:'var(--border)'}}><p className="font-semibold text-sm" style={{color:'var(--text)'}}>{users.length} users</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{background:'var(--surface2)'}}><tr>{['User','Email','Role','Bookings','Status','Actions'].map(h=>(
                      <th key={h} className="text-left p-3.5 text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>{h}</th>
                    ))}</tr></thead>
                    <tbody>{users.length===0?(<tr><td colSpan={6} className="text-center py-12 text-sm" style={{color:'var(--muted)'}}>No users found</td></tr>):users.map(u=>(
                      <tr key={u._id} className="border-t hover:bg-[#F5F8F0] transition-colors" style={{borderColor:'var(--border)'}}>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold shrink-0" style={{background:'#EAF4E0',color:'var(--primary)'}}>
                              {u.avatar?<img src={u.avatar} alt="" className="w-full h-full object-cover"/>:<>{u.firstName?.[0]}{u.lastName?.[0]}</>}
                            </div>
                            <span className="font-medium" style={{color:'var(--text)'}}>{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-sm" style={{color:'var(--muted)'}}>{u.email}</td>
                        <td className="p-3.5">
                          <select className="text-xs rounded-lg px-2 py-1 font-semibold border outline-none" style={{background:u.role==='admin'?'#FDEEE8':'#EAF4E0',color:u.role==='admin'?'var(--terra)':'var(--primary)',borderColor:'transparent'}}
                            value={u.role} onChange={e=>changeRole(u._id,e.target.value,u.firstName)}>
                            <option value="user">user</option>
                            <option value="instructor">instructor</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-center font-bold" style={{color:'var(--primary)'}}>{u.stats?.totalBookings||0}</td>
                        <td className="p-3.5"><span className={`badge text-xs ${u.isActive?'badge-green':'badge-terra'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                        <td className="p-3.5">
                          <button onClick={()=>toggleUser(u._id,u.firstName)} title={u.isActive?'Deactivate':'Activate'}
                            className="p-1.5 rounded-lg transition-colors" style={{color:u.isActive?'var(--terra)':'var(--primary)'}}
                            onMouseEnter={e=>e.currentTarget.style.background=u.isActive?'#FDEEE8':'#EAF4E0'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            {u.isActive?<Ban size={15}/>:<ShieldCheck size={15}/>}
                          </button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>}
      </div>

      {sessionModal!==null&&<SessionModal session={sessionModal==='create'?null:sessionModal} onClose={()=>setSM(null)} onSuccess={()=>{setSM(null);load()}}/>}
      {confirmModal&&<ConfirmModal title="Cancel Booking?" message={`Cancel booking ${confirmModal.label}? User will be notified.`} confirmLabel="Yes, Cancel" confirmColor="var(--terra)" onConfirm={()=>cancelBooking(confirmModal.id)} onClose={()=>setCM(null)}/>}
      {rejectModal&&<RejectModal name={rejectModal.name} onConfirm={note=>reviewApplication(rejectModal.id,'reject',note)} onClose={()=>setRM(null)}/>}
    </div>
  )
}

function SessionModal({ session, onClose, onSuccess }) {
  const isEdit = !!session
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title:session?.title||'', description:session?.description||'',
    type:session?.type||'Hatha', level:session?.level||'Beginner',
    duration:session?.duration||60, maxCapacity:session?.maxCapacity||12,
    price:session?.price||800, image:session?.image||'',
    instructorName:session?.instructor?.name||'', instructorBio:session?.instructor?.bio||'',
    instructorAvatar:session?.instructor?.avatar||'',
    scheduleInput:session?.schedule?.map(s=>`${s.day} ${s.time}`).join(', ')||'',
    location:session?.location?.address||'45 Green Park, Rajpur Road, Dehradun',
    cancellationPolicy:session?.cancellationPolicy||'Free cancellation up to 2 hours before the session.',
  })
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const parse=(input)=>{const m={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};return input.split(',').map(s=>{const p=s.trim().split(/\s+/);const day=p[0]?.charAt(0).toUpperCase()+p[0]?.slice(1).toLowerCase();return{day,time:p[1]||'08:00',dayIndex:m[p[0]?.toLowerCase()]??0}}).filter(s=>DAYS.includes(s.day))}

  const submit=async(e)=>{e.preventDefault();if(!form.title||!form.instructorName)return toast.error('Title and instructor name required.');setLoading(true);try{const payload={title:form.title,description:form.description,type:form.type,level:form.level,duration:parseInt(form.duration),maxCapacity:parseInt(form.maxCapacity),price:parseInt(form.price),image:form.image,cancellationPolicy:form.cancellationPolicy,location:{address:form.location,type:'in-person'},instructor:{name:form.instructorName,bio:form.instructorBio,avatar:form.instructorAvatar},schedule:parse(form.scheduleInput),isActive:true};if(isEdit){await api.put(`/admin/sessions/${session._id}`,payload);toast.success('Session updated!')}else{await api.post('/admin/sessions',payload);toast.success('Session created!')}onSuccess()}catch(err){toast.error(err.response?.data?.message||'Failed.')}finally{setLoading(false)}}

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{background:'rgba(0,0,0,0.5)'}}>
      <div className="card p-7 w-full max-w-2xl my-8 shadow-card-hover" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold" style={{color:'var(--text)'}}>{isEdit?'Edit Session':'Create Session'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#FDEEE8]" style={{color:'var(--terra)'}}><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Title *</label><input className="input-field text-sm" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Session title" required/></div>
            <div className="col-span-2"><label className="label">Description</label><textarea rows={3} className="input-field text-sm resize-none" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe the session…"/></div>
            <div><label className="label">Type</label><select className="input-field text-sm" value={form.type} onChange={e=>set('type',e.target.value)}>{SESSION_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label className="label">Level</label><select className="input-field text-sm" value={form.level} onChange={e=>set('level',e.target.value)}>{SESSION_LEVELS.map(l=><option key={l}>{l}</option>)}</select></div>
            <div><label className="label">Duration (min)</label><input type="number" className="input-field text-sm" value={form.duration} onChange={e=>set('duration',e.target.value)} min={15} max={180}/></div>
            <div><label className="label">Max Capacity</label><input type="number" className="input-field text-sm" value={form.maxCapacity} onChange={e=>set('maxCapacity',e.target.value)} min={1} max={50}/></div>
            <div><label className="label">Price (₹)</label><input type="number" className="input-field text-sm" value={form.price} onChange={e=>set('price',e.target.value)} min={0}/></div>
            <div><label className="label">Image URL</label><input className="input-field text-sm" value={form.image} onChange={e=>set('image',e.target.value)} placeholder="https://…"/></div>
          </div>
          <ImageUpload value={form.image} onChange={url=>set('image',url)} type="session" label="Or Upload Session Image" aspectRatio="landscape"/>
          <div className="pt-2 border-t" style={{borderColor:'var(--border)'}}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'var(--muted)'}}>Instructor</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Name *</label><input className="input-field text-sm" value={form.instructorName} onChange={e=>set('instructorName',e.target.value)} placeholder="Instructor name" required/></div>
              <div><label className="label">Avatar URL</label><input className="input-field text-sm" value={form.instructorAvatar} onChange={e=>set('instructorAvatar',e.target.value)} placeholder="https://…"/></div>
              <div className="col-span-2"><label className="label">Bio</label><input className="input-field text-sm" value={form.instructorBio} onChange={e=>set('instructorBio',e.target.value)} placeholder="Short bio…"/></div>
            </div>
          </div>
          <div><label className="label">Schedule <span className="normal-case tracking-normal font-normal text-xs" style={{color:'var(--faint)'}}>(e.g. Monday 07:00, Wednesday 07:00)</span></label>
            <input className="input-field text-sm" value={form.scheduleInput} onChange={e=>set('scheduleInput',e.target.value)} placeholder="Monday 07:00, Friday 07:00"/>
            <div className="flex flex-wrap gap-1.5 mt-2">{DAYS.map(day=>{const sel=form.scheduleInput.toLowerCase().includes(day.toLowerCase());return(
              <button key={day} type="button" onClick={()=>{if(sel){set('scheduleInput',form.scheduleInput.split(',').filter(s=>!s.trim().toLowerCase().startsWith(day.toLowerCase())).join(', ').trim())}else{const e=form.scheduleInput.trim();set('scheduleInput',e?`${e}, ${day} 08:00`:`${day} 08:00`)}}}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all" style={{background:sel?'var(--primary)':'var(--surface2)',color:sel?'#fff':'var(--muted)',border:`1px solid ${sel?'var(--primary)':'var(--border)'}`}}>
                {day.slice(0,3)}
              </button>
            )})}</div>
          </div>
          <div><label className="label">Location</label><input className="input-field text-sm" value={form.location} onChange={e=>set('location',e.target.value)}/></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3">{loading?<span className="spinner w-4 h-4"/>:<><Save size={14}/>{isEdit?'Save':'Create'}</>}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({title,message,confirmLabel,confirmColor,onConfirm,onClose}){
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.45)'}}>
      <div className="card p-8 max-w-sm w-full shadow-card-hover" onClick={e=>e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{background:'#FDEEE8'}}><AlertTriangle size={22} style={{color:'var(--terra)'}}/></div>
        <h2 className="font-display text-xl font-semibold text-center mb-2" style={{color:'var(--text)'}}>{title}</h2>
        <p className="text-sm text-center mb-6" style={{color:'var(--muted)'}}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-2.5">Go Back</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all" style={{background:confirmColor||'var(--terra)'}}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function RejectModal({name,onConfirm,onClose}){
  const[note,setNote]=useState('')
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.45)'}}>
      <div className="card p-8 max-w-sm w-full shadow-card-hover">
        <h2 className="font-display text-xl font-semibold mb-2" style={{color:'var(--text)'}}>Reject Application</h2>
        <p className="text-sm mb-4" style={{color:'var(--muted)'}}>Rejecting {name}'s instructor application.</p>
        <div className="mb-5">
          <label className="label">Reason / Feedback <span style={{textTransform:'none',letterSpacing:'normal',fontWeight:'normal',fontSize:'11px',color:'var(--faint)'}}>(optional, sent to applicant)</span></label>
          <textarea rows={3} className="input-field text-sm resize-none" value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Please reapply with more teaching experience and certifications."/>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-2.5">Cancel</button>
          <button onClick={()=>onConfirm(note)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white" style={{background:'var(--terra)'}}>Reject Application</button>
        </div>
      </div>
    </div>
  )
}
