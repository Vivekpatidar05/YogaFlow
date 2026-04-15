import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Users, CalendarDays, BookOpen, TrendingUp, CheckSquare, RefreshCw,
  Plus, Pencil, X, Save, ToggleLeft, ToggleRight, Search, Ban,
  ShieldCheck, BarChart3, AlertTriangle, GraduationCap, CheckCircle,
  XCircle, Tag, Upload, Camera, Loader
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const TABS = [
  { key:'overview',    label:'Overview',    icon:BarChart3 },
  { key:'bookings',    label:'Bookings',    icon:BookOpen },
  { key:'sessions',    label:'Sessions',    icon:CalendarDays },
  { key:'instructors', label:'Instructors', icon:GraduationCap },
  { key:'coupons',     label:'Coupons',     icon:Tag },
  { key:'users',       label:'Users',       icon:Users },
]

const SESSION_TYPES  = ['Hatha','Vinyasa','Yin','Kundalini','Ashtanga','Restorative','Prenatal','Power','Hot Yoga','Meditation']
const SESSION_LEVELS = ['Beginner','Intermediate','Advanced','All Levels']
const DAYS           = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const SC = {
  confirmed:{bg:'#EAF4E0',color:'#1A5C1E'},
  cancelled:{bg:'#FDEEE8',color:'#8C3418'},
  completed:{bg:'#EBF5FD',color:'#1A4C8A'},
  pending:  {bg:'#FEF3E0',color:'#7A4A10'},
}

// ── Inline image picker with upload + URL fallback ────────────────────────────
function ImagePicker({ value, onChange, label, square = false, type = 'session' }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)
  const h = square ? 'h-24 w-24' : 'h-36 w-full'

  const handle = async (file) => {
    if (!file) return
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp']
    if (!allowed.includes(file.type)) return toast.error('Only JPEG, PNG or WebP.')
    if (file.size > 5 * 1024 * 1024) return toast.error('Max 5MB.')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('type',  type)
      const { data } = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data.success) { onChange(data.url); toast.success('Uploaded!') }
      else toast.error(data.message || 'Upload failed.')
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed.') }
    finally { setUploading(false) }
  }

  return (
    <div>
      {label && <label className="label mb-1">{label}</label>}
      <div className={`relative ${h} rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all mb-1`}
        style={{
          borderColor: value ? 'var(--border)' : 'var(--border2)',
          background:  value ? 'transparent' : 'var(--surface2)',
        }}
        onClick={() => !uploading && inputRef.current?.click()}>
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover"
              onError={e=>{e.target.style.display='none'}} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{ background:'rgba(0,0,0,0.4)' }}>
              <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                <Camera size={12}/> Change
              </span>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-1.5">
            {uploading
              ? <Loader size={18} className="animate-spin" style={{ color:'var(--primary)' }}/>
              : <Upload size={18} style={{ color:'var(--faint)' }}/>}
            <p className="text-xs" style={{ color:'var(--faint)' }}>
              {uploading ? 'Uploading…' : 'Click to upload'}
            </p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background:'rgba(255,255,255,0.8)' }}>
            <Loader size={22} className="animate-spin" style={{ color:'var(--primary)' }}/>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={e=>handle(e.target.files[0])}/>
      <p className="text-xs mb-1" style={{ color:'var(--faint)' }}>Or paste URL:</p>
      <input className="input-field text-xs" placeholder="https://…" value={value}
        onChange={e=>onChange(e.target.value)}/>
    </div>
  )
}

