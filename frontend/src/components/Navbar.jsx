import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, LogOut, LayoutDashboard, CalendarDays, Settings, Shield, ChevronDown, Leaf } from 'lucide-react'

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
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
    { to: '/sessions',    label: 'Browse Sessions' },
    { to: '/my-bookings', label: 'My Bookings',    auth: true },
    { to: '/dashboard',   label: 'Dashboard',      auth: true },
  ]

  const navBg = scrolled
    ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E8E2D9]'
    : 'bg-white/80 backdrop-blur-sm'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="page-container">
        <div className="flex items-center justify-between h-16 md:h-[68px]">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--primary)' }}>
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-display font-semibold text-xl" style={{ color: 'var(--text)' }}>
              Yoga<span style={{ color: 'var(--primary)' }}>Flow</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              if (link.auth && !isAuthenticated) return null
              const active = location.pathname.startsWith(link.to) && link.to !== '/'
              return (
                <Link key={link.to} to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'text-primary bg-primary-50'
                      : 'text-muted hover:text-primary hover:bg-primary-50/60'
                  }`}
                  style={{ color: active ? 'var(--primary)' : 'var(--muted)', background: active ? 'rgba(44,95,46,0.08)' : '' }}>
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative" ref={dropRef}>
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all hover:bg-[#F0F7EC]"
                  style={{ color: 'var(--text)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{ background: 'var(--primary)' }}>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium leading-none" style={{ color: 'var(--text)' }}>{user?.firstName}</p>
                  </div>
                  <ChevronDown size={14} className="transition-transform" style={{
                    color: 'var(--muted)', transform: profileOpen ? 'rotate(180deg)' : 'none'
                  }} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 card shadow-card-hover z-50 py-1">
                    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="text-xs" style={{ color: 'var(--faint)' }}>Signed in as</p>
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.email}</p>
                    </div>
                    <DropItem to="/dashboard"   icon={<LayoutDashboard size={13}/>}>Dashboard</DropItem>
                    <DropItem to="/my-bookings" icon={<CalendarDays size={13}/>}>My Bookings</DropItem>
                    <DropItem to="/profile"     icon={<Settings size={13}/>}>Profile Settings</DropItem>
                    {isAdmin && <DropItem to="/admin" icon={<Shield size={13}/>}>Admin Panel</DropItem>}
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4 }}>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-red-50"
                        style={{ color: '#DC4A3A' }}>
                        <LogOut size={13} /> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Log in</Link>
                <Link to="/signup" className="btn-primary text-sm py-2.5 px-5">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-[#F0F7EC]"
            style={{ color: 'var(--text)' }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <div className="page-container py-4 space-y-1">
            {navLinks.map(link => {
              if (link.auth && !isAuthenticated) return null
              return (
                <Link key={link.to} to={link.to}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-[#F0F7EC]"
                  style={{ color: 'var(--muted)' }}>
                  {link.label}
                </Link>
              )
            })}
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="flex items-center px-4 py-3 rounded-xl text-sm transition-colors hover:bg-[#F0F7EC]" style={{ color: 'var(--muted)' }}>Profile Settings</Link>
                {isAdmin && <Link to="/admin" className="flex items-center px-4 py-3 rounded-xl text-sm transition-colors hover:bg-[#F0F7EC]" style={{ color: 'var(--muted)' }}>Admin Panel</Link>}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}>
                  <button onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ color: '#DC4A3A' }}>
                    <LogOut size={14} className="mr-2" /> Log out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login"  className="btn-outline w-full justify-center text-sm py-3">Log in</Link>
                <Link to="/signup" className="btn-primary w-full justify-center text-sm py-3">Create Free Account</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

const DropItem = ({ to, icon, children }) => (
  <Link to={to}
    className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-[#F0F7EC]"
    style={{ color: 'var(--muted)' }}>
    <span style={{ color: 'var(--primary)' }}>{icon}</span>
    <span>{children}</span>
  </Link>
)
