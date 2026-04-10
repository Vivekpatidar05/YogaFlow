import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

const PWD_CHECKS = [
  { test: p => p.length >= 8,   label: '8+ characters' },
  { test: p => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: p => /[a-z]/.test(p), label: 'Lowercase letter' },
  { test: p => /\d/.test(p),    label: 'Number' },
]

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep]         = useState('form') // 'form' | 'verify'
  const [pendingEmail, setPE]   = useState('')
  const [otp, setOtp]           = useState(['', '', '', '', '', ''])
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [verifying, setVerify]  = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [form, setForm]         = useState({ firstName:'', lastName:'', email:'', phone:'', password:'', confirm:'' })
  const [errors, setErrors]     = useState({})

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim())  e.lastName  = 'Required'
    if (!form.email) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Required'
    else if (!PWD_CHECKS.every(c => c.test(form.password))) e.password = 'Password does not meet all requirements'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e); return !Object.keys(e).length
  }

  const startCd = () => {
    setCountdown(60)
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/auth/register', {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password, phone: form.phone,
      })
      setPE(form.email)
      setStep('verify')
      startCd()
      toast.success(`Verification code sent to ${form.email}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.'
      if (err.response?.data?.needsVerification) {
        setPE(form.email); setStep('verify'); startCd()
        toast.success('OTP resent to your email.')
      } else {
        toast.error(msg)
        if (msg.toLowerCase().includes('email')) setErrors(e => ({ ...e, email: msg }))
      }
    } finally { setLoading(false) }
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
    if (!val && i > 0) document.getElementById(`otp-${i - 1}`)?.focus()
  }
  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) { setOtp(text.split('')); e.preventDefault() }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) return toast.error('Enter the complete 6-digit OTP.')
    setVerify(true)
    try {
      const { data } = await api.post('/auth/verify-email', { email: pendingEmail, otp: code })
      localStorage.setItem('accessToken',  data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      toast.success('Email verified! Welcome to YogaFlow 🧘')
      navigate('/dashboard')
      window.location.reload()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP.')
    } finally { setVerify(false) }
  }

  const resend = async () => {
    try {
      await api.post('/auth/resend-verification', { email: pendingEmail })
      toast.success('New OTP sent!'); startCd()
      setOtp(['', '', '', '', '', ''])
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to resend.') }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-stretch" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:block w-[38%] relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=900&auto=format&q=80"
          alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(44,95,46,0.65) 0%, rgba(26,58,28,0.45) 100%)' }} />
        <div className="absolute bottom-12 left-10 right-10 text-white">
          <h2 className="font-display text-2xl font-normal mb-3">Begin Your Yoga Journey</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Free account. Instant access to all sessions. Book and manage your practice.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">

          {/* ── Step 1: Form ── */}
          {step === 'form' && (
            <>
              <div className="mb-8">
                <Link to="/" className="text-sm font-medium mb-6 inline-block" style={{ color: 'var(--muted)' }}>← Back to home</Link>
                <h1 className="font-display text-3xl font-semibold mt-4 mb-1" style={{ color: 'var(--text)' }}>Create Account</h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Already have one?{' '}
                  <Link to="/login" className="font-semibold" style={{ color: 'var(--primary)' }}>Sign in →</Link>
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[['firstName','First Name','Priya'], ['lastName','Last Name','Sharma']].map(([k, l, ph]) => (
                    <div key={k}>
                      <label className="label">{l}</label>
                      <input className={`input-field text-sm ${errors[k] ? 'error' : ''}`}
                        placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} />
                      {errors[k] && <p className="text-xs mt-1 font-medium" style={{ color: 'var(--terra)' }}>{errors[k]}</p>}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <input type="email" className={`input-field text-sm ${errors.email ? 'error' : ''}`}
                    placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  {errors.email && <p className="text-xs mt-1 font-medium" style={{ color: 'var(--terra)' }}>{errors.email}</p>}
                </div>

                <div>
                  <label className="label">Phone <span className="normal-case font-normal tracking-normal text-xs" style={{ color: 'var(--faint)' }}>(optional)</span></label>
                  <input type="tel" className="input-field text-sm" placeholder="+91 98765 43210"
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input type={show ? 'text' : 'password'}
                      className={`input-field text-sm pr-11 ${errors.password ? 'error' : ''}`}
                      placeholder="Min 8 chars with uppercase & number"
                      value={form.password} onChange={e => set('password', e.target.value)} />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--faint)' }}>
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs mt-1 font-medium" style={{ color: 'var(--terra)' }}>{errors.password}</p>}
                  {form.password && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {PWD_CHECKS.map(c => (
                        <div key={c.label} className="flex items-center gap-1.5 text-xs transition-colors"
                          style={{ color: c.test(form.password) ? 'var(--primary)' : 'var(--faint)' }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors"
                            style={{ background: c.test(form.password) ? 'var(--primary)' : 'var(--border2)' }} />
                          {c.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" className={`input-field text-sm ${errors.confirm ? 'error' : ''}`}
                    placeholder="Repeat your password" value={form.confirm}
                    onChange={e => set('confirm', e.target.value)} />
                  {errors.confirm && <p className="text-xs mt-1 font-medium" style={{ color: 'var(--terra)' }}>{errors.confirm}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 mt-1">
                  {loading
                    ? <><span className="spinner w-4 h-4" />Creating account…</>
                    : <><UserPlus size={15} />Create Account &amp; Verify Email</>
                  }
                </button>
              </form>

              <p className="text-xs text-center mt-5" style={{ color: 'var(--faint)' }}>
                By creating an account you agree to our{' '}
                <a href="#" style={{ color: 'var(--primary)' }}>Terms</a> &amp;{' '}
                <a href="#" style={{ color: 'var(--primary)' }}>Privacy Policy</a>
              </p>
            </>
          )}

          {/* ── Step 2: OTP verify ── */}
          {step === 'verify' && (
            <div>
              <Link to="/" className="text-sm font-medium mb-6 inline-block" style={{ color: 'var(--muted)' }}>← Back to home</Link>
              <div className="text-center mb-8 mt-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#EAF4E0', border: '2px solid #B5D98A' }}>
                  <span className="text-3xl">📧</span>
                </div>
                <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>Verify Your Email</h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  We sent a 6-digit code to{' '}
                  <strong style={{ color: 'var(--text)' }}>{pendingEmail}</strong>
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--faint)' }}>
                  Check your spam/junk folder if you don't see it.
                </p>
              </div>

              <form onSubmit={handleVerify}>
                <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOtpPaste}>
                  {otp.map((d, i) => (
                    <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                      className="otp-box" value={d}
                      style={d ? { borderColor: 'var(--primary)', color: 'var(--primary)', background: '#F0F7EC' } : {}}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => e.key === 'Backspace' && !d && i > 0 && document.getElementById(`otp-${i - 1}`)?.focus()} />
                  ))}
                </div>

                <button type="submit" disabled={verifying || otp.join('').length !== 6}
                  className="btn-primary w-full justify-center py-3.5 mb-4">
                  {verifying
                    ? <><span className="spinner w-4 h-4" />Verifying…</>
                    : <>Verify &amp; Continue <ArrowRight size={15} /></>
                  }
                </button>

                <div className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                  {countdown > 0
                    ? <span>Resend in <strong style={{ color: 'var(--primary)' }}>{countdown}s</strong></span>
                    : <button type="button" onClick={resend} className="font-semibold" style={{ color: 'var(--primary)' }}>
                        Resend OTP
                      </button>
                  }
                </div>
              </form>

              <p className="text-center mt-4">
                <button onClick={() => setStep('form')} className="text-xs" style={{ color: 'var(--faint)' }}>
                  ← Change email address
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
