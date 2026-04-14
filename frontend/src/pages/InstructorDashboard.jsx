import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Users, CalendarDays, TrendingUp, Clock,
  CheckSquare, BookOpen, Pencil, X, Save, Upload,
  ToggleLeft, ToggleRight, Camera, Loader
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const SESSION_TYPES  = ['Hatha','Vinyasa','Yin','Kundalini','Ashtanga','Restorative','Prenatal','Power','Hot Yoga','Meditation']
const SESSION_LEVELS = ['Beginner','Intermediate','Advanced','All Levels']
const DAYS           = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const STATUS_COLORS = {
  confirmed: { bg:'#EAF4E0', color:'#1A5C1E' },
  cancelled: { bg:'#FDEEE8', color:'#8C3418' },
  completed: { bg:'#EBF5FD', color:'#1A4C8A' },
  pending:   { bg:'#FEF3E0', color:'#7A4A10' },
}

// ── Inline image upload button ────────────────────────────────────────────────
function ImagePicker({ value, onChange, label, aspectRatio = 'landscape', type = 'session' }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const handle = async (file) => {
    if (!file) return
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp']
    if (!allowed.includes(file.type)) return toast.error('Only JPEG, PNG or WebP images.')
    if (file.size > 5 * 1024 * 1024) return toast.error('Max image size is 5MB.')

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('type', type)
      const { data } = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data.success) { onChange(data.url); toast.success('Image uploaded!') }
      else toast.error(data.message || 'Upload failed.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.')
    } finally { setUploading(false) }
  }

  const h = aspectRatio === 'square' ? 'h-20 w-20' : 'h-32 w-full'

  return (
    <div>
      {label && <label className="label mb-1">{label}</label>}
      <div className={`relative ${h} rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all`}
        style={{
          borderColor: value ? 'var(--border)' : 'var(--border2)',
          background:  value ? 'transparent' : 'var(--surface2)',
        }}
        onClick={() => !uploading && inputRef.current?.click()}>
        {value ? (
          <>
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{ background:'rgba(0,0,0,0.45)' }}>
              <span className="text-white text-xs font-semibold flex items-center gap-1"><Camera size={13}/> Change</span>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-1.5">
            {uploading
              ? <Loader size={20} className="animate-spin" style={{ color:'var(--primary)' }} />
              : <Upload size={20} style={{ color:'var(--faint)' }} />
            }
            <p className="text-xs" style={{ color:'var(--faint)' }}>
              {uploading ? 'Uploading…' : 'Click to upload'}
            </p>
            <p className="text-xs" style={{ color:'var(--faint)' }}>Max 5MB</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background:'rgba(255,255,255,0.8)' }}>
            <Loader size={22} className="animate-spin" style={{ color:'var(--primary)' }} />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={e => handle(e.target.files[0])} />
      <p className="text-xs mt-1" style={{ color:'var(--faint)' }}>Or paste a URL:</p>
      <input className="input-field text-xs mt-1" placeholder="https://…"
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

