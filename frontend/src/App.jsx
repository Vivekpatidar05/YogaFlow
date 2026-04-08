import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Sessions from './pages/Sessions'
import SessionDetail from './pages/SessionDetail'
import BookSession from './pages/BookSession'
import MyBookings from './pages/MyBookings'
import BookingDetail from './pages/BookingDetail'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import LoadingSpinner from './components/LoadingSpinner'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

const PublicOnly = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

const Layout = ({ children, noFooter = false }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    {!noFooter && <Footer />}
  </div>
)

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route path="/sessions" element={<Layout><Sessions /></Layout>} />
      <Route path="/sessions/:id" element={<Layout><SessionDetail /></Layout>} />
      
      {/* Auth — public only */}
      <Route path="/login" element={<PublicOnly><Layout noFooter><Login /></Layout></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Layout noFooter><Signup /></Layout></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><Layout noFooter><ForgotPassword /></Layout></PublicOnly>} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/book/:id" element={<ProtectedRoute><Layout><BookSession /></Layout></ProtectedRoute>} />
      <Route path="/my-bookings" element={<ProtectedRoute><Layout><MyBookings /></Layout></ProtectedRoute>} />
      <Route path="/my-bookings/:id" element={<ProtectedRoute><Layout><BookingDetail /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><Layout><Admin /></Layout></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
