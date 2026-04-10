import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Leaf } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--primary-dk, #1A3A1C)', color: 'rgba(255,255,255,0.75)' }}>
      <div className="page-container py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <Leaf size={16} className="text-white" />
              </div>
              <span className="font-display font-semibold text-xl text-white">YogaFlow</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Find your balance, build strength, and deepen your practice with expert instructors. All levels, every day.
            </p>
            <div className="flex gap-3 mt-5">
              {['IG','TW','FB'].map(s => (
                <a key={s} href="#"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                  {s}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2.5">
              {[['Browse Sessions', '/sessions'], ['My Bookings', '/my-bookings'], ['Dashboard', '/dashboard'], ['Profile', '/profile']].map(([l, t]) => (
                <li key={t}>
                  <Link to={t} className="text-sm transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.55)' }}>{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-white">Contact</h4>
            <ul className="space-y-2.5">
              {[
                [<Mail size={13}/>,    'hello@yogaflow.in'],
                [<Phone size={13}/>,   '+91 98765 43210'],
                [<MapPin size={13}/>,  '45 Green Park, Rajpur Road, Dehradun'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <span className="mt-0.5 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} YogaFlow. All rights reserved.
          </p>
          <div className="flex gap-4">
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(t => (
              <a key={t} href="#" className="text-xs transition-colors hover:text-white"
                style={{ color: 'rgba(255,255,255,0.3)' }}>{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
