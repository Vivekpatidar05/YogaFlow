import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Users, CalendarDays, TrendingUp, ArrowRight, Clock, CheckSquare, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const SESSION_TYPES  = ['Hatha','Vinyasa','Yin','Kundalini','Ashtanga','Restorative','Prenatal','Power','Hot Yoga','Meditation']
const SESSION_LEVELS = ['Beginner','Intermediate','Advanced','All Levels']
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function InstructorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab,       setTab]       = useState('overview')
  const [dashboard, setDashboard] = useState(null)
  const [sessions,  setSessions]  = useState([])
  const [bookings,  setBookings]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)

  useEffect(() => { loadData() }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'overview') {
        const { data } = await api.get('/instructor/dashboard')
        setDashboard(data.dashboard)
      } else if (tab === 'sessions') {
        const { data } = await api.get('/instructor/sessions')
        setSessions(data.sessions)
      } else if (tab === 'bookings') {
        const { data } = await api.get('/instructor/bookings?limit=30')
        setBookings(data.bookings)
      }
    } catch (err) {
      toast.error('Failed to load data.')
    } finally { setLoading(false) }
  }

  const toggleSession = async (id, current) => {
    try {
      await api.patch(`/admin/sessions/${id}/toggle`)
      toast.success(current ? 'Session deactivated.' : 'Session activated.')
      loadData()
    } catch { toast.error('Failed.') }
  }

  const checkIn = async (bookingId) => {
    try {
      await api.patch(`/admin/bookings/${bookingId}/checkin`)
      toast.success('Student checked in!')
      loadData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
  }

  const TABS = [
    { key:'overview', label:'Overview',  icon:TrendingUp },
    { key:'sessions', label:'Sessions',  icon:CalendarDays },
    { key:'bookings', label:'Bookings',  icon:BookOpen },
  ]

  const STATUS_COLORS = {
    confirmed: { bg:'#EAF4E0', color:'#1A5C1E' },
    cancelled: { bg:'#FDEEE8', color:'#8C3418' },
    completed: { bg:'#EBF5FD', color:'#1A4C8A' },
    pending:   { bg:'#FEF3E0', color:'#7A4A10' },
  }

  return (
    <div className="pt-20 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="page-container max-w-6xl">
        <div className="py-6 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow mb-2">Instructor</p>
            <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--text)' }}>
              My Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Welcome, {user?.firstName}! Manage your sessions and students here.
            </p>
          </div>
          <button onClick={() => { setShowForm(true); setTab('sessions') }}
            className="btn-primary gap-2">
            <Plus size={15} /> Add New Session
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl w-fit mb-8"
          style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab===key ? 'var(--surface)' : 'transparent',
                color:      tab===key ? 'var(--primary)' : 'var(--muted)',
                boxShadow:  tab===key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div> : (
          <>
            {/* ── Overview ── */}
            {tab === 'overview' && dashboard && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label:'My Sessions',       value: dashboard.totalSessions,   icon:CalendarDays, bg:'#EAF4E0', c:'var(--primary)' },
                    { label:'Total Bookings',     value: dashboard.totalBookings,   icon:Users,        bg:'#EBF5FD', c:'#1A4C8A' },
                    { label:'Upcoming',           value: dashboard.upcomingBookings,icon:Clock,        bg:'#FEF3E0', c:'#7A4A10' },
                    { label:'Total Revenue',      value:`₹${(dashboard.totalRevenue||0).toLocaleString('en-IN')}`, icon:TrendingUp, bg:'#EAF4E0', c:'var(--primary)' },
                  ].map(({ label, value, icon:Icon, bg, c }) => (
                    <div key={label} className="card p-5 shadow-card">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background:bg }}>
                        <Icon size={18} style={{ color:c }} />
                      </div>
                      <p className="font-display text-2xl font-bold" style={{ color:'var(--text)' }}>{value}</p>
                      <p className="text-xs font-medium mt-0.5" style={{ color:'var(--muted)' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent bookings */}
                <div className="card shadow-card overflow-hidden">
                  <div className="p-5 border-b flex items-center justify-between" style={{ borderColor:'var(--border)' }}>
                    <h2 className="font-semibold" style={{ color:'var(--text)' }}>Recent Bookings</h2>
                    <button onClick={() => setTab('bookings')} className="text-xs font-semibold hover:underline" style={{ color:'var(--primary)' }}>View all →</button>
                  </div>
                  <div className="divide-y" style={{ borderColor:'var(--border)' }}>
                    {dashboard.recentBookings?.length === 0 ? (
                      <p className="text-sm text-center py-8" style={{ color:'var(--muted)' }}>No bookings yet.</p>
                    ) : dashboard.recentBookings?.map(b => (
                      <div key={b._id} className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background:'#EAF4E0', color:'var(--primary)' }}>
                          {b.user?.firstName?.[0]}{b.user?.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color:'var(--text)' }}>
                            {b.user?.firstName} {b.user?.lastName}
                          </p>
                          <p className="text-xs" style={{ color:'var(--muted)' }}>
                            {b.session?.title} · {new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}
                          </p>
                        </div>
                        <span className="badge text-xs"
                          style={{ background: STATUS_COLORS[b.status]?.bg, color: STATUS_COLORS[b.status]?.color }}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Sessions ── */}
            {tab === 'sessions' && (
              <div className="space-y-4">
                {sessions.length === 0 && !showForm ? (
                  <div className="card text-center py-20 shadow-card">
                    <div className="text-4xl mb-4">🧘</div>
                    <h3 className="font-display text-xl mb-2" style={{ color:'var(--text)' }}>No sessions yet</h3>
                    <p className="text-sm mb-5" style={{ color:'var(--muted)' }}>Create your first session to start accepting bookings.</p>
                    <button onClick={() => setShowForm(true)} className="btn-primary gap-2">
                      <Plus size={14} /> Create First Session
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map(s => (
                      <div key={s._id} className="card shadow-card overflow-hidden"
                        style={{ opacity: s.isActive ? 1 : 0.6 }}>
                        {s.image && (
                          <div className="h-32 overflow-hidden" style={{ background:'var(--surface2)' }}>
                            <img src={s.image} alt={s.title} className="w-full h-full object-cover"
                              onError={e => { e.target.style.display='none' }} />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-sm leading-tight" style={{ color:'var(--text)' }}>{s.title}</h3>
                            <span className={`badge text-xs ${s.isActive ? 'badge-green' : 'badge-gray'}`}>
                              {s.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-xs mb-3" style={{ color:'var(--muted)' }}>
                            {s.level} · {s.duration}min · <span className="font-bold" style={{ color:'var(--primary)' }}>₹{s.price?.toLocaleString('en-IN')}</span>
                          </p>
                          <p className="text-xs mb-3" style={{ color:'var(--faint)' }}>
                            {s.totalBookings || 0} total · {s.upcomingBookings || 0} upcoming
                          </p>
                          <div className="flex gap-2">
                            <button onClick={() => toggleSession(s._id, s.isActive)}
                              className="btn-outline text-xs py-1.5 px-3 flex-1 justify-center"
                              style={{ color: s.isActive ? 'var(--terra)' : 'var(--primary)' }}>
                              {s.isActive ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Bookings ── */}
            {tab === 'bookings' && (
              <div className="card shadow-card overflow-hidden">
                <div className="p-5 border-b" style={{ borderColor:'var(--border)' }}>
                  <h2 className="font-semibold" style={{ color:'var(--text)' }}>Student Bookings ({bookings.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ background:'var(--surface2)' }}>
                      <tr>{['Student','Session','Date','Status','Amount','Action'].map(h => (
                        <th key={h} className="text-left p-3.5 text-xs font-bold uppercase tracking-wider" style={{ color:'var(--muted)' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {bookings.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-10 text-sm" style={{ color:'var(--muted)' }}>No bookings found</td></tr>
                      ) : bookings.map(b => {
                        const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending
                        return (
                          <tr key={b._id} className="border-t hover:bg-[#F5F8F0] transition-colors" style={{ borderColor:'var(--border)' }}>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background:'#EAF4E0', color:'var(--primary)' }}>
                                  {b.user?.firstName?.[0]}{b.user?.lastName?.[0]}
                                </div>
                                <div>
                                  <p className="font-medium text-sm" style={{ color:'var(--text)' }}>{b.user?.firstName} {b.user?.lastName}</p>
                                  <p className="text-xs" style={{ color:'var(--muted)' }}>{b.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 max-w-32"><p className="truncate text-sm" style={{ color:'var(--text)' }}>{b.session?.title}</p></td>
                            <td className="p-3.5 text-xs" style={{ color:'var(--muted)' }}>
                              {new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}<br/>{b.sessionTime}
                            </td>
                            <td className="p-3.5"><span className="badge text-xs" style={{ background:sc.bg, color:sc.color }}>{b.status}</span></td>
                            <td className="p-3.5 font-bold" style={{ color:'var(--primary)' }}>₹{b.payment?.amount?.toLocaleString('en-IN')}</td>
                            <td className="p-3.5">
                              {b.status === 'confirmed' && !b.checkedIn && (
                                <button onClick={() => checkIn(b._id)}
                                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold"
                                  style={{ background:'#EAF4E0', color:'var(--primary)' }}>
                                  <CheckSquare size={11} /> Check In
                                </button>
                              )}
                              {b.checkedIn && <span className="badge badge-green text-xs">✓ Checked In</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Session creation form modal */}
        {showForm && (
          <CreateSessionModal
            instructorName={`${user?.firstName} ${user?.lastName}`}
            instructorAvatar={user?.avatar || ''}
            onClose={() => setShowForm(false)}
            onSuccess={() => { setShowForm(false); setTab('sessions'); loadData() }} />
        )}
      </div>
    </div>
  )
}

function CreateSessionModal({ instructorName, instructorAvatar, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title:'', description:'', type:'Hatha', level:'Beginner',
    duration:60, maxCapacity:12, price:800, image:'',
    instructorBio:'', location:'45 Green Park, Rajpur Road, Dehradun',
    scheduleInput:'',
    cancellationPolicy:'Free cancellation up to 2 hours before the session.',
  })
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

  const parseSchedule = (input) => {
    const m = {sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6}
    return input.split(',').map(s => {
      const parts = s.trim().split(/\s+/)
      const day   = parts[0]?.charAt(0).toUpperCase() + parts[0]?.slice(1).toLowerCase()
      const time  = parts[1] || '08:00'
      return { day, time, dayIndex: m[parts[0]?.toLowerCase()] ?? 0 }
    }).filter(s => DAYS.includes(s.day))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title) return toast.error('Title is required.')
    setLoading(true)
    try {
      await api.post('/instructor/sessions', {
        title:       form.title,
        description: form.description,
        type:        form.type,
        level:       form.level,
        duration:    parseInt(form.duration),
        maxCapacity: parseInt(form.maxCapacity),
        price:       parseInt(form.price),
        image:       form.image,
        cancellationPolicy: form.cancellationPolicy,
        location:    { address: form.location, type:'in-person' },
        instructorBio: form.instructorBio,
        schedule:    parseSchedule(form.scheduleInput),
      })
      toast.success('Session created!')
      onSuccess()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="card p-7 w-full max-w-2xl my-8 shadow-card-hover" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold" style={{ color:'var(--text)' }}>Create New Session</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#FDEEE8]" style={{ color:'var(--terra)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Session Title *</label>
              <input className="input-field text-sm" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Morning Vinyasa Flow" required />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea rows={3} className="input-field text-sm resize-none" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe your session..." />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field text-sm" value={form.type} onChange={e=>set('type',e.target.value)}>
                {SESSION_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Level</label>
              <select className="input-field text-sm" value={form.level} onChange={e=>set('level',e.target.value)}>
                {SESSION_LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input type="number" className="input-field text-sm" value={form.duration} onChange={e=>set('duration',e.target.value)} min={15} max={180} />
            </div>
            <div>
              <label className="label">Max Capacity</label>
              <input type="number" className="input-field text-sm" value={form.maxCapacity} onChange={e=>set('maxCapacity',e.target.value)} min={1} max={50} />
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input type="number" className="input-field text-sm" value={form.price} onChange={e=>set('price',e.target.value)} min={0} />
            </div>
            <div>
              <label className="label">Image URL</label>
              <input className="input-field text-sm" value={form.image} onChange={e=>set('image',e.target.value)} placeholder="https://…" />
            </div>
            <div className="col-span-2">
              <label className="label">Schedule
                <span className="ml-1 normal-case tracking-normal font-normal text-xs" style={{color:'var(--faint)'}}>
                  (e.g. Monday 07:00, Wednesday 07:00)
                </span>
              </label>
              <input className="input-field text-sm" value={form.scheduleInput} onChange={e=>set('scheduleInput',e.target.value)} placeholder="Monday 07:00, Wednesday 07:00, Friday 07:00" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {DAYS.map(day => {
                  const sel = form.scheduleInput.toLowerCase().includes(day.toLowerCase())
                  return (
                    <button key={day} type="button"
                      onClick={() => {
                        if (sel) { set('scheduleInput', form.scheduleInput.split(',').filter(s=>!s.trim().toLowerCase().startsWith(day.toLowerCase())).join(', ').trim()) }
                        else { const e=form.scheduleInput.trim(); set('scheduleInput', e ? `${e}, ${day} 08:00` : `${day} 08:00`) }
                      }}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                      style={{ background:sel?'var(--primary)':'var(--surface2)', color:sel?'#fff':'var(--muted)', border:`1px solid ${sel?'var(--primary)':'var(--border)'}` }}>
                      {day.slice(0,3)}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="label">Your Bio</label>
              <input className="input-field text-sm" value={form.instructorBio} onChange={e=>set('instructorBio',e.target.value)} placeholder="Your instructor bio..." />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input-field text-sm" value={form.location} onChange={e=>set('location',e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3">
              {loading ? <span className="spinner w-4 h-4" /> : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
