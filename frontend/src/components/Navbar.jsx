import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, LogOut, LayoutDashboard, CalendarDays, Settings, Shield, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMobileOpen(false); setProfileOpen(false) }, [location])

  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setProfileOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleLogout = async () => { await logout(); navigate('/') }

  const navLinks = [
    { to: '/sessions', label: 'Sessions' },
    { to: '/my-bookings', label: 'My Bookings', auth: true },
    { to: '/dashboard', label: 'Dashboard', auth: true },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#1e1e1e]' : 'bg-transparent'
    }`}>
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'var(--gold)'}}>
              <span className="font-display font-bold text-sm text-[#0a0a0a]">Y</span>
            </div>
            <span className="font-display font-semibold text-lg text-[#e8e8e8]">
              Yoga<span className="text-gold">Flow</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              if (link.auth && !isAuthenticated) return null
              const active = location.pathname === link.to
              return (
                <Link key={link.to} to={link.to}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ color: active ? 'var(--gold)' : 'var(--muted)', background: active ? 'rgba(201,168,76,0.08)' : 'transparent' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--muted)' }}>
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={dropRef}>
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                  style={{background: profileOpen ? 'var(--surface2)' : 'transparent'}}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => { if (!profileOpen) e.currentTarget.style.background = 'transparent' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{background:'var(--gold)', color:'#0a0a0a'}}>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <span className="text-sm font-medium text-[#e8e8e8]">{user?.firstName}</span>
                  <ChevronDown size={13} className={`transition-transform text-[#555]`} style={{transform: profileOpen ? 'rotate(180deg)' : 'none'}} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border py-1 shadow-2xl z-50"
                    style={{background:'var(--surface)', borderColor:'var(--border2)'}}>
                    <div className="px-4 py-2.5 border-b" style={{borderColor:'var(--border)'}}>
                      <p className="text-xs" style={{color:'var(--muted)'}}>Signed in as</p>
                      <p className="text-sm font-medium text-[#e8e8e8] truncate">{user?.email}</p>
                    </div>
                    <DropItem to="/dashboard" icon={<LayoutDashboard size={13}/>}>Dashboard</DropItem>
                    <DropItem to="/my-bookings" icon={<CalendarDays size={13}/>}>My Bookings</DropItem>
                    <DropItem to="/profile" icon={<Settings size={13}/>}>Profile</DropItem>
                    {isAdmin && <DropItem to="/admin" icon={<Shield size={13}/>}>Admin Panel</DropItem>}
                    <div className="border-t mt-1 pt-1" style={{borderColor:'var(--border)'}}>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-red-500/10"
                        style={{color:'#f87171'}}>
                        <LogOut size={13}/> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Log in</Link>
                <Link to="/signup" className="btn-gold text-sm py-2 px-5">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{color:'var(--muted)'}}>
            {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t" style={{background:'var(--surface)', borderColor:'var(--border)'}}>
          <div className="page-container py-4 space-y-1">
            {navLinks.map(link => {
              if (link.auth && !isAuthenticated) return null
              return (
                <Link key={link.to} to={link.to}
                  className="flex items-center px-4 py-2.5 rounded-lg text-sm transition-colors"
                  style={{color:'var(--muted)'}}>
                  {link.label}
                </Link>
              )
            })}
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="flex items-center px-4 py-2.5 rounded-lg text-sm" style={{color:'var(--muted)'}}>Profile</Link>
                {isAdmin && <Link to="/admin" className="flex items-center px-4 py-2.5 rounded-lg text-sm" style={{color:'var(--muted)'}}>Admin</Link>}
                <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 rounded-lg text-sm font-medium" style={{color:'#f87171'}}>
                  <LogOut size={14} className="mr-2"/> Log out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" className="btn-outline w-full justify-center text-sm">Log in</Link>
                <Link to="/signup" className="btn-gold w-full justify-center text-sm">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

const DropItem = ({ to, icon, children }) => (
  <Link to={to} className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors"
    style={{color:'var(--muted)'}}
    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface2)' }}
    onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}>
    <span style={{color:'var(--gold)'}}>{icon}</span>
    {children}
  </Link>
)
