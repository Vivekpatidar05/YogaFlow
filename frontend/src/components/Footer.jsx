import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{background:'var(--surface)', borderTop:'1px solid var(--border)'}}>
      <div className="page-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{background:'var(--gold)'}}>
                <span className="font-display font-bold text-xs text-[#0a0a0a]">Y</span>
              </div>
              <span className="font-display font-semibold text-lg text-[#e8e8e8]">Yoga<span style={{color:'var(--gold)'}}>Flow</span></span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{color:'var(--muted)'}}>
              Find your balance, build strength, and deepen your practice with expert instructors. All levels, every day.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4 text-[#e8e8e8]">Quick Links</h4>
            <ul className="space-y-2.5">
              {[['Browse Sessions','/sessions'],['My Bookings','/my-bookings'],['Dashboard','/dashboard'],['Profile','/profile']].map(([l,t])=>(
                <li key={t}><Link to={t} className="text-sm transition-colors" style={{color:'var(--muted)'}}
                  onMouseEnter={e=>e.target.style.color='var(--gold)'} onMouseLeave={e=>e.target.style.color='var(--muted)'}>{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4 text-[#e8e8e8]">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm" style={{color:'var(--muted)'}}><Mail size={13} className="mt-0.5 shrink-0" style={{color:'var(--gold)'}}/><span>hello@yogaflow.in</span></li>
              <li className="flex items-start gap-2 text-sm" style={{color:'var(--muted)'}}><Phone size={13} className="mt-0.5 shrink-0" style={{color:'var(--gold)'}}/><span>+91 98765 43210</span></li>
              <li className="flex items-start gap-2 text-sm" style={{color:'var(--muted)'}}><MapPin size={13} className="mt-0.5 shrink-0" style={{color:'var(--gold)'}}/><span>45 Green Park, Rajpur Road, Dehradun</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3"
          style={{borderTop:'1px solid var(--border)'}}>
          <p className="text-xs" style={{color:'var(--faint)'}}>© {new Date().getFullYear()} YogaFlow. All rights reserved.</p>
          <div className="flex gap-4">
            {['Privacy Policy','Terms of Service','Refund Policy'].map(t=>(
              <a key={t} href="#" className="text-xs transition-colors" style={{color:'var(--faint)'}}
                onMouseEnter={e=>e.target.style.color='var(--muted)'} onMouseLeave={e=>e.target.style.color='var(--faint)'}>{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
