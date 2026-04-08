import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.'
      const needsVerify = err.response?.data?.needsVerification
      if (needsVerify) {
        toast.error('Email not verified. Check your inbox for the OTP.')
        navigate('/signup')
      } else {
        toast.error(msg)
        if (msg.toLowerCase().includes('password')) setErrors({ password: msg })
        else setErrors({ email: msg })
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-16">
        <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&auto=format&q=80"
          alt="" className="absolute inset-0 w-full h-full object-cover" style={{opacity:0.2}} />
        <div className="absolute inset-0" style={{background:'linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.5) 100%)'}} />
        <div className="relative z-10 max-w-sm">
          <div className="text-5xl mb-6">🧘</div>
          <h2 className="font-display text-3xl font-normal text-[#e8e8e8] mb-4 leading-snug">
            Welcome back to your practice
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{color:'var(--muted)'}}>
            Sign in to manage your bookings, track your sessions, and stay connected with the YogaFlow community.
          </p>
          <div className="space-y-3">
            {['View and manage bookings', 'Receive session reminders', 'Track your practice history'].map(t => (
              <div key={t} className="flex items-center gap-3 text-sm" style={{color:'#666'}}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{background:'rgba(201,168,76,0.15)', color:'var(--gold)'}}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16" style={{background:'var(--bg)'}}>
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="text-sm font-medium mb-6 inline-block transition-colors" style={{color:'var(--muted)'}}>
              ← Back to home
            </Link>
            <h1 className="font-display text-3xl font-semibold text-[#e8e8e8] mt-4 mb-1">Sign In</h1>
            <p className="text-sm" style={{color:'var(--muted)'}}>
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium transition-colors" style={{color:'var(--gold)'}}>Create one →</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input type="email" className={`input-field text-sm ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com" value={form.email}
                onChange={e => set('email', e.target.value)} autoFocus />
              {errors.email && <p className="text-xs mt-1" style={{color:'#f87171'}}>{errors.email}</p>}
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="label" style={{marginBottom:0}}>Password</label>
                <Link to="/forgot-password" className="text-xs font-medium transition-colors" style={{color:'var(--gold)'}}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input type={show ? 'text' : 'password'}
                  className={`input-field text-sm pr-10 ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password" value={form.password}
                  onChange={e => set('password', e.target.value)} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'var(--muted)'}}>
                  {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{color:'#f87171'}}>{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3.5">
              {loading
                ? <><span className="spinner w-4 h-4"/><span>Signing in...</span></>
                : <>Sign In <ArrowRight size={15}/></>
              }
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{color:'var(--faint)'}}>
            By signing in you agree to our{' '}
            <a href="#" style={{color:'var(--gold)'}}>Terms</a> &amp;{' '}
            <a href="#" style={{color:'var(--gold)'}}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
