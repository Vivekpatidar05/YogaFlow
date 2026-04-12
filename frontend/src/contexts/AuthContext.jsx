import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [initialized, setInitialized] = useState(false)

  // ── Boot: restore session from stored token ────────────────────────────────
  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setLoading(false)
        setInitialized(true)
        return
      }
      try {
        const { data } = await api.get('/auth/me')
        setUser(data.user)
      } catch {
        // Token invalid / expired — clear storage
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }
    boot()
  }, [])

  // ── Store tokens + set user in one place ──────────────────────────────────
  const _setSession = useCallback((accessToken, refreshToken, userData) => {
    localStorage.setItem('accessToken',  accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setUser(userData)
  }, [])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    _setSession(data.accessToken, data.refreshToken, data.user)
    return data
  }, [_setSession])

  // ── Register (sends OTP — does NOT log the user in yet) ───────────────────
  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData)
    return data   // { success, message, needsVerification, email }
  }, [])

  // ── Verify email OTP → logs user in immediately (NO page reload needed) ───
  const verifyEmailAndLogin = useCallback(async (email, otp) => {
    const { data } = await api.post('/auth/verify-email', { email, otp })
    _setSession(data.accessToken, data.refreshToken, data.user)
    return data
  }, [_setSession])

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const resendVerification = useCallback(async (email) => {
    const { data } = await api.post('/auth/resend-verification', { email })
    return data
  }, [])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const rt = localStorage.getItem('refreshToken')
      if (rt) await api.post('/auth/logout', { refreshToken: rt })
    } catch {}
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  // ── Update local user state (after profile edits) ─────────────────────────
  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }, [])

  // ── Refresh user from server ───────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch {}
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      initialized,
      isAuthenticated:  !!user,
      isAdmin:          user?.role === 'admin',
      isInstructor:     user?.role === 'instructor',
      // Auth actions
      login,
      register,
      verifyEmailAndLogin,
      resendVerification,
      logout,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
