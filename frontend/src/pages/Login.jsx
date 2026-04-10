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
  const [form, setForm]     = useState({ email: '', password: '' })
  const [show, setShow]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e); return !Object.keys(e).length
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
      if (err.response?.data?.needsVerification) {
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
    <div className="min-h-[calc(100vh-64px)] flex items-stretch" style={{ background: 'var(--bg)' }}>
      {/* Left image panel */}
      <div className="hidden lg:block w-[42%] relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=900&auto=format&q=80"
          alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(44,95,46,0.7) 0%, rgba(26,58,28,0.5) 100%)' }} />
        <div className="absolute bottom-12 left-10 right-10 text-white">
          <h2 className="font-display text-2xl font-normal mb-3 leading-snug">
            Welcome back to your practice
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Sign in to manage your bookings and stay connected with the YogaFlow community.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="text-sm font-medium mb-6 inline-block" style={{ color: 'var(--muted)' }}>← Back to home</Link>
            <h1 className="font-display text-3xl font-semibold mt-4 mb-1" style={{ color: 'var(--text)' }}>Sign In</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold" style={{ color: 'var(--primary)' }}>Create one free →</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input type="email" className={`input-field ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com" value={form.email}
                onChange={e => set('email', e.target.value)} autoFocus />
              {errors.email && <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--terra)' }}>{errors.email}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="label" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input type={show ? 'text' : 'password'}
                  className={`input-field pr-11 ${errors.password ? 'error' : ''}`}
                  placeholder="Your password" value={form.password}
                  onChange={e => set('password', e.target.value)} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded" style={{ color: 'var(--faint)' }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--terra)' }}>{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 mt-1">
              {loading ? <><span className="spinner w-4 h-4" />Signing in…</> : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: 'var(--faint)' }}>
            By signing in you agree to our{' '}
            <a href="#" style={{ color: 'var(--primary)' }}>Terms</a> &amp;{' '}
            <a href="#" style={{ color: 'var(--primary)' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