export default function InstructorDashboard() {
  const { user } = useAuth()
  const [tab,      setTab]    = useState('overview')
  const [dashboard,setDB]     = useState(null)
  const [sessions, setSessions] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading] = useState(true)
  const [modal,    setModal]   = useState(null) // null | 'create' | session_object

  useEffect(() => { loadData() }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'overview') {
        const { data } = await api.get('/instructor/dashboard')
        setDB(data.dashboard)
      } else if (tab === 'sessions') {
        const { data } = await api.get('/instructor/sessions')
        setSessions(data.sessions)
      } else if (tab === 'bookings') {
        const { data } = await api.get('/instructor/bookings?limit=50')
        setBookings(data.bookings)
      }
    } catch { toast.error('Failed to load data.') }
    finally { setLoading(false) }
  }

  const toggleSession = async (id, current) => {
    try {
      await api.patch(`/admin/sessions/${id}/toggle`)
      toast.success(current ? 'Session disabled.' : 'Session enabled.')
      loadData()
    } catch { toast.error('Failed.') }
  }

  const checkIn = async (id) => {
    try {
      const { data } = await api.patch(`/admin/bookings/${id}/checkin`)
      toast.success(data.message)
      loadData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
  }

  const TABS = [
    { key:'overview', label:'Overview',  icon:TrendingUp  },
    { key:'sessions', label:'Sessions',  icon:CalendarDays },
    { key:'bookings', label:'Bookings',  icon:BookOpen    },
  ]

  return (
    <div className="pt-20 pb-16" style={{ background:'var(--bg)' }}>
      <div className="page-container max-w-6xl">

        {/* Header */}
        <div className="py-6 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow mb-2">Instructor</p>
            <h1 className="font-display text-3xl font-semibold" style={{ color:'var(--text)' }}>
              My Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color:'var(--muted)' }}>
              Welcome, {user?.firstName}! Manage your sessions and students here.
            </p>
          </div>
          <button onClick={() => setModal('create')} className="btn-primary gap-2">
            <Plus size={15} /> Add New Session
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl w-fit mb-8"
          style={{ background:'var(--surface2)', border:'1.5px solid var(--border)' }}>
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

        {loading
          ? <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          : <>
            {/* ── OVERVIEW ── */}
            {tab === 'overview' && dashboard && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label:'My Sessions',    value:dashboard.totalSessions,    icon:CalendarDays, bg:'#EAF4E0', c:'var(--primary)' },
                    { label:'Total Bookings', value:dashboard.totalBookings,    icon:Users,        bg:'#EBF5FD', c:'#1A4C8A' },
                    { label:'Upcoming',       value:dashboard.upcomingBookings, icon:Clock,        bg:'#FEF3E0', c:'#7A4A10' },
                    { label:'Total Revenue',  value:`₹${(dashboard.totalRevenue||0).toLocaleString('en-IN')}`, icon:TrendingUp, bg:'#EAF4E0', c:'var(--primary)' },
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

                <div className="card shadow-card overflow-hidden">
                  <div className="p-5 border-b flex items-center justify-between" style={{ borderColor:'var(--border)' }}>
                    <h2 className="font-semibold" style={{ color:'var(--text)' }}>Recent Bookings</h2>
                    <button onClick={() => setTab('bookings')} className="text-xs font-semibold hover:underline" style={{ color:'var(--primary)' }}>View all →</button>
                  </div>
                  <div className="divide-y" style={{ borderColor:'var(--border)' }}>
                    {!dashboard.recentBookings?.length ? (
                      <p className="text-sm text-center py-8" style={{ color:'var(--muted)' }}>No bookings yet.</p>
                    ) : dashboard.recentBookings.map(b => (
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
                          style={{ background:STATUS_COLORS[b.status]?.bg, color:STATUS_COLORS[b.status]?.color }}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SESSIONS ── */}
            {tab === 'sessions' && (
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="card text-center py-20 shadow-card">
                    <div className="text-4xl mb-4">🧘</div>
                    <h3 className="font-display text-xl mb-2" style={{ color:'var(--text)' }}>No sessions yet</h3>
                    <p className="text-sm mb-5" style={{ color:'var(--muted)' }}>Create your first session to start accepting bookings.</p>
                    <button onClick={() => setModal('create')} className="btn-primary gap-2">
                      <Plus size={14} /> Create First Session
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map(s => (
                      <div key={s._id} className="card shadow-card overflow-hidden"
                        style={{ opacity: s.isActive ? 1 : 0.6 }}>
                        {/* Session image with upload overlay */}
                        <div className="relative h-36 overflow-hidden" style={{ background:'var(--surface2)' }}>
                          {s.image && (
                            <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                          )}
                          <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                            style={{ background:'rgba(0,0,0,0.45)' }}>
                            <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                              <Camera size={14} /> Update Image
                            </span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files[0]
                                if (!file) return
                                if (file.size > 5*1024*1024) return toast.error('Max 5MB')
                                const fd = new FormData()
                                fd.append('image', file)
                                const t = toast.loading('Uploading...')
                                try {
                                  const { data } = await api.post(`/upload/session/${s._id}`, fd, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                  })
                                  if (data.success) { toast.success('Image updated!', { id:t }); loadData() }
                                  else toast.error(data.message, { id:t })
                                } catch (err) { toast.error(err.response?.data?.message || 'Failed.', { id:t }) }
                              }} />
                          </label>
                          {!s.image && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl">🧘</span>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-sm leading-tight" style={{ color:'var(--text)' }}>{s.title}</h3>
                            <span className={`badge text-xs ${s.isActive ? 'badge-green' : 'badge-gray'}`}>
                              {s.isActive ? 'Active' : 'Off'}
                            </span>
                          </div>
                          <p className="text-xs mb-2" style={{ color:'var(--muted)' }}>
                            {s.level} · {s.duration}min ·{' '}
                            <strong style={{ color:'var(--primary)' }}>₹{s.price?.toLocaleString('en-IN')}</strong>
                          </p>
                          <p className="text-xs mb-3" style={{ color:'var(--faint)' }}>
                            {s.totalBookings||0} bookings total · {s.upcomingBookings||0} upcoming
                          </p>
                          <div className="flex gap-2">
                            <button onClick={() => setModal(s)}
                              className="btn-outline text-xs py-1.5 px-3 flex-1 justify-center gap-1">
                              <Pencil size={11}/> Edit
                            </button>
                            <button onClick={() => toggleSession(s._id, s.isActive)}
                              className="btn-outline text-xs py-1.5 px-3 flex-1 justify-center gap-1"
                              style={{ color: s.isActive ? 'var(--terra)' : 'var(--primary)' }}>
                              {s.isActive ? <ToggleRight size={14}/> : <ToggleLeft size={14}/>}
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

            {/* ── BOOKINGS ── */}
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
                        <tr><td colSpan={6} className="text-center py-10 text-sm" style={{ color:'var(--muted)' }}>No bookings yet</td></tr>
                      ) : bookings.map(b => {
                        const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending
                        return (
                          <tr key={b._id} className="border-t hover:bg-[#F5F8F0]" style={{ borderColor:'var(--border)' }}>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                {b.user?.avatar
                                  ? <img src={b.user.avatar} alt="" className="w-7 h-7 rounded-full object-cover"/>
                                  : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background:'#EAF4E0',color:'var(--primary)' }}>
                                      {b.user?.firstName?.[0]}{b.user?.lastName?.[0]}
                                    </div>
                                }
                                <div>
                                  <p className="font-medium text-sm" style={{ color:'var(--text)' }}>{b.user?.firstName} {b.user?.lastName}</p>
                                  <p className="text-xs" style={{ color:'var(--muted)' }}>{b.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 max-w-32"><p className="truncate" style={{ color:'var(--text)' }}>{b.session?.title}</p></td>
                            <td className="p-3.5 text-xs" style={{ color:'var(--muted)' }}>
                              {new Date(b.sessionDate).toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}<br/>{b.sessionTime}
                            </td>
                            <td className="p-3.5">
                              <span className="badge text-xs" style={{ background:sc.bg, color:sc.color }}>{b.status}</span>
                              {b.checkedIn && <span className="badge badge-green text-xs ml-1">✓ In</span>}
                            </td>
                            <td className="p-3.5 font-bold" style={{ color:'var(--primary)' }}>₹{b.payment?.amount?.toLocaleString('en-IN')}</td>
                            <td className="p-3.5">
                              {b.status === 'confirmed' && !b.checkedIn && (
                                <button onClick={() => checkIn(b._id)}
                                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold"
                                  style={{ background:'#EAF4E0', color:'var(--primary)' }}>
                                  <CheckSquare size={11}/> Check In
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
          </>
        }
      </div>

      {/* Session Create/Edit Modal */}
      {modal !== null && (
        <SessionFormModal
          session={modal === 'create' ? null : modal}
          instructorName={`${user?.firstName} ${user?.lastName}`}
          instructorAvatar={user?.avatar || ''}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); setTab('sessions'); loadData() }} />
      )}
    </div>
  )
}

// ── Session Create / Edit Modal ───────────────────────────────────────────────
function SessionFormModal({ session, instructorName, instructorAvatar, onClose, onSuccess }) {
  const isEdit = !!session
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title:       session?.title       || '',
    description: session?.description || '',
    type:        session?.type        || 'Hatha',
    level:       session?.level       || 'Beginner',
    duration:    session?.duration    || 60,
    maxCapacity: session?.maxCapacity || 12,
    price:       session?.price       || 800,
    image:       session?.image       || '',
    instructorBio:    session?.instructor?.bio    || '',
    instructorAvatar: session?.instructor?.avatar || instructorAvatar,
    location:         session?.location?.address  || '45 Green Park, Rajpur Road, Dehradun',
    scheduleInput:    session?.schedule?.map(s => `${s.day} ${s.time}`).join(', ') || '',
    cancellationPolicy: session?.cancellationPolicy || 'Free cancellation up to 2 hours before.',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

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
      const payload = {
        title: form.title, description: form.description, type: form.type,
        level: form.level, duration: parseInt(form.duration),
        maxCapacity: parseInt(form.maxCapacity), price: parseInt(form.price),
        image: form.image,
        cancellationPolicy: form.cancellationPolicy,
        location: { address: form.location, type: 'in-person' },
        instructor: { name: instructorName, bio: form.instructorBio, avatar: form.instructorAvatar },
        schedule: parseSchedule(form.scheduleInput),
        instructorBio: form.instructorBio,
        instructorAvatar: form.instructorAvatar,
      }

      if (isEdit) {
        await api.put(`/instructor/sessions/${session._id}`, payload)
        toast.success('Session updated!')
      } else {
        await api.post('/instructor/sessions', payload)
        toast.success('Session created!')
      }
      onSuccess()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save session.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="card p-7 w-full max-w-2xl my-8 shadow-card-hover" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold" style={{ color:'var(--text)' }}>
            {isEdit ? 'Edit Session' : 'Create New Session'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#FDEEE8]" style={{ color:'var(--terra)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Session Title *</label>
              <input className="input-field text-sm" value={form.title}
                onChange={e => set('title', e.target.value)} placeholder="e.g. Morning Hatha Flow" required />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea rows={3} className="input-field text-sm resize-none" value={form.description}
                onChange={e => set('description', e.target.value)} placeholder="Describe your session…" />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field text-sm" value={form.type} onChange={e => set('type', e.target.value)}>
                {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Level</label>
              <select className="input-field text-sm" value={form.level} onChange={e => set('level', e.target.value)}>
                {SESSION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input type="number" className="input-field text-sm" value={form.duration}
                onChange={e => set('duration', e.target.value)} min={15} max={180} />
            </div>
            <div>
              <label className="label">Max Capacity</label>
              <input type="number" className="input-field text-sm" value={form.maxCapacity}
                onChange={e => set('maxCapacity', e.target.value)} min={1} max={50} />
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input type="number" className="input-field text-sm" value={form.price}
                onChange={e => set('price', e.target.value)} min={0} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input-field text-sm" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
          </div>

          {/* Session image upload */}
          <div className="pt-3 border-t" style={{ borderColor:'var(--border)' }}>
            <ImagePicker
              value={form.image}
              onChange={url => set('image', url)}
              label="Session Image (upload from device or paste URL)"
              aspectRatio="landscape"
              type="session" />
          </div>

          {/* Instructor info */}
          <div className="pt-3 border-t" style={{ borderColor:'var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'var(--muted)' }}>Your Instructor Profile</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <ImagePicker
                  value={form.instructorAvatar}
                  onChange={url => set('instructorAvatar', url)}
                  label="Your Photo (upload or paste URL)"
                  aspectRatio="square"
                  type="instructor" />
              </div>
              <div>
                <label className="label">Your Bio</label>
                <textarea rows={5} className="input-field text-sm resize-none" value={form.instructorBio}
                  onChange={e => set('instructorBio', e.target.value)} placeholder="Tell students about yourself…" />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="pt-3 border-t" style={{ borderColor:'var(--border)' }}>
            <label className="label">
              Weekly Schedule
              <span className="ml-1 normal-case tracking-normal font-normal text-xs" style={{ color:'var(--faint)' }}>
                (e.g. Monday 07:00, Wednesday 07:00)
              </span>
            </label>
            <input className="input-field text-sm mb-2" value={form.scheduleInput}
              onChange={e => set('scheduleInput', e.target.value)}
              placeholder="Monday 07:00, Wednesday 07:00, Friday 07:00" />
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map(day => {
                const sel = form.scheduleInput.toLowerCase().includes(day.toLowerCase())
                return (
                  <button key={day} type="button"
                    onClick={() => {
                      if (sel) {
                        set('scheduleInput', form.scheduleInput.split(',')
                          .filter(s => !s.trim().toLowerCase().startsWith(day.toLowerCase()))
                          .join(', ').trim())
                      } else {
                        const existing = form.scheduleInput.trim()
                        set('scheduleInput', existing ? `${existing}, ${day} 08:00` : `${day} 08:00`)
                      }
                    }}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: sel ? 'var(--primary)' : 'var(--surface2)',
                      color:      sel ? '#fff' : 'var(--muted)',
                      border:     `1px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                    }}>
                    {day.slice(0, 3)}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="label">Cancellation Policy</label>
            <input className="input-field text-sm" value={form.cancellationPolicy}
              onChange={e => set('cancellationPolicy', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3">
              {loading
                ? <span className="spinner w-4 h-4" />
                : <><Save size={14} /> {isEdit ? 'Save Changes' : 'Create Session'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
