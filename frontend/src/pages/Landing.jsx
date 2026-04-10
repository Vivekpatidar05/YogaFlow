import { Link } from 'react-router-dom'
import { ArrowRight, Star, CheckCircle2, ChevronRight, Leaf } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/axios'
import SessionCard from '../components/SessionCard'

const STATS  = [{ v: '2,400+', l: 'Members' }, { v: '42', l: 'Sessions/Week' }, { v: '8', l: 'Instructors' }, { v: '4.9★', l: 'Avg Rating' }]
const STEPS  = [
  { n:'01', t:'Create Account',    d:'Sign up free in 60 seconds. Email verification included.' },
  { n:'02', t:'Browse & Choose',   d:'Filter by style, instructor, level, or date.' },
  { n:'03', t:'Book & Confirm',    d:'Instant confirmation + email with all details.' },
]
const FEATS  = [
  { e:'🗓', t:'Live availability',      d:'Real-time spot counts — book before it fills up.' },
  { e:'📧', t:'Instant confirmation',   d:'Full booking details sent to your inbox immediately.' },
  { e:'⏰', t:'24h reminders',          d:'Automatic reminder email the day before your session.' },
  { e:'↩️', t:'Free cancellations',     d:'Cancel up to 2 hours before for a full refund.' },
]
const TESTI  = [
  { n:'Anjali K.',  r:'Member since 2023',    s:5, t:'YogaFlow completely transformed my mornings. Booking is seamless and instructors are world-class.' },
  { n:'Rohan M.',   r:'Beginner Student',     s:5, t:'Level tags and instructor bios made it so easy to find the right session as a total beginner.' },
  { n:'Divya S.',   r:'Advanced Practitioner',s:5, t:'The Ashtanga series is exactly what I needed. Reminder emails keep me accountable every week.' },
]

export default function Landing() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sessions?limit=3').then(r => setSessions(r.data.sessions)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="pt-16" style={{ background: 'var(--bg)' }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1800&auto=format&q=80"
            alt="" className="w-full h-full object-cover" style={{ opacity: 0.18 }} />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(240,247,236,0.97) 0%, rgba(240,247,236,0.85) 60%, rgba(240,247,236,0.7) 100%)' }} />
        </div>

        {/* Decorative shapes */}
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(circle, #B5D98A 0%, transparent 70%)', transform: 'translateX(30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, #C4502A 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="page-container relative z-10 py-24">
          <div className="max-w-2xl">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border"
              style={{ background: '#EAF4E0', borderColor: '#B5D98A', color: 'var(--primary)' }}>
              <Leaf size={12} /> Dehradun's Premier Yoga Studio
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-normal leading-[1.08] mb-6"
              style={{ color: 'var(--text)' }}>
              Find Your<br />
              <em className="italic" style={{ color: 'var(--primary)' }}>Balance.</em>
            </h1>

            <p className="text-lg leading-relaxed mb-8 max-w-md" style={{ color: 'var(--muted)' }}>
              Book expert-led yoga sessions online. Hatha, Vinyasa, Yin, Kundalini and more —
              every level, seven days a week.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link to="/sessions" className="btn-primary px-8 py-4 text-base">
                Browse Sessions <ArrowRight size={18} />
              </Link>
              <Link to="/signup" className="btn-outline px-8 py-4 text-base">
                Create Free Account
              </Link>
            </div>

            <div className="flex flex-wrap gap-5">
              {['No booking fees', 'Free cancellation', 'Email confirmations', 'All skill levels'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--muted)' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--primary)' }} /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--primary)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="page-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ v, l }) => (
              <div key={l} className="text-center">
                <div className="font-display text-3xl font-semibold text-white mb-0.5">{v}</div>
                <div className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Sessions ─────────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--bg)' }}>
        <div className="page-container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="eyebrow mb-3">What We Offer</p>
              <h2 className="font-display text-4xl font-semibold" style={{ color: 'var(--text)' }}>Popular Sessions</h2>
            </div>
            <Link to="/sessions" className="hidden md:flex items-center gap-1 text-sm font-medium hover:underline"
              style={{ color: 'var(--primary)' }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="skeleton h-96" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map(s => <SessionCard key={s._id} session={s} />)}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/sessions" className="btn-outline px-8">View All Sessions <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--surface2)' }}>
        <div className="page-container">
          <div className="text-center mb-16">
            <p className="eyebrow mb-3">Simple Process</p>
            <h2 className="font-display text-4xl font-semibold" style={{ color: 'var(--text)' }}>Book in 3 Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-0.5" style={{ background: 'var(--border2)' }} />
            {STEPS.map(({ n, t, d }) => (
              <div key={n} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold font-display relative z-10"
                  style={{ background: '#EAF4E0', color: 'var(--primary)', border: '2px solid #B5D98A' }}>
                  {n}
                </div>
                <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>{t}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--bg)' }}>
        <div className="page-container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="eyebrow mb-4">Why YogaFlow</p>
              <h2 className="font-display text-4xl font-semibold mb-8 leading-snug" style={{ color: 'var(--text)' }}>
                Everything You Need,<br />
                <em className="italic font-normal" style={{ color: 'var(--primary)' }}>in One Place</em>
              </h2>
              <div className="space-y-5">
                {FEATS.map(({ e, t, d }) => (
                  <div key={t} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: '#EAF4E0' }}>
                      {e}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{t}</h4>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-xl">
                <img src="https://images.unsplash.com/photo-1545389336-cf090694435e?w=700&auto=format&q=80"
                  alt="Yoga session" className="w-full h-full object-cover" />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-4 -left-4 card shadow-card-hover px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ background: '#EAF4E0' }}>✓</div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Booking Confirmed!</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Check your inbox</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--surface2)' }}>
        <div className="page-container">
          <div className="text-center mb-12">
            <p className="eyebrow mb-3">Community</p>
            <h2 className="font-display text-4xl font-semibold" style={{ color: 'var(--text)' }}>What Students Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTI.map(({ n, r, s, t }) => (
              <div key={n} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(s)].map((_, i) => <Star key={i} size={14} style={{ fill: '#F59E0B', color: '#F59E0B' }} />)}
                </div>
                <p className="text-sm leading-relaxed italic mb-5" style={{ color: 'var(--muted)' }}>"{t}"</p>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{n}</p>
                  <p className="text-xs" style={{ color: 'var(--faint)' }}>{r}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: 'var(--bg)' }}>
        <div className="page-container">
          <div className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center"
            style={{ background: 'var(--primary)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Ready to Begin?
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-4">
              Start Your Journey Today
            </h2>
            <p className="mb-8 max-w-sm mx-auto text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Join thousands of practitioners. Your first session is waiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm bg-white transition-all hover:-translate-y-0.5"
                style={{ color: 'var(--primary)' }}>
                Create Free Account <ArrowRight size={16} />
              </Link>
              <Link to="/sessions"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm border-2 border-white/30 text-white transition-all hover:bg-white/10">
                Browse Sessions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
