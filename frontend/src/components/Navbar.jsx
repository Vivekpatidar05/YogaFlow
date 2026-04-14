import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, LogOut, LayoutDashboard, CalendarDays, Settings, Shield, ChevronDown, Leaf, GraduationCap } from 'lucide-react'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const isInstructor = user?.role === 'instructor'

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
    { to:'/sessions',              label:'Browse Sessions' },
    { to:'/my-bookings',           label:'My Bookings',     auth: true },
    { to:'/instructor/dashboard',  label:'Instructor',      auth: true, role: 'instructor' },
    { to:'/dashboard',             label:'Dashboard',       auth: true },
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
              style={{ background:'var(--primary)' }}>
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-display font-semibold text-xl" style={{ color:'var(--text)' }}>
              Yoga<span style={{ color:'var(--primary)' }}>Flow</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              if (link.auth && !isAuthenticated) return null
              if (link.role && user?.role !== link.role && user?.role !== 'admin') return null
              const active = location.pathname.startsWith(link.to) && link.to !== '/'
              return (
                <Link key={link.to} to={link.to}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    color:      active ? 'var(--primary)' : 'var(--muted)',
                    background: active ? 'rgba(44,95,46,0.08)' : 'transparent',
                  }}>
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}

            {isAuthenticated ? (
              <div className="relative" ref={dropRef}>
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all hover:bg-[#F0F7EC]"
                  style={{ color:'var(--text)' }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover border"
                      style={{ borderColor:'#B5D98A' }} />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ background:'var(--primary)' }}>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                  )}
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium leading-none" style={{ color:'var(--text)' }}>{user?.firstName}</p>
                  </div>
                  <ChevronDown size={14} className="transition-transform" style={{
                    color:'var(--muted)', transform: profileOpen ? 'rotate(180deg)' : 'none'
                  }} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 card shadow-card-hover z-50 py-1">
                    <div className="px-4 py-2.5" style={{ borderBottom:'1px solid var(--border)' }}>
                      <p className="text-xs" style={{ color:'var(--faint)' }}>Signed in as</p>
                      <p className="text-sm font-semibold truncate" style={{ color:'var(--text)' }}>{user?.email}</p>
                      <span className="badge badge-green text-xs capitalize mt-1">{user?.role}</span>
                    </div>
                    <DropItem to="/dashboard"   icon={<LayoutDashboard size={13}/>}>Dashboard</DropItem>
                    <DropItem to="/my-bookings" icon={<CalendarDays size={13}/>}>My Bookings</DropItem>
                    {(isInstructor || isAdmin) && (
                      <DropItem to="/instructor/dashboard" icon={<GraduationCap size={13}/>}>Instructor Panel</DropItem>
                    )}
                    <DropItem to="/profile" icon={<Settings size={13}/>}>Profile Settings</DropItem>
                    {isAdmin && <DropItem to="/admin" icon={<Shield size={13}/>}>Admin Panel</DropItem>}
                    <div style={{ borderTop:'1px solid var(--border)', marginTop:4, paddingTop:4 }}>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-red-50"
                        style={{ color:'#DC4A3A' }}>
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
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg transition-colors hover:bg-[#F0F7EC]"
              style={{ color:'var(--text)' }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden" style={{ background:'var(--surface)', borderTop:'1px solid var(--border)' }}>
          <div className="page-container py-4 space-y-1">
            {navLinks.map(link => {
              if (link.auth && !isAuthenticated) return null
              if (link.role && user?.role !== link.role && user?.role !== 'admin') return null
              return (
                <Link key={link.to} to={link.to}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-[#F0F7EC]"
                  style={{ color:'var(--muted)' }}>
                  {link.label}
                </Link>
              )
            })}
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="flex items-center px-4 py-3 rounded-xl text-sm transition-colors hover:bg-[#F0F7EC]" style={{ color:'var(--muted)' }}>Profile Settings</Link>
                {isAdmin && <Link to="/admin" className="flex items-center px-4 py-3 rounded-xl text-sm transition-colors hover:bg-[#F0F7EC]" style={{ color:'var(--muted)' }}>Admin Panel</Link>}
                {user?.role === 'user' && (
                  <Link to="/instructor/apply" className="flex items-center px-4 py-3 rounded-xl text-sm transition-colors hover:bg-[#EAF4E0]" style={{ color:'var(--primary)' }}>
                    🧘 Become an Instructor
                  </Link>
                )}
                <div style={{ borderTop:'1px solid var(--border)', marginTop:8, paddingTop:8 }}>
                  <button onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ color:'#DC4A3A' }}>
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
    style={{ color:'var(--muted)' }}>
    <span style={{ color:'var(--primary)' }}>{icon}</span>
    <span>{children}</span>
  </Link>
)
