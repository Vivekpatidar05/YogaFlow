import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, UserPlus, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

const pwChecks = [
  { test: p => p.length >= 8,    label: '8+ characters' },
  { test: p => /[A-Z]/.test(p),  label: 'Uppercase letter' },
  { test: p => /[a-z]/.test(p),  label: 'Lowercase letter' },
  { test: p => /\d/.test(p),     label: 'Number' },
]

const STEPS = { FORM: 'form', VERIFY: 'verify', DONE: 'done' }

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(STEPS.FORM)
  const [pendingEmail, setPendingEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim())  e.lastName  = 'Required'
    if (!form.email)            e.email     = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)         e.password  = 'Required'
    else if (!pwChecks.every(c => c.test(form.password))) e.password = 'Password does not meet all requirements'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return !Object.keys(e).length
  }

  // Step 1: submit registration form → triggers email OTP
  const handleRegister = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/auth/register', {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password, phone: form.phone
      })
      setPendingEmail(form.email)
      setStep(STEPS.VERIFY)
      startCountdown()
      toast.success(`Verification OTP sent to ${form.email}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.'
      if (err.response?.data?.needsVerification) {
        setPendingEmail(form.email)
        setStep(STEPS.VERIFY)
        startCountdown()
        toast.success('OTP resent to your email.')
      } else {
        toast.error(msg)
        if (msg.toLowerCase().includes('email')) setErrors(e => ({ ...e, email: msg }))
      }
    } finally { setLoading(false) }
  }

  const startCountdown = () => {
    setCountdown(60)
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
  }

  const handleOTPChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[idx] = val; setOtp(next)
    if (val && idx < 5) document.getElementById(`sotp-${idx + 1}`)?.focus()
    if (!val && idx > 0) document.getElementById(`sotp-${idx - 1}`)?.focus()
  }

  const handleOTPPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) { setOtp(text.split('')); e.preventDefault() }
  }

  // Step 2: verify OTP → auto-login
  const handleVerify = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) return toast.error('Enter the complete 6-digit OTP.')
    setVerifying(true)
    try {
      const { data } = await api.post('/auth/verify-email', { email: pendingEmail, otp: code })
      // Store tokens and update auth state
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      toast.success('Email verified! Welcome to YogaFlow 🧘')
      navigate('/dashboard')
      window.location.reload() // refresh auth context
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP.')
    } finally { setVerifying(false) }
  }

  const resendOTP = async () => {
    try {
      await api.post('/auth/resend-verification', { email: pendingEmail })
      toast.success('New OTP sent!')
      startCountdown()
      setOtp(['', '', '', '', '', ''])
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to resend.') }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-5/12 relative overflow-hidden items-center justify-center p-16">
        <img src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=900&auto=format&q=80"
          alt="" className="absolute inset-0 w-full h-full object-cover" style={{opacity:0.25}} />
        <div className="absolute inset-0" style={{background:'linear-gradient(135deg, rgba(10,10,10,0.8) 0%, rgba(10,10,10,0.4) 100%)'}} />
        <div className="relative z-10 max-w-xs text-center">
          <div className="text-5xl mb-5" style={{filter:'grayscale(0.3)'}}>🌿</div>
          <h2 className="font-display text-2xl font-normal text-[#e8e8e8] mb-3">Begin Your Yoga Journey</h2>
          <p className="text-sm leading-relaxed" style={{color:'var(--muted)'}}>
            Free account. Instant access. Book and manage sessions from anywhere.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12" style={{background:'var(--bg)'}}>
        <div className="w-full max-w-md">

          {/* ── Step 1: Registration form ── */}
          {step === STEPS.FORM && (
            <>
              <div className="mb-8">
                <Link to="/" className="text-sm font-medium transition-colors mb-6 inline-block" style={{color:'var(--muted)'}}>
                  ← Back to home
                </Link>
                <h1 className="font-display text-3xl font-semibold text-[#e8e8e8] mt-4 mb-1">Create Account</h1>
                <p className="text-sm" style={{color:'var(--muted)'}}>
                  Already have one?{' '}
                  <Link to="/login" className="font-medium transition-colors" style={{color:'var(--gold)'}}>Sign in →</Link>
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[['firstName','First Name','Priya'],['lastName','Last Name','Sharma']].map(([k,l,pl]) => (
                    <div key={k}>
                      <label className="label">{l}</label>
                      <input className={`input-field text-sm ${errors[k] ? 'error' : ''}`}
                        placeholder={pl} value={form[k]} onChange={e => set(k, e.target.value)} />
                      {errors[k] && <p className="text-xs mt-1" style={{color:'#f87171'}}>{errors[k]}</p>}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <input type="email" className={`input-field text-sm ${errors.email ? 'error' : ''}`}
                    placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  {errors.email && <p className="text-xs mt-1" style={{color:'#f87171'}}>{errors.email}</p>}
                </div>

                <div>
                  <label className="label">Phone <span style={{color:'var(--faint)', textTransform:'none', letterSpacing:'normal', fontSize:'11px', fontWeight:'normal'}}>(optional)</span></label>
                  <input type="tel" className="input-field text-sm" placeholder="+91 98765 43210"
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input type={show ? 'text' : 'password'}
                      className={`input-field text-sm pr-10 ${errors.password ? 'error' : ''}`}
                      placeholder="Min 8 chars with uppercase & number"
                      value={form.password} onChange={e => set('password', e.target.value)} />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'var(--muted)'}}>
                      {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs mt-1" style={{color:'#f87171'}}>{errors.password}</p>}
                  {form.password && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {pwChecks.map(c => (
                        <div key={c.label} className="flex items-center gap-1.5 text-xs transition-colors"
                          style={{color: c.test(form.password) ? 'var(--gold)' : 'var(--faint)'}}>
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors"
                            style={{background: c.test(form.password) ? 'var(--gold)' : 'var(--border2)'}} />
                          {c.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" className={`input-field text-sm ${errors.confirm ? 'error' : ''}`}
                    placeholder="Repeat password" value={form.confirm} onChange={e => set('confirm', e.target.value)} />
                  {errors.confirm && <p className="text-xs mt-1" style={{color:'#f87171'}}>{errors.confirm}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3.5 mt-2">
                  {loading
                    ? <><span className="spinner w-4 h-4"/><span>Creating account...</span></>
                    : <><UserPlus size={15}/> Create Account — Verify Email</>
                  }
                </button>
              </form>

              <p className="text-xs text-center mt-5" style={{color:'var(--faint)'}}>
                By creating an account you agree to our{' '}
                <a href="#" style={{color:'var(--gold)'}}>Terms</a> &amp;{' '}
                <a href="#" style={{color:'var(--gold)'}}>Privacy Policy</a>
              </p>
            </>
          )}

          {/* ── Step 2: Email verification ── */}
          {step === STEPS.VERIFY && (
            <div>
              <Link to="/" className="text-sm font-medium mb-6 inline-block" style={{color:'var(--muted)'}}>← Back to home</Link>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.2)'}}>
                  <span className="text-2xl">📧</span>
                </div>
                <h1 className="font-display text-2xl font-semibold text-[#e8e8e8] mb-2">Verify Your Email</h1>
                <p className="text-sm" style={{color:'var(--muted)'}}>
                  We sent a 6-digit code to{' '}
                  <strong className="text-[#e8e8e8]">{pendingEmail}</strong>
                </p>
              </div>

              <form onSubmit={handleVerify}>
                <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOTPPaste}>
                  {otp.map((d, i) => (
                    <input key={i} id={`sotp-${i}`} type="text" inputMode="numeric" maxLength={1}
                      className="otp-input" value={d}
                      style={d ? {borderColor:'var(--gold)', color:'var(--gold-lt)'} : {}}
                      onChange={e => handleOTPChange(i, e.target.value)}
                      onKeyDown={e => e.key === 'Backspace' && !d && i > 0 && document.getElementById(`sotp-${i-1}`)?.focus()} />
                  ))}
                </div>

                <button type="submit" disabled={verifying || otp.join('').length !== 6}
                  className="btn-gold w-full justify-center py-3.5 mb-4">
                  {verifying
                    ? <><span className="spinner w-4 h-4"/><span>Verifying...</span></>
                    : <>Verify & Continue <ArrowRight size={15}/></>
                  }
                </button>

                <div className="text-center text-sm" style={{color:'var(--muted)'}}>
                  {countdown > 0
                    ? <span>Resend in <strong style={{color:'var(--gold)'}}>{countdown}s</strong></span>
                    : <button type="button" onClick={resendOTP} className="font-medium transition-colors"
                        style={{color:'var(--gold)'}}>Resend OTP</button>
                  }
                </div>
              </form>

              <p className="text-center mt-4">
                <button onClick={() => setStep(STEPS.FORM)} className="text-xs" style={{color:'var(--faint)'}}>
                  ← Change email
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