// ── Main Admin component ──────────────────────────────────────────────────────
export default function Admin() {
  const [tab,         setTab]    = useState('overview')
  const [stats,       setStats]  = useState(null)
  const [bookings,    setBK]     = useState([])
  const [sessions,    setSS]     = useState([])
  const [users,       setUsers]  = useState([])
  const [applications,setApps]   = useState([])
  const [coupons,     setCoupons]= useState([])
  const [loading,     setLoading]= useState(true)
  const [search,      setSearch] = useState('')
  const [bf,          setBF]     = useState('all')
  const [af,          setAF]     = useState('pending')
  const [sessionModal,setSM]     = useState(null)
  const [couponModal, setCM2]    = useState(false)
  const [confirmModal,setCM]     = useState(null)
  const [rejectModal, setRM]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (tab==='overview') { const {data}=await api.get('/admin/stats'); setStats(data.stats) }
      else if (tab==='bookings') {
        const q=bf!=='all'?`&status=${bf}`:''
        const {data}=await api.get(`/admin/bookings?limit=50${q}${search?`&search=${search}`:''}`)
        setBK(data.bookings)
      } else if (tab==='sessions') { const {data}=await api.get('/admin/sessions'); setSS(data.sessions) }
      else if (tab==='instructors') { const {data}=await api.get(`/admin/instructor-applications?status=${af}`); setApps(data.applications) }
      else if (tab==='coupons') { const {data}=await api.get('/coupons'); setCoupons(data.coupons) }
      else if (tab==='users') { const {data}=await api.get(`/admin/users?limit=50${search?`&search=${search}`:''}`); setUsers(data.users) }
    } catch { toast.error('Failed to load data.') }
    finally { setLoading(false) }
  }, [tab,bf,af,search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setSearch('') }, [tab])

  const cancelBooking = async (id) => {
    try { await api.patch(`/admin/bookings/${id}/cancel`,{reason:'Cancelled by admin'}); toast.success('Cancelled.'); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
    finally { setCM(null) }
  }
  const checkIn = async (id) => {
    try { const {data}=await api.patch(`/admin/bookings/${id}/checkin`); toast.success(data.message); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }
  const toggleSession = async (id) => {
    try { const {data}=await api.patch(`/admin/sessions/${id}/toggle`); toast.success(data.message); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }
  const toggleUser = async (id, name) => {
    try { const {data}=await api.patch(`/admin/users/${id}/toggle`); toast.success(`${name} ${data.isActive?'activated':'deactivated'}.`); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }
  const changeRole = async (id,role,name) => {
    try { await api.patch(`/admin/users/${id}/role`,{role}); toast.success(`${name} is now ${role}.`); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }
  const approveInstructor = async (appId) => {
    try { await api.patch(`/admin/instructor-applications/${appId}`,{action:'approve'}); toast.success('Instructor approved!'); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }
  const rejectInstructor = async (appId, note) => {
    try { await api.patch(`/admin/instructor-applications/${appId}`,{action:'reject',adminNote:note}); toast.success('Rejected.'); setRM(null); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }
  const toggleCoupon = async (id) => {
    try { const {data}=await api.patch(`/coupons/${id}/toggle`); toast.success(data.message); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
  }
  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return
    try { await api.delete(`/coupons/${id}`); toast.success('Coupon deleted.'); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed.') }
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

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl w-fit mb-8 flex-wrap"
          style={{background:'var(--surface2)',border:'1.5px solid var(--border)'}}>
          {TABS.map(({key,label,icon:Icon})=>(
            <button key={key} onClick={()=>setTab(key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background:tab===key?'var(--surface)':'transparent',
                color:tab===key?'var(--primary)':'var(--muted)',
                boxShadow:tab===key?'0 1px 4px rgba(0,0,0,0.08)':'none',
              }}>
              <Icon size={14}/>{label}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-20"><LoadingSpinner size="lg"/></div> : <>

          {/* ── OVERVIEW ── */}
          {tab==='overview' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {label:'Total Users',   value:stats.totalUsers,   icon:Users,       bg:'#EBF5FD',c:'#1A4C8A'},
                  {label:'Sessions',      value:stats.totalSessions,icon:CalendarDays,bg:'#EAF4E0',c:'var(--primary)'},
                  {label:'Bookings',      value:stats.totalBookings,icon:BookOpen,    bg:'#FEF3E0',c:'#7A4A10'},
                  {label:'Revenue',       value:`₹${(stats.totalRevenue||0).toLocaleString('en-IN')}`,icon:TrendingUp,bg:'#EAF4E0',c:'var(--primary)'},
                ].map(({label,value,icon:Icon,bg,c})=>(
                  <div key={label} className="card p-5 shadow-card">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:bg}}>
                      <Icon size={18} style={{color:c}}/>
                    </div>
                    <p className="font-display text-2xl font-bold" style={{color:'var(--text)'}}>{value}</p>
                    <p className="text-xs font-medium mt-0.5" style={{color:'var(--muted)'}}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Monthly revenue mini-chart */}
              {stats.monthlyRevenue?.length > 0 && (
                <div className="card p-6 shadow-card">
                  <h2 className="font-semibold mb-5" style={{color:'var(--text)'}}>Monthly Revenue</h2>
                  <div className="flex items-end gap-2 h-32">
                    {stats.monthlyRevenue.map((m, i) => {
                      const maxRev = Math.max(...stats.monthlyRevenue.map(x=>x.revenue),1)
                      const pct    = Math.max((m.revenue/maxRev)*100, 4)
                      const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <p className="text-xs font-semibold" style={{color:'var(--primary)',fontSize:10}}>
                            ₹{m.revenue>=1000?`${(m.revenue/1000).toFixed(1)}k`:m.revenue}
                          </p>
                          <div className="w-full rounded-t-lg transition-all"
                            style={{height:`${pct}%`,background:'var(--primary)',opacity:0.8+i*0.02}}/>
                          <p className="text-xs" style={{color:'var(--faint)',fontSize:10}}>{months[m._id.month]}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="card p-5 shadow-card" style={{background:'#EAF4E0',border:'1px solid #B5D98A'}}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'var(--primary)'}}>Today's Bookings</p>
                  <p className="font-display text-3xl font-bold" style={{color:'var(--primary)'}}>{stats.todayBookings}</p>
                </div>
                <div className="card p-5 shadow-card" style={{background:'#EBF5FD',border:'1px solid #9DC8E8'}}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#1A4C8A'}}>Today's Revenue</p>
                  <p className="font-display text-3xl font-bold" style={{color:'#1A4C8A'}}>₹{(stats.todayRevenue||0).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {stats.popularSessions?.length > 0 && (
                <div className="card shadow-card overflow-hidden">
                  <div className="p-5 border-b" style={{borderColor:'var(--border)'}}>
                    <h2 className="font-semibold" style={{color:'var(--text)'}}>Most Booked Sessions</h2>
                  </div>
                  {stats.popularSessions.map((item,i)=>(
                    <div key={i} className="flex items-center justify-between p-4 border-b last:border-0"
                      style={{borderColor:'var(--border)'}}>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center"
                          style={{background:'#EAF4E0',color:'var(--primary)'}}>{i+1}</span>
                        <div>
                          <p className="text-sm font-medium" style={{color:'var(--text)'}}>{item.session?.title}</p>
                          <p className="text-xs" style={{color:'var(--muted)'}}>{item.session?.type} · by {item.session?.instructor?.name}</p>
                        </div>
                      </div>
                      <span className="badge badge-green text-xs">{item.count} bookings</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="card shadow-card overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between" style={{borderColor:'var(--border)'}}>
                  <h2 className="font-semibold" style={{color:'var(--text)'}}>Recent Bookings</h2>
                  <button onClick={()=>setTab('bookings')} className="text-xs font-semibold hover:underline" style={{color:'var(--primary)'}}>View all →</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{background:'var(--surface2)'}}>
                      <tr>{['Reference','User','Session','Date','Status','Amount'].map(h=>(
                        <th key={h} className="text-left p-3.5 text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {stats.recentBookings?.map(b=>{
                        const sc=SC[b.status]||SC.pending
                        return (
                          <tr key={b._id} className="border-t hover:bg-[#F5F8F0]" style={{borderColor:'var(--border)'}}>
                            <td className="p-3.5 font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{b.bookingReference}</td>
                            <td className="p-3.5 text-sm" style={{color:'var(--text)'}}>{b.user?.firstName} {b.user?.lastName}</td>
                            <td className="p-3.5 max-w-28 truncate" style={{color:'var(--muted)'}}>{b.session?.title}</td>
                            <td className="p-3.5 text-xs" style={{color:'var(--muted)'}}>{new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}</td>
                            <td className="p-3.5"><span className="badge text-xs" style={{background:sc.bg,color:sc.color}}>{b.status}</span></td>
                            <td className="p-3.5 font-bold" style={{color:'var(--primary)'}}>₹{b.payment?.amount?.toLocaleString('en-IN')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {tab==='bookings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--faint)'}}/>
                  <input type="text" className="input-field pl-10 h-11 text-sm"
                    placeholder="Search by name, email, reference…" value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <div className="flex gap-1 p-1 rounded-xl" style={{background:'var(--surface2)',border:'1px solid var(--border)'}}>
                  {['all','confirmed','completed','cancelled','pending'].map(s=>(
                    <button key={s} onClick={()=>setBF(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                      style={{background:bf===s?'var(--surface)':'transparent',color:bf===s?'var(--primary)':'var(--muted)'}}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="card shadow-card overflow-hidden">
                <div className="p-4 border-b" style={{borderColor:'var(--border)'}}>
                  <p className="font-semibold text-sm" style={{color:'var(--text)'}}>{bookings.length} booking{bookings.length!==1?'s':''}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{background:'var(--surface2)'}}>
                      <tr>{['Reference','Student','Session','Date','Status','Amount','Actions'].map(h=>(
                        <th key={h} className="text-left p-3.5 text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {bookings.length===0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-sm" style={{color:'var(--muted)'}}>No bookings found</td></tr>
                      ) : bookings.map(b=>{
                        const sc=SC[b.status]||SC.pending
                        return (
                          <tr key={b._id} className="border-t hover:bg-[#F5F8F0]" style={{borderColor:'var(--border)'}}>
                            <td className="p-3.5"><span className="font-mono text-xs font-bold" style={{color:'var(--primary)'}}>{b.bookingReference}</span></td>
                            <td className="p-3.5"><p className="font-medium text-sm" style={{color:'var(--text)'}}>{b.user?.firstName} {b.user?.lastName}</p><p className="text-xs" style={{color:'var(--muted)'}}>{b.user?.email}</p></td>
                            <td className="p-3.5 max-w-[160px]"><p className="truncate text-sm" style={{color:'var(--text)'}}>{b.session?.title}</p></td>
                            <td className="p-3.5 text-xs" style={{color:'var(--muted)'}}>{new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}<br/>{b.sessionTime}</td>
                            <td className="p-3.5"><span className="badge text-xs" style={{background:sc.bg,color:sc.color}}>{b.status}</span>{b.checkedIn&&<span className="badge badge-green text-xs ml-1">✓</span>}</td>
                            <td className="p-3.5">
                              <p className="font-bold text-sm" style={{color:'var(--primary)'}}>₹{b.payment?.amount?.toLocaleString('en-IN')}</p>
                              {b.payment?.discountAmount>0&&<p className="text-xs" style={{color:'var(--primary)'}}>-₹{b.payment.discountAmount?.toLocaleString('en-IN')}</p>}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5">
                                {b.status==='confirmed'&&!b.checkedIn&&(
                                  <button onClick={()=>checkIn(b._id)} title="Check in" className="p-1.5 rounded-lg hover:bg-[#EAF4E0]" style={{color:'var(--primary)'}}><CheckSquare size={15}/></button>
                                )}
                                {['confirmed','pending'].includes(b.status)&&(
                                  <button title="Cancel" onClick={()=>setCM({id:b._id,label:`#${b.bookingReference}`})} className="p-1.5 rounded-lg hover:bg-[#FDEEE8]" style={{color:'var(--terra)'}}><Ban size={15}/></button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SESSIONS ── */}
          {tab==='sessions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm" style={{color:'var(--muted)'}}>{sessions.length} sessions</p>
                <button onClick={()=>setSM('create')} className="btn-primary text-sm py-2.5 gap-2"><Plus size={15}/> Add Session</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map(s=>(
                  <div key={s._id} className="card shadow-card overflow-hidden" style={{opacity:s.isActive?1:0.6}}>
                    {s.image && (
                      <div className="h-36 overflow-hidden" style={{background:'var(--surface2)'}}>
                        <img src={s.image} alt={s.title} className="w-full h-full object-cover" onError={e=>{e.target.style.display='none'}}/>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm leading-tight" style={{color:'var(--text)'}}>{s.title}</h3>
                        <span className={`badge text-xs ${s.isActive?'badge-green':'badge-gray'}`}>{s.isActive?'Active':'Off'}</span>
                      </div>
                      {s.instructor?.avatar&&<img src={s.instructor.avatar} alt="" className="w-7 h-7 rounded-full object-cover mb-2 border" style={{borderColor:'#B5D98A'}}/>}
                      <p className="text-xs mb-2" style={{color:'var(--muted)'}}>{s.level} · {s.duration}min · <strong style={{color:'var(--primary)'}}>₹{s.price?.toLocaleString('en-IN')}</strong></p>
                      <p className="text-xs mb-3" style={{color:'var(--faint)'}}>{s.instructor?.name} · {s.totalBookings||0} bookings</p>
                      <div className="flex gap-2">
                        <button onClick={()=>setSM(s)} className="btn-outline text-xs py-1.5 px-3 flex-1 justify-center gap-1"><Pencil size={11}/> Edit</button>
                        <button onClick={()=>toggleSession(s._id)} className="btn-outline text-xs py-1.5 px-3 flex-1 justify-center gap-1" style={{color:s.isActive?'var(--terra)':'var(--primary)'}}>
                          {s.isActive?<ToggleRight size={14}/>:<ToggleLeft size={14}/>}{s.isActive?'Disable':'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── INSTRUCTORS ── */}
          {tab==='instructors' && (
            <div className="space-y-4">
              <div className="flex gap-1 p-1 rounded-xl w-fit" style={{background:'var(--surface2)',border:'1px solid var(--border)'}}>
                {['pending','approved','rejected','all'].map(s=>(
                  <button key={s} onClick={()=>setAF(s)} className="px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize"
                    style={{background:af===s?'var(--surface)':'transparent',color:af===s?'var(--primary)':'var(--muted)'}}>{s}</button>
                ))}
              </div>
              {applications.length===0 ? (
                <div className="card text-center py-16 shadow-card">
                  <GraduationCap size={40} className="mx-auto mb-3" style={{color:'var(--faint)'}}/>
                  <p className="font-semibold" style={{color:'var(--text)'}}>No {af} applications</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {applications.map(app=>(
                    <div key={app._id} className="card p-5 shadow-card">
                      <div className="flex items-start gap-3 mb-4">
                        {app.profilePhoto||app.user?.avatar ? (
                          <img src={app.profilePhoto||app.user?.avatar} alt="" className="w-12 h-12 rounded-full object-cover border" style={{borderColor:'#B5D98A'}}/>
                        ) : (
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{background:'#EAF4E0',color:'var(--primary)'}}>{app.user?.firstName?.[0]}{app.user?.lastName?.[0]}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold" style={{color:'var(--text)'}}>{app.user?.firstName} {app.user?.lastName}</p>
                            <span className={`badge text-xs ${app.status==='pending'?'badge-amber':app.status==='approved'?'badge-green':'badge-terra'}`}>{app.status}</span>
                          </div>
                          <p className="text-xs" style={{color:'var(--muted)'}}>{app.user?.email}</p>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed mb-2" style={{color:'var(--muted)'}}>{app.bio}</p>
                      <p className="text-xs mb-2" style={{color:'var(--muted)'}}><strong>Experience:</strong> {app.experience}</p>
                      {app.specialties?.length>0&&(
                        <div className="flex flex-wrap gap-1 mb-3">{app.specialties.map(s=><span key={s} className="badge badge-green text-xs">{s}</span>)}</div>
                      )}
                      {app.adminNote&&<div className="p-2 rounded-lg mb-3" style={{background:'#FDEEE8'}}><p className="text-xs" style={{color:'var(--terra)'}}>Note: {app.adminNote}</p></div>}
                      <p className="text-xs mb-4" style={{color:'var(--faint)'}}>Applied {new Date(app.createdAt).toLocaleDateString('en-IN',{month:'long',day:'numeric',year:'numeric'})}</p>
                      {app.status==='pending'&&(
                        <div className="flex gap-2">
                          <button onClick={()=>approveInstructor(app._id)} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-semibold" style={{background:'#EAF4E0',color:'var(--primary)',border:'1px solid #B5D98A'}}>
                            <CheckCircle size={14}/> Approve
                          </button>
                          <button onClick={()=>setRM(app)} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-semibold" style={{background:'#FDEEE8',color:'var(--terra)',border:'1px solid #F5C4B3'}}>
                            <XCircle size={14}/> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── COUPONS ── */}
          {tab==='coupons' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm" style={{color:'var(--muted)'}}>{coupons.length} coupon{coupons.length!==1?'s':''}</p>
                <button onClick={()=>setCM2(true)} className="btn-primary text-sm py-2.5 gap-2"><Plus size={15}/> Create Coupon</button>
              </div>
              {coupons.length===0 ? (
                <div className="card text-center py-16 shadow-card">
                  <Tag size={40} className="mx-auto mb-3" style={{color:'var(--faint)'}}/>
                  <p className="font-semibold" style={{color:'var(--text)'}}>No coupons yet</p>
                  <p className="text-sm mt-1 mb-4" style={{color:'var(--muted)'}}>Create discount codes to boost bookings.</p>
                  <button onClick={()=>setCM2(true)} className="btn-primary text-sm px-6 gap-2"><Plus size={13}/> Create First Coupon</button>
                </div>
              ) : (
                <div className="card shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead style={{background:'var(--surface2)'}}>
                        <tr>{['Code','Discount','Min Order','Used','Valid Until','Status','Actions'].map(h=>(
                          <th key={h} className="text-left p-3.5 text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {coupons.map(c=>{
                          const expired = new Date(c.validUntil) < new Date()
                          return (
                            <tr key={c._id} className="border-t hover:bg-[#F5F8F0]" style={{borderColor:'var(--border)'}}>
                              <td className="p-3.5"><span className="font-mono font-bold text-sm" style={{color:'var(--primary)'}}>{c.code}</span><p className="text-xs" style={{color:'var(--muted)'}}>{c.description}</p></td>
                              <td className="p-3.5 font-semibold" style={{color:'var(--primary)'}}>{c.discountType==='percentage'?`${c.discountValue}%`:`₹${c.discountValue}`}{c.maxDiscount?<span className="text-xs font-normal ml-1" style={{color:'var(--muted)'}}>max ₹{c.maxDiscount}</span>:null}</td>
                              <td className="p-3.5" style={{color:'var(--muted)'}}>{c.minOrderValue>0?`₹${c.minOrderValue}`:'None'}</td>
                              <td className="p-3.5" style={{color:'var(--muted)'}}>{c.usageCount}{c.usageLimit>0?` / ${c.usageLimit}`:''}</td>
                              <td className="p-3.5 text-xs" style={{color:expired?'var(--terra)':'var(--muted)'}}>{new Date(c.validUntil).toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}{expired&&' (expired)'}</td>
                              <td className="p-3.5"><span className={`badge text-xs ${c.isActive&&!expired?'badge-green':'badge-gray'}`}>{c.isActive&&!expired?'Active':expired?'Expired':'Inactive'}</span></td>
                              <td className="p-3.5">
                                <div className="flex gap-1.5">
                                  <button onClick={()=>toggleCoupon(c._id)} className="p-1.5 rounded-lg hover:bg-[#EAF4E0] transition-colors" style={{color:'var(--primary)'}} title={c.isActive?'Deactivate':'Activate'}>
                                    {c.isActive?<ToggleRight size={15}/>:<ToggleLeft size={15}/>}
                                  </button>
                                  <button onClick={()=>deleteCoupon(c._id)} className="p-1.5 rounded-lg hover:bg-[#FDEEE8] transition-colors" style={{color:'var(--terra)'}} title="Delete"><X size={15}/></button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── USERS ── */}
          {tab==='users' && (
            <div className="space-y-4">
              <div className="relative"><Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--faint)'}}/><input type="text" className="input-field pl-10 h-11 text-sm" placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
              <div className="card shadow-card overflow-hidden">
                <div className="p-4 border-b" style={{borderColor:'var(--border)'}}><p className="font-semibold text-sm" style={{color:'var(--text)'}}>{users.length} users</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{background:'var(--surface2)'}}>
                      <tr>{['User','Email','Phone','Role','Bookings','Status','Actions'].map(h=>(
                        <th key={h} className="text-left p-3.5 text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {users.length===0?(<tr><td colSpan={7} className="text-center py-12 text-sm" style={{color:'var(--muted)'}}>No users found</td></tr>):users.map(u=>(
                        <tr key={u._id} className="border-t hover:bg-[#F5F8F0]" style={{borderColor:'var(--border)'}}>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              {u.avatar?<img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover"/>:<div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{background:'#EAF4E0',color:'var(--primary)'}}>{u.firstName?.[0]}{u.lastName?.[0]}</div>}
                              <span className="font-medium" style={{color:'var(--text)'}}>{u.firstName} {u.lastName}</span>
                            </div>
                          </td>
                          <td className="p-3.5" style={{color:'var(--muted)'}}>{u.email}</td>
                          <td className="p-3.5" style={{color:'var(--muted)'}}>{u.phone||'—'}</td>
                          <td className="p-3.5">
                            <select className="text-xs rounded-lg px-2 py-1 font-semibold border outline-none capitalize" style={{background:u.role==='admin'?'#FDEEE8':u.role==='instructor'?'#EBF5FD':'#EAF4E0',color:u.role==='admin'?'var(--terra)':u.role==='instructor'?'#1A4C8A':'var(--primary)',borderColor:'transparent'}} value={u.role} onChange={e=>changeRole(u._id,e.target.value,u.firstName)}>
                              <option value="user">user</option><option value="instructor">instructor</option><option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-center font-bold" style={{color:'var(--primary)'}}>{u.stats?.totalBookings||0}</td>
                          <td className="p-3.5"><span className={`badge text-xs ${u.isActive?'badge-green':'badge-terra'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                          <td className="p-3.5"><button onClick={()=>toggleUser(u._id,u.firstName)} className="p-1.5 rounded-lg transition-colors" style={{color:u.isActive?'var(--terra)':'var(--primary)'}} onMouseEnter={e=>e.currentTarget.style.background=u.isActive?'#FDEEE8':'#EAF4E0'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{u.isActive?<Ban size={15}/>:<ShieldCheck size={15}/>}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>}
      </div>

      {sessionModal!==null && <SessionModal session={sessionModal==='create'?null:sessionModal} onClose={()=>setSM(null)} onSuccess={()=>{setSM(null);load()}}/>}
      {couponModal && <CouponModal onClose={()=>setCM2(false)} onSuccess={()=>{setCM2(false);load()}}/>}
      {confirmModal && <ConfirmModal title="Cancel Booking?" message={`Cancel ${confirmModal.label}? User will be notified.`} confirmLabel="Yes, Cancel" onConfirm={()=>cancelBooking(confirmModal.id)} onClose={()=>setCM(null)}/>}
      {rejectModal && <RejectModal applicant={rejectModal} onConfirm={(note)=>rejectInstructor(rejectModal._id,note)} onClose={()=>setRM(null)}/>}
    </div>
  )
}

function SessionModal({ session, onClose, onSuccess }) {
  const isEdit = !!session
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title:session?.title||'', description:session?.description||'', type:session?.type||'Hatha', level:session?.level||'Beginner',
    duration:session?.duration||60, maxCapacity:session?.maxCapacity||12, price:session?.price||800,
    image:session?.image||'', instructorName:session?.instructor?.name||'', instructorBio:session?.instructor?.bio||'',
    instructorAvatar:session?.instructor?.avatar||'', location:session?.location?.address||'45 Green Park, Rajpur Road, Dehradun',
    scheduleInput:session?.schedule?.map(s=>`${s.day} ${s.time}`).join(', ')||'',
    cancellationPolicy:session?.cancellationPolicy||'Free cancellation up to 2 hours before.',
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const parse = (input) => {
    const m={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6}
    return input.split(',').map(s=>{const p=s.trim().split(/\s+/);const day=p[0]?.charAt(0).toUpperCase()+p[0]?.slice(1).toLowerCase();return{day,time:p[1]||'08:00',dayIndex:m[p[0]?.toLowerCase()]??0}}).filter(s=>DAYS.includes(s.day))
  }
  const submit = async (e) => {
    e.preventDefault()
    if (!form.title||!form.instructorName) return toast.error('Title and instructor name required.')
    setLoading(true)
    try {
      const payload={title:form.title,description:form.description,type:form.type,level:form.level,duration:parseInt(form.duration),maxCapacity:parseInt(form.maxCapacity),price:parseInt(form.price),image:form.image,cancellationPolicy:form.cancellationPolicy,location:{address:form.location,type:'in-person'},instructor:{name:form.instructorName,bio:form.instructorBio,avatar:form.instructorAvatar},schedule:parse(form.scheduleInput),isActive:true}
      if (isEdit) { await api.put(`/admin/sessions/${session._id}`,payload); toast.success('Session updated!') }
      else { await api.post('/admin/sessions',payload); toast.success('Session created!') }
      onSuccess()
    } catch (err) { toast.error(err.response?.data?.message||'Failed.') }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{background:'rgba(0,0,0,0.5)'}}>
      <div className="card p-7 w-full max-w-2xl my-8 shadow-card-hover" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold" style={{color:'var(--text)'}}>{isEdit?'Edit Session':'Create Session'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#FDEEE8]" style={{color:'var(--terra)'}}><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Title *</label><input className="input-field text-sm" value={form.title} onChange={e=>set('title',e.target.value)} required/></div>
            <div className="col-span-2"><label className="label">Description</label><textarea rows={3} className="input-field text-sm resize-none" value={form.description} onChange={e=>set('description',e.target.value)}/></div>
            <div><label className="label">Type</label><select className="input-field text-sm" value={form.type} onChange={e=>set('type',e.target.value)}>{SESSION_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="label">Level</label><select className="input-field text-sm" value={form.level} onChange={e=>set('level',e.target.value)}>{SESSION_LEVELS.map(l=><option key={l} value={l}>{l}</option>)}</select></div>
            <div><label className="label">Duration (min)</label><input type="number" className="input-field text-sm" value={form.duration} onChange={e=>set('duration',e.target.value)} min={15} max={180}/></div>
            <div><label className="label">Max Capacity</label><input type="number" className="input-field text-sm" value={form.maxCapacity} onChange={e=>set('maxCapacity',e.target.value)} min={1} max={50}/></div>
            <div><label className="label">Price (₹)</label><input type="number" className="input-field text-sm" value={form.price} onChange={e=>set('price',e.target.value)} min={0}/></div>
            <div><label className="label">Location</label><input className="input-field text-sm" value={form.location} onChange={e=>set('location',e.target.value)}/></div>
          </div>

          {/* Session image upload */}
          <div className="border-t pt-4" style={{borderColor:'var(--border)'}}>
            <ImagePicker value={form.image} onChange={url=>set('image',url)} label="Session Image (upload from device or paste URL)" type="session"/>
          </div>

          {/* Instructor — with avatar UPLOAD not just URL */}
          <div className="border-t pt-4" style={{borderColor:'var(--border)'}}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{color:'var(--muted)'}}>Instructor</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Name *</label><input className="input-field text-sm" value={form.instructorName} onChange={e=>set('instructorName',e.target.value)} required/></div>
              {/* ── INSTRUCTOR AVATAR UPLOAD ── */}
              <div>
                <ImagePicker value={form.instructorAvatar} onChange={url=>set('instructorAvatar',url)}
                  label="Instructor Photo (upload from device or paste URL)"
                  square={true} type="instructor"/>
              </div>
              <div><label className="label">Bio</label><textarea rows={5} className="input-field text-sm resize-none" value={form.instructorBio} onChange={e=>set('instructorBio',e.target.value)}/></div>
            </div>
          </div>

          {/* Schedule */}
          <div className="border-t pt-4" style={{borderColor:'var(--border)'}}>
            <label className="label">Schedule</label>
            <input className="input-field text-sm mb-2" value={form.scheduleInput} onChange={e=>set('scheduleInput',e.target.value)} placeholder="Monday 07:00, Wednesday 07:00"/>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map(day=>{const sel=form.scheduleInput.toLowerCase().includes(day.toLowerCase());return(
                <button key={day} type="button" onClick={()=>{if(sel){set('scheduleInput',form.scheduleInput.split(',').filter(s=>!s.trim().toLowerCase().startsWith(day.toLowerCase())).join(', ').trim())}else{const e=form.scheduleInput.trim();set('scheduleInput',e?`${e}, ${day} 08:00`:`${day} 08:00`)}}}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                  style={{background:sel?'var(--primary)':'var(--surface2)',color:sel?'#fff':'var(--muted)',border:`1px solid ${sel?'var(--primary)':'var(--border)'}`}}>
                  {day.slice(0,3)}
                </button>
              )})}
            </div>
          </div>

          <div><label className="label">Cancellation Policy</label><input className="input-field text-sm" value={form.cancellationPolicy} onChange={e=>set('cancellationPolicy',e.target.value)}/></div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3">
              {loading?<span className="spinner w-4 h-4"/>:<><Save size={14}/> {isEdit?'Save Changes':'Create Session'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CouponModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 30)
  const [form, setForm] = useState({
    code:'', description:'', discountType:'percentage', discountValue:10,
    minOrderValue:0, maxDiscount:'', usageLimit:0,
    validUntil: tomorrow.toISOString().split('T')[0],
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const submit = async (e) => {
    e.preventDefault()
    if (!form.code||!form.description) return toast.error('Code and description required.')
    setLoading(true)
    try {
      await api.post('/coupons', { ...form, discountValue:parseFloat(form.discountValue), minOrderValue:parseInt(form.minOrderValue)||0, usageLimit:parseInt(form.usageLimit)||0, maxDiscount:form.maxDiscount?parseFloat(form.maxDiscount):undefined })
      toast.success('Coupon created!')
      onSuccess()
    } catch (err) { toast.error(err.response?.data?.message||'Failed.') }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
      <div className="card p-7 w-full max-w-md shadow-card-hover" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold" style={{color:'var(--text)'}}>Create Coupon</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#FDEEE8]" style={{color:'var(--terra)'}}><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Coupon Code *</label><input className="input-field text-sm uppercase" value={form.code} onChange={e=>set('code',e.target.value.toUpperCase())} placeholder="e.g. YOGA20" required/></div>
          <div><label className="label">Description *</label><input className="input-field text-sm" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="e.g. 20% off all sessions" required/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type</label><select className="input-field text-sm" value={form.discountType} onChange={e=>set('discountType',e.target.value)}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (₹)</option></select></div>
            <div><label className="label">Value</label><input type="number" className="input-field text-sm" value={form.discountValue} onChange={e=>set('discountValue',e.target.value)} min={0} step={form.discountType==='percentage'?1:1}/></div>
            {form.discountType==='percentage'&&<div><label className="label">Max Discount (₹)</label><input type="number" className="input-field text-sm" value={form.maxDiscount} onChange={e=>set('maxDiscount',e.target.value)} placeholder="Unlimited"/></div>}
            <div><label className="label">Min Order (₹)</label><input type="number" className="input-field text-sm" value={form.minOrderValue} onChange={e=>set('minOrderValue',e.target.value)} min={0}/></div>
            <div><label className="label">Usage Limit</label><input type="number" className="input-field text-sm" value={form.usageLimit} onChange={e=>set('usageLimit',e.target.value)} min={0} placeholder="0 = unlimited"/></div>
            <div><label className="label">Valid Until</label><input type="date" className="input-field text-sm" value={form.validUntil} onChange={e=>set('validUntil',e.target.value)}/></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3">{loading?<span className="spinner w-4 h-4"/>:<><Tag size={14}/> Create Coupon</>}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.45)'}}>
      <div className="card p-8 max-w-sm w-full shadow-card-hover">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{background:'#FDEEE8'}}><AlertTriangle size={22} style={{color:'var(--terra)'}}/></div>
        <h2 className="font-display text-xl font-semibold text-center mb-2" style={{color:'var(--text)'}}>{title}</h2>
        <p className="text-sm text-center mb-6" style={{color:'var(--muted)'}}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-2.5">Go Back</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white" style={{background:'var(--terra)'}}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function RejectModal({ applicant, onConfirm, onClose }) {
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.45)'}}>
      <div className="card p-8 max-w-sm w-full shadow-card-hover">
        <h2 className="font-display text-xl font-semibold mb-2" style={{color:'var(--text)'}}>Reject Application</h2>
        <p className="text-sm mb-4" style={{color:'var(--muted)'}}>Rejecting <strong>{applicant.user?.firstName}'s</strong> application. Provide a reason (optional):</p>
        <textarea rows={3} className="input-field text-sm resize-none mb-5" placeholder="e.g. Insufficient certifications. Please reapply with RYT-200." value={note} onChange={e=>setNote(e.target.value)}/>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-2.5">Cancel</button>
          <button onClick={()=>onConfirm(note)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white" style={{background:'var(--terra)'}}>Reject Application</button>
        </div>
      </div>
    </div>
  )
}
