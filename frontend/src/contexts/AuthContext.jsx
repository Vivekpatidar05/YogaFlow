import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { setTokens, clearTokens } from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user,        setUser]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [initialized, setInitialized] = useState(false)

  // ── Boot: restore session from stored token ───────────────────────────────
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

      } catch (err) {
        const status = err.response?.status

        // ── CRITICAL FIX ──────────────────────────────────────────────────────
        // Old code deleted the token on ANY error (network timeouts, 5xx, etc.)
        // That meant: transient network error on boot → token deleted → user
        // appears logged out → every subsequent request gets 401.
        //
        // New code: ONLY delete the token if the server explicitly says it's
        // invalid (401). For network errors or 5xx, keep the token — it's
        // probably still valid, the server just hiccupped.
        // ─────────────────────────────────────────────────────────────────────
        if (status === 401) {
          clearTokens()
        }
        // Any other error: leave the token alone. The user will just appear
        // logged out temporarily and can refresh the page.
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    boot()
  }, [])

  // ── Internal: store session atomically ────────────────────────────────────
  // Uses the module-level setTokens() so the axios interceptor gets the token
  // immediately (before any subsequent request fires), with no async gaps.
  const _applySession = useCallback((accessToken, refreshToken, userData) => {
    setTokens(accessToken, refreshToken)  // in-memory + localStorage
    setUser(userData)
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    _applySession(data.accessToken, data.refreshToken, data.user)
    return data
  }, [_applySession])

  // ── Register (sends OTP — does NOT log user in yet) ───────────────────────
  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData)
    return data
  }, [])

  // ── Verify email OTP → logs user in immediately ───────────────────────────
  // This is the safe replacement for the old pattern of:
  //   localStorage.setItem(token)  +  window.location.reload()
  // That old pattern caused a race: reload would re-init AuthContext which
  // sometimes called /auth/me before the token was "visible", got a 401,
  // and deleted the token.
  const verifyEmailAndLogin = useCallback(async (email, otp) => {
    const { data } = await api.post('/auth/verify-email', { email, otp })
    _applySession(data.accessToken, data.refreshToken, data.user)
    return data
  }, [_applySession])

  // ── Resend verification OTP ───────────────────────────────────────────────
  const resendVerification = useCallback(async (email) => {
    const { data } = await api.post('/auth/resend-verification', { email })
    return data
  }, [])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const rt = localStorage.getItem('refreshToken')
      if (rt) await api.post('/auth/logout', { refreshToken: rt })
    } catch { /* best-effort */ }
    clearTokens()
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  // ── Update local user state ───────────────────────────────────────────────
  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }, [])

  // ── Refresh user from server ──────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch { /* silent — user stays as-is */ }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      initialized,
      isAuthenticated:  !!user,
      isAdmin:          user?.role === 'admin',
      isInstructor:     user?.role === 'instructor',
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
