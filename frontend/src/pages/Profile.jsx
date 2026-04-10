import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm]     = useState({ firstName:'', lastName:'', phone:'' })
  const [pw, setPw]         = useState({ currentPassword:'', newPassword:'', confirmPassword:'' })
  const [saving, setSaving] = useState(false)
  const [savingPw, setSPw]  = useState(false)
  const [showPw, setShow]   = useState(false)

  useEffect(() => {
    if (user) setForm({ firstName:user.firstName||'', lastName:user.lastName||'', phone:user.phone||'' })
  }, [user])

  const saveProfile = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await api.put('/users/profile', form)
      updateUser(data.user); toast.success('Profile updated!')
    } catch (err) { toast.error(err.response?.data?.message||'Update failed.') }
    finally { setSaving(false) }
  }

  const changePw = async e => {
    e.preventDefault()
    if (pw.newPassword !== pw.confirmPassword) return toast.error('Passwords do not match.')
    setSPw(true)
    try {
      await api.put('/users/change-password', pw)
      toast.success('Password changed! Please log in again.')
      setPw({ currentPassword:'', newPassword:'', confirmPassword:'' })
    } catch (err) { toast.error(err.response?.data?.message||'Failed.') }
    finally { setSPw(false) }
  }

  return (
    <div className="pt-20 pb-16" style={{background:'var(--bg)'}}>
      <div className="page-container max-w-2xl">
        <div className="py-6 mb-6">
          <p className="eyebrow mb-2">Account</p>
          <h1 className="font-display text-3xl font-semibold" style={{color:'var(--text)'}}>Profile Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Avatar + info */}
          <div className="card p-6 shadow-card">
            <div className="flex items-center gap-4 mb-6 pb-6" style={{borderBottom:'1.5px solid var(--border)'}}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{background:'#EAF4E0', color:'var(--primary)', border:'2px solid #B5D98A', fontFamily:'Georgia,serif'}}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-lg" style={{color:'var(--text)'}}>{user?.firstName} {user?.lastName}</p>
                <p className="text-sm" style={{color:'var(--muted)'}}>{user?.email}</p>
                <span className="badge badge-green text-xs mt-1 capitalize">{user?.role}</span>
              </div>
            </div>

            <h2 className="font-semibold mb-4" style={{color:'var(--text)'}}>Personal Information</h2>
            <form onSubmit={saveProfile} className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input className="input-field text-sm" value={form.firstName} onChange={e=>setForm(f=>({...f,firstName:e.target.value}))}/>
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input-field text-sm" value={form.lastName} onChange={e=>setForm(f=>({...f,lastName:e.target.value}))}/>
              </div>
              <div>
                <label className="label">Email</label>
                <input readOnly value={user?.email||''} className="input-field text-sm"/>
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input-field text-sm" value={form.phone} placeholder="+91 98765 43210"
                  onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
              </div>
              <div className="col-span-2">
                <button type="submit" disabled={saving} className="btn-primary text-sm py-2.5 gap-2">
                  <Save size={14}/>{saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Stats */}
          <div className="card p-6 shadow-card">
            <h2 className="font-semibold mb-4" style={{color:'var(--text)'}}>Your Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                {label:'Total Bookings', value:user?.stats?.totalBookings||0},
                {label:'Completed',      value:user?.stats?.completedSessions||0},
                {label:'Cancelled',      value:user?.stats?.cancelledBookings||0},
              ].map(({label,value}) => (
                <div key={label} className="text-center p-4 rounded-2xl" style={{background:'#EAF4E0'}}>
                  <p className="font-display text-2xl font-bold" style={{color:'var(--primary)'}}>{value}</p>
                  <p className="text-xs font-medium mt-0.5" style={{color:'#3A6A1E'}}>{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-center mt-4" style={{color:'var(--faint)'}}>
              Member since{' '}
              {user?.stats?.memberSince
                ? new Date(user.stats.memberSince).toLocaleDateString('en-IN',{month:'long',year:'numeric'})
                : '—'}
            </p>
          </div>

          {/* Change password */}
          <div className="card p-6 shadow-card">
            <h2 className="font-semibold mb-4" style={{color:'var(--text)'}}>Change Password</h2>
            <form onSubmit={changePw} className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input-field text-sm" value={pw.currentPassword}
                  onChange={e=>setPw(p=>({...p,currentPassword:e.target.value}))} placeholder="Current password"/>
              </div>
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input type={showPw?'text':'password'} className="input-field text-sm pr-11" value={pw.newPassword}
                    onChange={e=>setPw(p=>({...p,newPassword:e.target.value}))} placeholder="Min 8 chars, uppercase + number"/>
                  <button type="button" onClick={()=>setShow(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'var(--faint)'}}>
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input-field text-sm" value={pw.confirmPassword}
                  onChange={e=>setPw(p=>({...p,confirmPassword:e.target.value}))} placeholder="Repeat new password"/>
              </div>
              <button type="submit" disabled={savingPw} className="btn-outline text-sm py-2.5">
                {savingPw ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
