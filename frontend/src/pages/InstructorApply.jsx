import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import ImageUpload from '../components/ImageUpload'

const SPECIALTIES = ['Hatha','Vinyasa','Yin','Kundalini','Ashtanga','Restorative','Prenatal','Power Yoga','Hot Yoga','Meditation','Pranayama','Therapeutic Yoga']

export default function InstructorApply() {
  const { user, refreshUser } = useAuth()
  const navigate  = useNavigate()
  const [application, setApplication] = useState(null)
  const [loading,      setLoading]     = useState(true)
  const [submitting,   setSubmitting]  = useState(false)
  const [form, setForm] = useState({
    bio: '', specialties: [], experience: '', certifications: '',
    profilePhoto: '', instagram: '', website: '', youtube: '',
  })

  useEffect(() => {
    api.get('/instructor/application')
      .then(r => setApplication(r.data.application))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user?.role === 'instructor') navigate('/instructor/dashboard', { replace: true })
  }, [user])

  const toggleSpecialty = (s) => {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter(x => x !== s)
        : [...f.specialties, s],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.bio) return toast.error('Bio is required.')
    if (form.specialties.length === 0) return toast.error('Select at least one specialty.')
    if (!form.experience) return toast.error('Experience is required.')

    setSubmitting(true)
    try {
      await api.post('/instructor/apply', {
        bio:            form.bio,
        specialties:    form.specialties,
        experience:     form.experience,
        certifications: form.certifications.split(',').map(c => c.trim()).filter(Boolean),
        profilePhoto:   form.profilePhoto,
        socialLinks: {
          instagram: form.instagram,
          website:   form.website,
          youtube:   form.youtube,
        },
      })
      toast.success('Application submitted! You will be notified by the admin.')
      await refreshUser()
      const { data } = await api.get('/instructor/application')
      setApplication(data.application)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="pt-20 min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="spinner w-8 h-8" />
    </div>
  )

  // Show application status if already applied
  if (application) return (
    <div className="pt-20 pb-16 min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="page-container max-w-xl">
        <div className="card p-10 text-center shadow-card mt-8">
          {application.status === 'pending' && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: '#FEF3E0', border: '2px solid #FACB7A' }}>
                <Clock size={28} style={{ color: '#8C5C10' }} />
              </div>
              <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
                Application Under Review
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                Your application has been submitted and is being reviewed by our admin team. You'll receive a notification once a decision is made.
              </p>
            </>
          )}
          {application.status === 'approved' && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: '#EAF4E0', border: '2px solid #B5D98A' }}>
                <CheckCircle2 size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
                Application Approved! 🎉
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                Welcome to the YogaFlow instructor team! You can now create and manage sessions.
              </p>
              <Link to="/instructor/dashboard" className="btn-primary px-8 py-3">
                Go to Instructor Dashboard →
              </Link>
            </>
          )}
          {application.status === 'rejected' && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: '#FDEEE8', border: '2px solid #F5C4B3' }}>
                <XCircle size={28} style={{ color: 'var(--terra)' }} />
              </div>
              <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
                Application Not Approved
              </h1>
              {application.adminNote && (
                <p className="text-sm mb-4 p-3 rounded-xl" style={{ background: '#FDEEE8', color: '#8C3418' }}>
                  {application.adminNote}
                </p>
              )}
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                You can update your application and reapply.
              </p>
              <button onClick={() => setApplication(null)} className="btn-primary px-8 py-3">
                Reapply
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="pt-20 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="page-container max-w-2xl">
        <div className="py-6 mb-6">
          <p className="eyebrow mb-2">Become an Instructor</p>
          <h1 className="font-display text-3xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
            Apply to Teach at YogaFlow
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Share your expertise with our community. Applications are reviewed within 48 hours.
          </p>
        </div>

        {/* What you get */}
        <div className="card p-5 mb-8 shadow-card">
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text)' }}>As an instructor, you can:</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Create & manage your sessions',
              'View student bookings',
              'Check in students',
              'Build your instructor profile',
              'Access your earnings dashboard',
              'Get notified of new bookings',
            ].map(t => (
              <div key={t} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                <CheckCircle2 size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                {t}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile photo */}
          <div className="card p-5 shadow-card">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Profile Photo</h3>
            <div className="flex items-center gap-5">
              <ImageUpload
                value={form.profilePhoto}
                onChange={url => setForm(f => ({ ...f, profilePhoto: url }))}
                type="instructor"
                label=""
                aspectRatio="square"
                className="w-32 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Upload your photo</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Max 5MB · JPEG, PNG or WebP</p>
                <p className="text-xs mt-2" style={{ color: 'var(--faint)' }}>Or enter a URL below:</p>
                <input className="input-field text-xs mt-1" placeholder="https://..."
                  value={form.profilePhoto} onChange={e => setForm(f => ({ ...f, profilePhoto: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="card p-5 shadow-card">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>About You</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Bio *</label>
                <textarea rows={4} className="input-field text-sm resize-none"
                  placeholder="Tell students about your yoga journey, teaching philosophy, and what makes your classes special..."
                  value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} required />
                <p className="text-xs mt-1" style={{ color: 'var(--faint)' }}>{form.bio.length}/1000</p>
              </div>
              <div>
                <label className="label">Teaching Experience *</label>
                <input className="input-field text-sm" placeholder="e.g. 5 years teaching Hatha and Vinyasa in studios and retreats"
                  value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Certifications <span className="normal-case font-normal text-xs" style={{ color: 'var(--faint)' }}>(comma-separated)</span></label>
                <input className="input-field text-sm" placeholder="e.g. RYT-200, RYT-500, Yin Yoga Certificate"
                  value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="card p-5 shadow-card">
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Specialties *</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Select all yoga styles you teach:</p>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(s => (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: form.specialties.includes(s) ? 'var(--primary)' : 'var(--surface2)',
                    color:      form.specialties.includes(s) ? '#fff' : 'var(--muted)',
                    border:     `1px solid ${form.specialties.includes(s) ? 'var(--primary)' : 'var(--border)'}`,
                  }}>
                  {s}
                </button>
              ))}
            </div>
            {form.specialties.length > 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--primary)' }}>
                Selected: {form.specialties.join(', ')}
              </p>
            )}
          </div>

          {/* Social links */}
          <div className="card p-5 shadow-card">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Social Links <span className="text-xs font-normal" style={{ color: 'var(--faint)' }}>(optional)</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[['instagram','Instagram',  '@yourusername'],
                ['website',  'Website',    'https://yourwebsite.com'],
                ['youtube',  'YouTube',    'https://youtube.com/@channel']].map(([k,l,ph]) => (
                <div key={k}>
                  <label className="label">{l}</label>
                  <input className="input-field text-sm" placeholder={ph}
                    value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-4 text-base">
            {submitting
              ? <><span className="spinner w-5 h-5" /> Submitting Application…</>
              : 'Submit Application →'
            }
          </button>

          <p className="text-xs text-center" style={{ color: 'var(--faint)' }}>
            Applications are reviewed within 48 hours. You'll be notified by email and in-app.
          </p>
        </form>
      </div>
    </div>
  )
}
