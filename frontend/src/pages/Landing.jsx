import { Link } from 'react-router-dom'
import { ArrowRight, Star, CheckCircle2, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/axios'
import SessionCard from '../components/SessionCard'

const STATS = [
  { value: '2,400+', label: 'Active Members' },
  { value: '42',     label: 'Sessions / Week' },
  { value: '8',      label: 'Instructors' },
  { value: '4.9★',  label: 'Avg. Rating' },
]

const STEPS = [
  { n: '01', title: 'Create Account', desc: 'Sign up free in 60 seconds. Email verification included.' },
  { n: '02', title: 'Browse & Choose', desc: 'Filter by style, level, instructor, or schedule.' },
  { n: '03', title: 'Book & Receive', desc: 'Instant confirmation email with all session details.' },
]

const TESTIMONIALS = [
  { name: 'Anjali K.', role: 'Member since 2023', rating: 5, text: 'YogaFlow transformed my mornings. The booking system is seamless and the instructors are world-class.' },
  { name: 'Rohan M.', role: 'Beginner Student', rating: 5, text: "The class descriptions and level tags made it so easy to find the right session as a complete beginner." },
  { name: 'Divya S.', role: 'Advanced Practitioner', rating: 5, text: 'The Ashtanga series is exactly what I needed. Reminder emails keep me accountable every week.' },
]

const FEATURES = [
  { icon: '◈', title: 'Real-time Availability', desc: 'See live spot counts. Book before sessions fill up.' },
  { icon: '◉', title: 'Email Confirmations', desc: 'Full booking details, location, and what to bring — instantly.' },
  { icon: '◎', title: 'Smart Reminders', desc: 'Automatic 24-hour reminder before every session.' },
  { icon: '◈', title: 'Free Cancellations', desc: 'Cancel up to 2 hours before for a full refund.' },
]

export default function Landing() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sessions?limit=3').then(r => setSessions(r.data.sessions)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="pt-16 bg-base">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden">
        {/* Background image overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1800&auto=format&q=80"
            alt=""
            className="w-full h-full object-cover"
            style={{opacity: 0.12}}
          />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.06) 0%, transparent 70%), linear-gradient(180deg, #0a0a0a 0%, transparent 30%, transparent 70%, #0a0a0a 100%)'
          }} />
        </div>

        {/* Decorative gold orb */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)'}} />

        <div className="page-container relative z-10 py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8 border"
              style={{background:'rgba(201,168,76,0.08)', borderColor:'rgba(201,168,76,0.2)', color:'var(--gold)'}}>
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse-gold" />
              Dehradun's Premier Yoga Studio
            </div>

            <h1 className="font-display text-6xl md:text-8xl font-normal text-[#e8e8e8] leading-[1.05] mb-6">
              Find Your
              <span className="block italic text-gradient-gold">Balance.</span>
            </h1>

            <p className="text-lg text-[#777] leading-relaxed mb-10 max-w-xl">
              Book expert-led yoga sessions online. Hatha, Vinyasa, Yin, Kundalini and more —
              every level, seven days a week.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link to="/sessions"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
                style={{background:'var(--gold)', color:'#0a0a0a'}}>
                Browse Sessions <ArrowRight size={16}/>
              </Link>
              <Link to="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm border transition-all"
                style={{border:'1px solid var(--border2)', color:'var(--text)'}}>
                Create Free Account
              </Link>
            </div>

            <div className="flex flex-wrap gap-5">
              {['No booking fees', 'Free cancellation', 'Email confirmations', 'All skill levels'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-xs" style={{color:'#555'}}>
                  <CheckCircle2 size={12} style={{color:'var(--gold)'}} /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="border-y" style={{borderColor:'var(--border)', background:'var(--surface)'}}>
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-display text-3xl font-semibold text-gradient-gold mb-1">{value}</div>
                <div className="text-xs uppercase tracking-widest" style={{color:'var(--muted)'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sessions ──────────────────────────────────────────── */}
      <section className="py-24">
        <div className="page-container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="section-eyebrow mb-3">What We Offer</p>
              <h2 className="font-display text-4xl md:text-5xl font-normal text-[#e8e8e8]">
                Popular Sessions
              </h2>
            </div>
            <Link to="/sessions"
              className="hidden md:flex items-center gap-1 text-sm font-medium transition-colors"
              style={{color:'var(--muted)'}}>
              View all <ChevronRight size={14}/>
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="skeleton h-80" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {sessions.map(s => <SessionCard key={s._id} session={s}/>)}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/sessions" className="btn-outline gap-2">
              View All Sessions <ArrowRight size={15}/>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="py-24 border-t" style={{borderColor:'var(--border)', background:'var(--surface)'}}>
        <div className="page-container">
          <div className="text-center mb-16">
            <p className="section-eyebrow mb-3">Simple Process</p>
            <h2 className="font-display text-4xl font-normal text-[#e8e8e8]">Book in 3 Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative">
                <div className="font-display text-8xl font-bold leading-none mb-4 select-none"
                  style={{color:'rgba(201,168,76,0.08)'}}>
                  {n}
                </div>
                <div className="w-8 h-px mb-4" style={{background:'var(--gold)'}} />
                <h3 className="font-display text-xl font-semibold text-[#e8e8e8] mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{color:'var(--muted)'}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-24">
        <div className="page-container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-eyebrow mb-4">Why YogaFlow</p>
              <h2 className="font-display text-4xl font-normal text-[#e8e8e8] mb-8 leading-snug">
                Everything You Need<br />
                <em className="font-normal italic" style={{color:'var(--gold)'}}>in One Place</em>
              </h2>
              <div className="space-y-6">
                {FEATURES.map(({ icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="text-xl shrink-0 mt-0.5" style={{color:'var(--gold)'}}>{icon}</div>
                    <div>
                      <h4 className="font-medium text-[#e8e8e8] mb-1 text-sm">{title}</h4>
                      <p className="text-sm leading-relaxed" style={{color:'var(--muted)'}}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden">
                <img src="https://images.unsplash.com/photo-1545389336-cf090694435e?w=700&auto=format&q=80"
                  alt="Yoga session" className="w-full h-full object-cover" style={{opacity:0.7}} />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-2xl border p-4 flex items-center gap-3"
                style={{background:'var(--surface2)', borderColor:'var(--border2)'}}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{background:'rgba(201,168,76,0.15)', color:'var(--gold)'}}>✓</div>
                <div>
                  <p className="text-xs font-semibold text-[#e8e8e8]">Booking Confirmed!</p>
                  <p className="text-xs" style={{color:'var(--muted)'}}>Check your inbox</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="py-24 border-t" style={{borderColor:'var(--border)', background:'var(--surface)'}}>
        <div className="page-container">
          <div className="text-center mb-12">
            <p className="section-eyebrow mb-3">Community</p>
            <h2 className="font-display text-4xl font-normal text-[#e8e8e8]">What Students Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, rating, text }) => (
              <div key={name} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(rating)].map((_, i) => <Star key={i} size={13} style={{fill:'var(--gold)', color:'var(--gold)'}} />)}
                </div>
                <p className="text-sm leading-relaxed mb-5 italic" style={{color:'#999'}}>"{text}"</p>
                <div>
                  <p className="text-sm font-medium text-[#e8e8e8]">{name}</p>
                  <p className="text-xs" style={{color:'var(--muted)'}}>{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="page-container">
          <div className="relative rounded-3xl overflow-hidden border p-16 text-center"
            style={{background:'var(--surface2)', borderColor:'rgba(201,168,76,0.2)'}}>
            <div className="absolute inset-0 pointer-events-none"
              style={{background:'radial-gradient(ellipse at 50% 100%, rgba(201,168,76,0.06) 0%, transparent 70%)'}} />
            <p className="section-eyebrow mb-4 relative z-10">Ready?</p>
            <h2 className="font-display text-4xl md:text-5xl font-normal text-[#e8e8e8] mb-4 relative z-10">
              Begin Your Journey Today
            </h2>
            <p className="mb-8 max-w-md mx-auto text-sm relative z-10" style={{color:'var(--muted)'}}>
              Join thousands of practitioners. Your first session is waiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
              <Link to="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
                style={{background:'var(--gold)', color:'#0a0a0a'}}>
                Create Free Account <ArrowRight size={15}/>
              </Link>
              <Link to="/sessions"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm border transition-all"
                style={{border:'1px solid var(--border2)', color:'var(--text)'}}>
                Browse Sessions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
