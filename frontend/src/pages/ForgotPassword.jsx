import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, KeyRound, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep]       = useState('email') // email | otp | reset | done
  const [email, setEmail]     = useState('')
  const [otp, setOtp]         = useState(['','','','','',''])
  const [resetToken, setRT]   = useState('')
  const [passwords, setPw]    = useState({ password:'', confirm:'' })
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCD]    = useState(0)

  const startCd = () => {
    setCD(60)
    const t = setInterval(() => setCD(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
  }

  const sendOTP = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) return toast.error('Enter a valid email.')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      toast.success(data.message)
      setStep('otp'); startCd()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send OTP.') }
    finally { setLoading(false) }
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) document.getElementById(`fp-${i + 1}`)?.focus()
    if (!val && i > 0) document.getElementById(`fp-${i - 1}`)?.focus()
  }
  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) { setOtp(text.split('')); e.preventDefault() }
  }

  const verifyOTP = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) return toast.error('Enter the 6-digit OTP.')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code })
      setRT(data.resetToken); setStep('reset'); toast.success('OTP verified!')
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP.') }
    finally { setLoading(false) }
  }

  const resetPassword = async (e) => {
    e.preventDefault()
    if (passwords.password.length < 8) return toast.error('Password must be at least 8 characters.')
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwords.password))
      return toast.error('Password needs uppercase, lowercase, and a number.')
    if (passwords.password !== passwords.confirm) return toast.error('Passwords do not match.')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { resetToken, password: passwords.password, confirmPassword: passwords.confirm })
      setStep('done'); toast.success('Password reset successfully!')
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed. Request a new OTP.') }
    finally { setLoading(false) }
  }

  const steps = ['email', 'otp', 'reset']
  const stepIdx = steps.indexOf(step)

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="card p-8 md:p-10 shadow-card">

          {/* Progress bar */}
          {step !== 'done' && (
            <div className="flex gap-2 mb-8">
              {[0,1,2].map(i => (
                <div key={i} className="h-1.5 rounded-full transition-all duration-300 flex-1"
                  style={{ background: i <= stepIdx ? 'var(--primary)' : 'var(--border)' }} />
              ))}
            </div>
          )}

          {/* Step: email */}
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#EAF4E0', border: '2px solid #B5D98A' }}>
                  <Mail size={22} style={{ color: 'var(--primary)' }} />
                </div>
                <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>Forgot Password?</h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Enter your email and we'll send a 6-digit OTP.</p>
              </div>
              <form onSubmit={sendOTP} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <input type="email" className="input-field" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
                  {loading ? <><span className="spinner w-4 h-4" />Sending…</> : <><Mail size={15} />Send OTP</>}
                </button>
              </form>
              <p className="text-center mt-5">
                <Link to="/login" className="text-sm font-medium" style={{ color: 'var(--muted)' }}>← Back to Login</Link>
              </p>
            </>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#EAF4E0', border: '2px solid #B5D98A' }}>
                  <KeyRound size={22} style={{ color: 'var(--primary)' }} />
                </div>
                <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>Enter OTP</h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Sent to <strong style={{ color: 'var(--text)' }}>{email}</strong>
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--faint)' }}>Check spam folder if not received.</p>
              </div>
              <form onSubmit={verifyOTP}>
                <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
                  {otp.map((d, i) => (
                    <input key={i} id={`fp-${i}`} type="text" inputMode="numeric" maxLength={1}
                      className="otp-box" value={d}
                      style={d ? { borderColor:'var(--primary)', color:'var(--primary)', background:'#F0F7EC' } : {}}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => e.key==='Backspace' && !d && i > 0 && document.getElementById(`fp-${i-1}`)?.focus()} />
                  ))}
                </div>
                <button type="submit" disabled={loading || otp.join('').length !== 6}
                  className="btn-primary w-full justify-center py-3.5 mb-4">
                  {loading ? <><span className="spinner w-4 h-4" />Verifying…</> : 'Verify OTP'}
                </button>
                <div className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                  {countdown > 0
                    ? <span>Resend in <strong style={{ color:'var(--primary)' }}>{countdown}s</strong></span>
                    : <button type="button" onClick={sendOTP} className="font-semibold" style={{ color:'var(--primary)' }}>Resend OTP</button>
                  }
                </div>
              </form>
              <p className="text-center mt-4">
                <button onClick={() => setStep('email')} className="text-xs" style={{ color:'var(--faint)' }}>← Change email</button>
              </p>
            </>
          )}

          {/* Step: reset */}
          {step === 'reset' && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#EAF4E0', border: '2px solid #B5D98A' }}>
                  <ShieldCheck size={22} style={{ color: 'var(--primary)' }} />
                </div>
                <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>New Password</h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Create a strong password for your account.</p>
              </div>
              <form onSubmit={resetPassword} className="space-y-4">
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input type={show ? 'text' : 'password'} className="input-field pr-11"
                      placeholder="Min 8 chars, uppercase + number"
                      value={passwords.password} onChange={e => setPw(p => ({ ...p, password: e.target.value }))} />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--faint)' }}>
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" className="input-field" placeholder="Repeat new password"
                    value={passwords.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
                  {loading ? <><span className="spinner w-4 h-4" />Resetting…</> : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-5">🎉</div>
              <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>Password Reset!</h1>
              <p className="text-sm mb-7" style={{ color: 'var(--muted)' }}>
                Your password has been reset. Please sign in with your new password.
              </p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center py-3.5">
                Go to Login <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
