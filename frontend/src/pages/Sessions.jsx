import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import api from '../api/axios'
import SessionCard from '../components/SessionCard'

export default function Sessions() {
  const [sessions, setSessions]   = useState([])
  const [filters, setFilters]     = useState({ type: '', level: '', search: '' })
  const [types, setTypes]         = useState([])
  const [levels, setLevels]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showFilters, setShowF]   = useState(false)
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    api.get('/sessions/types').then(r => { setTypes(r.data.types); setLevels(r.data.levels) }).catch(() => {})
  }, [])

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (filters.type)   p.append('type', filters.type)
      if (filters.level)  p.append('level', filters.level)
      if (filters.search) p.append('search', filters.search)
      const { data } = await api.get(`/sessions?${p}`)
      setSessions(data.sessions)
      setPagination(data.pagination)
    } catch {}
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { const t = setTimeout(fetchSessions, 300); return () => clearTimeout(t) }, [fetchSessions])

  const sf = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const clear = () => setFilters({ type: '', level: '', search: '' })
  const hasFilters = filters.type || filters.level || filters.search

  return (
    <div className="pt-20 pb-20" style={{ background: 'var(--bg)' }}>
      <div className="page-container">

        {/* Page header */}
        <div className="py-8 mb-4">
          <p className="eyebrow mb-2">Explore</p>
          <div className="flex items-end justify-between flex-wrap gap-3">
            <h1 className="font-display text-4xl md:text-5xl font-semibold" style={{ color: 'var(--text)' }}>
              Browse Sessions
            </h1>
            <p className="text-sm pb-1" style={{ color: 'var(--muted)' }}>
              {pagination.total || 0} sessions available
            </p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--faint)' }} />
            <input type="text" className="input-field pl-11 h-12"
              placeholder="Search by name, instructor, type…"
              value={filters.search} onChange={e => sf('search', e.target.value)} />
            {filters.search && (
              <button onClick={() => sf('search', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                style={{ color: 'var(--faint)' }}>
                <X size={14} />
              </button>
            )}
          </div>

          <button onClick={() => setShowF(!showFilters)}
            className="flex items-center justify-center gap-2 px-5 h-12 rounded-xl border-2 text-sm font-semibold transition-all"
            style={{
              borderColor: showFilters || hasFilters ? 'var(--primary)' : 'var(--border2)',
              color: showFilters || hasFilters ? 'var(--primary)' : 'var(--muted)',
              background: showFilters || hasFilters ? 'rgba(44,95,46,0.05)' : 'transparent',
            }}>
            <SlidersHorizontal size={15} />
            Filters
            {hasFilters && (
              <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{ background: 'var(--terra)', fontSize: 10 }}>!</span>
            )}
          </button>

          {hasFilters && (
            <button onClick={clear}
              className="flex items-center gap-1.5 px-4 h-12 rounded-xl text-sm font-medium transition-colors hover:bg-red-50"
              style={{ color: '#C0392B' }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-5 mb-5 shadow-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Session Type</label>
                <select className="input-field text-sm" value={filters.type}
                  onChange={e => sf('type', e.target.value)}>
                  <option value="">All Types</option>
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Level</label>
                <select className="input-field text-sm" value={filters.level}
                  onChange={e => sf('level', e.target.value)}>
                  <option value="">All Levels</option>
                  {levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Type quick-filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6">
          <Chip label="All" active={!filters.type} onClick={() => sf('type', '')} />
          {types.map(t => (
            <Chip key={t} label={t} active={filters.type === t}
              onClick={() => sf('type', filters.type === t ? '' : t)} />
          ))}
        </div>

        {/* Active filter pills */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {filters.type  && <ActivePill label={`Type: ${filters.type}`}  onRemove={() => sf('type', '')} />}
            {filters.level && <ActivePill label={`Level: ${filters.level}`} onRemove={() => sf('level', '')} />}
            {filters.search && <ActivePill label={`"${filters.search}"`}   onRemove={() => sf('search', '')} />}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-96" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-20 shadow-card">
            <div className="text-5xl mb-4">🧘</div>
            <h3 className="font-display text-xl mb-2" style={{ color: 'var(--text)' }}>No sessions found</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Try adjusting your filters or search terms.</p>
            <button onClick={clear} className="btn-outline text-sm px-6">Clear All Filters</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(s => <SessionCard key={s._id} session={s} />)}
          </div>
        )}
      </div>
    </div>
  )
}

const Chip = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all"
    style={{
      background:   active ? 'var(--primary)' : 'var(--surface)',
      color:        active ? '#fff' : 'var(--muted)',
      border:       `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    }}>
    {label}
  </button>
)

const ActivePill = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
    style={{ background: '#EAF4E0', color: 'var(--primary)', border: '1px solid #B5D98A' }}>
    {label}
    <button onClick={onRemove} className="hover:opacity-70"><X size={11} /></button>
  </span>
)
