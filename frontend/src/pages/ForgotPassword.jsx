import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, KeyRound, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

const STEPS = { EMAIL: 'email', OTP: 'otp', RESET: 'reset', DONE: 'done' }

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(STEPS.EMAIL)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resetToken, setResetToken] = useState('')
  const [passwords, setPasswords] = useState({ password: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const startCountdown = () => {
    setCountdown(60)
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
  }

  const sendOTP = async (e) => {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) return toast.error('Enter a valid email address.')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      toast.success(data.message)
      setStep(STEPS.OTP)
      startCountdown()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.')
    } finally { setLoading(false) }
  }

  const handleOTPChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[idx] = val; setOtp(next)
    if (val && idx < 5) document.getElementById(`fp-${idx + 1}`)?.focus()
    if (!val && idx > 0) document.getElementById(`fp-${idx - 1}`)?.focus()
  }

  const handleOTPPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) { setOtp(text.split('')); e.preventDefault() }
  }

  const verifyOTP = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) return toast.error('Enter the complete 6-digit OTP.')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code })
      setResetToken(data.resetToken)
      setStep(STEPS.RESET)
      toast.success('OTP verified!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP.')
    } finally { setLoading(false) }
  }

  const resetPassword = async (e) => {
    e.preventDefault()
    if (passwords.password.length < 8) return toast.error('Password must be at least 8 characters.')
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwords.password))
      return toast.error('Password needs uppercase, lowercase, and a number.')
    if (passwords.password !== passwords.confirm) return toast.error('Passwords do not match.')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        resetToken, password: passwords.password, confirmPassword: passwords.confirm
      })
      setStep(STEPS.DONE)
      toast.success('Password reset successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Please request a new OTP.')
    } finally { setLoading(false) }
  }

  const stepIndex = [STEPS.EMAIL, STEPS.OTP, STEPS.RESET].indexOf(step)

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="card p-8 md:p-10">

          {/* Progress */}
          <div className="flex justify-center gap-2 mb-8">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === stepIndex ? 32 : 16,
                  background: i <= stepIndex ? 'var(--gold)' : 'var(--border2)'
                }} />
            ))}
          </div>

          {/* Step 1: Email */}
          {step === STEPS.EMAIL && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  <Mail size={24} style={{ color: 'var(--gold)' }} />
                </div>
                <h1 className="font-display text-2xl font-semibold text-[#e8e8e8] mb-2">Forgot Password?</h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Enter your email and we'll send a 6-digit OTP.
                </p>
              </div>
              <form onSubmit={sendOTP} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <input type="email" className="input-field" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                </div>
                <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3.5">
                  {loading
                    ? <><span className="spinner w-4 h-4" /><span>Sending…</span></>
                    : <><Mail size={15} /> Send OTP</>
                  }
                </button>
              </form>
              <p className="text-center mt-5">
                <Link to="/login" className="text-sm font-medium transition-colors" style={{ color: 'var(--muted)' }}>
                  ← Back to Login
                </Link>
              </p>
            </>
          )}

          {/* Step 2: OTP */}
          {step === STEPS.OTP && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  <KeyRound size={24} style={{ color: 'var(--gold)' }} />
                </div>
                <h1 className="font-display text-2xl font-semibold text-[#e8e8e8] mb-2">Enter OTP</h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Sent to <strong className="text-[#e8e8e8]">{email}</strong>
                </p>
              </div>
              <form onSubmit={verifyOTP}>
                <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOTPPaste}>
                  {otp.map((d, i) => (
                    <input key={i} id={`fp-${i}`} type="text" inputMode="numeric" maxLength={1}
                      className="otp-input" value={d}
                      style={d ? { borderColor: 'var(--gold)', color: 'var(--gold-lt)' } : {}}
                      onChange={e => handleOTPChange(i, e.target.value)}
                      onKeyDown={e => e.key === 'Backspace' && !d && i > 0 && document.getElementById(`fp-${i - 1}`)?.focus()} />
                  ))}
                </div>
                <button type="submit" disabled={loading || otp.join('').length !== 6}
                  className="btn-gold w-full justify-center py-3.5 mb-4">
                  {loading
                    ? <><span className="spinner w-4 h-4" /><span>Verifying…</span></>
                    : 'Verify OTP'
                  }
                </button>
                <div className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                  {countdown > 0
                    ? <span>Resend in <strong style={{ color: 'var(--gold)' }}>{countdown}s</strong></span>
                    : <button type="button" onClick={sendOTP} className="font-medium" style={{ color: 'var(--gold)' }}>Resend OTP</button>
                  }
                </div>
              </form>
              <p className="text-center mt-4">
                <button onClick={() => setStep(STEPS.EMAIL)} className="text-xs" style={{ color: 'var(--faint)' }}>
                  ← Change email
                </button>
              </p>
            </>
          )}

          {/* Step 3: New password */}
          {step === STEPS.RESET && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  <ShieldCheck size={24} style={{ color: 'var(--gold)' }} />
                </div>
                <h1 className="font-display text-2xl font-semibold text-[#e8e8e8] mb-2">New Password</h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Create a strong password for your account.</p>
              </div>
              <form onSubmit={resetPassword} className="space-y-4">
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input type={show ? 'text' : 'password'} className="input-field pr-10"
                      placeholder="Min 8 chars, uppercase + number"
                      value={passwords.password} onChange={e => setPasswords(p => ({ ...p, password: e.target.value }))} />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}>
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" className="input-field"
                    placeholder="Repeat new password"
                    value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
                </div>
                <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3.5">
                  {loading
                    ? <><span className="spinner w-4 h-4" /><span>Resetting…</span></>
                    : 'Reset Password'
                  }
                </button>
              </form>
            </>
          )}

          {/* Done */}
          {step === STEPS.DONE && (
            <div className="text-center py-4">
              <div className="text-5xl mb-5">🎉</div>
              <h1 className="font-display text-2xl font-semibold text-[#e8e8e8] mb-2">Password Reset!</h1>
              <p className="text-sm mb-7" style={{ color: 'var(--muted)' }}>
                Your password has been reset. Sign in with your new password.
              </p>
              <button onClick={() => navigate('/login')} className="btn-gold w-full justify-center py-3.5">
                Go to Login <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
