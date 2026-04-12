/**
 * axios.js — YogaFlow API client
 *
 * Three bugs fixed vs old version:
 * 1. Refresh used raw axios with relative URL → failed silently on Vercel
 * 2. localStorage.clear() on refresh failure wiped the token → every next req 401
 * 3. No fallback when localStorage is slow to read on first mount
 */

import axios from 'axios'

// ── Base URL ──────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

// ── Module-level token cache ──────────────────────────────────────────────────
// Reading localStorage on every request is fine but can have timing edge-cases.
// Keeping an in-memory copy guarantees the token is available the moment it's set.
let _accessToken  = localStorage.getItem('accessToken')  || null
let _refreshToken = localStorage.getItem('refreshToken') || null

export function setTokens(access, refresh) {
  _accessToken  = access
  _refreshToken = refresh
  if (access)  localStorage.setItem('accessToken',  access)
  if (refresh) localStorage.setItem('refreshToken', refresh)
}

export function clearTokens() {
  _accessToken  = null
  _refreshToken = null
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

// ── Request interceptor — attach token ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Prefer in-memory copy; fall back to localStorage in case page was hard-reloaded
    const token = _accessToken || localStorage.getItem('accessToken')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor — auto-refresh expired tokens ────────────────────────
let isRefreshing = false
let pendingQueue = []   // requests waiting while refresh is in-flight

const flushQueue = (error, newToken = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(newToken)
  )
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Only attempt refresh when:
    //  • status is 401
    //  • server explicitly says TOKEN_EXPIRED (not just "no token")
    //  • we haven't already retried this request
    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code   === 'TOKEN_EXPIRED' &&
      !original._retry

    if (!isTokenExpired) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Another request is already refreshing — queue this one
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing    = true

    const storedRefresh = _refreshToken || localStorage.getItem('refreshToken')

    if (!storedRefresh) {
      // No refresh token at all — send user to login
      isRefreshing = false
      clearTokens()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      // ── CRITICAL FIX: use the same BASE_URL, not a bare relative path ──────
      // Old code:  axios.post('/api/auth/refresh', ...)
      //   → On Vercel this hits Vercel's domain (no backend there) → 404
      // New code:  axios.post(`${BASE_URL}/auth/refresh`, ...)
      //   → Hits Railway directly → works
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: storedRefresh,
      })

      setTokens(data.accessToken, data.refreshToken)
      flushQueue(null, data.accessToken)

      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)

    } catch (refreshErr) {
      flushQueue(refreshErr, null)

      // ── CRITICAL FIX: only remove the auth tokens, don't nuke localStorage ──
      // Old code: localStorage.clear()  → wiped cart data, preferences, etc.
      // New code: remove only auth keys
      clearTokens()

      window.location.href = '/login'
      return Promise.reject(refreshErr)

    } finally {
      isRefreshing = false
    }
  }
)

export default api
