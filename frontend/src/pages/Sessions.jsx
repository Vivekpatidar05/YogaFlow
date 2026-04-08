import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import api from '../api/axios'
import SessionCard from '../components/SessionCard'

export default function Sessions() {
  const [sessions, setSessions] = useState([])
  const [filters, setFilters] = useState({ type: '', level: '', search: '' })
  const [types, setTypes] = useState([])
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    api.get('/sessions/types').then(r => { setTypes(r.data.types); setLevels(r.data.levels) }).catch(() => {})
  }, [])

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type)   params.append('type', filters.type)
      if (filters.level)  params.append('level', filters.level)
      if (filters.search) params.append('search', filters.search)
      const { data } = await api.get(`/sessions?${params}`)
      setSessions(data.sessions)
      setPagination(data.pagination)
    } catch {}
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { const t = setTimeout(fetchSessions, 300); return () => clearTimeout(t) }, [fetchSessions])

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const clearFilters = () => setFilters({ type: '', level: '', search: '' })
  const hasFilters = filters.type || filters.level || filters.search

  return (
    <div className="pt-24 pb-20 min-h-screen" style={{background:'var(--bg)'}}>
      <div className="page-container">

        {/* Header */}
        <div className="mb-10 pt-4">
          <p className="section-eyebrow mb-3">Explore</p>
          <div className="flex items-end justify-between">
            <h1 className="font-display text-4xl md:text-5xl font-normal text-[#e8e8e8]">Browse Sessions</h1>
            <p className="text-sm pb-1" style={{color:'var(--muted)'}}>{pagination.total || 0} available</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-60">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--faint)'}} />
            <input type="text" className="input-field pl-10 h-11 text-sm"
              placeholder="Search sessions, instructors..."
              value={filters.search} onChange={e => setFilter('search', e.target.value)} />
            {filters.search && (
              <button onClick={() => setFilter('search', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'var(--muted)'}}>
                <X size={14}/>
              </button>
            )}
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 h-11 rounded-lg border text-sm font-medium transition-all"
            style={{
              borderColor: (showFilters || hasFilters) ? 'var(--gold)' : 'var(--border2)',
              color: (showFilters || hasFilters) ? 'var(--gold)' : 'var(--muted)',
              background: (showFilters || hasFilters) ? 'rgba(201,168,76,0.06)' : 'transparent'
            }}>
            <SlidersHorizontal size={14}/> Filters
            {hasFilters && <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center"
              style={{background:'var(--gold)', color:'#0a0a0a', fontSize:'10px'}}>!</span>}
          </button>

          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 h-11 text-sm rounded-lg transition-colors"
              style={{color:'#f87171'}}>
              <X size={13}/> Clear
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-5 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Session Type</label>
                <select className="input-field text-sm" value={filters.type}
                  onChange={e => setFilter('type', e.target.value)}>
                  <option value="">All Types</option>
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Level</label>
                <select className="input-field text-sm" value={filters.level}
                  onChange={e => setFilter('level', e.target.value)}>
                  <option value="">All Levels</option>
                  {levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Type quick-filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8">
          <Pill label="All" active={!filters.type} onClick={() => setFilter('type', '')} />
          {types.map(t => (
            <Pill key={t} label={t} active={filters.type === t}
              onClick={() => setFilter('type', filters.type === t ? '' : t)} />
          ))}
        </div>

        {/* Active pills */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.type  && <ActivePill label={`Type: ${filters.type}`}  onRemove={() => setFilter('type', '')} />}
            {filters.level && <ActivePill label={`Level: ${filters.level}`} onRemove={() => setFilter('level', '')} />}
            {filters.search && <ActivePill label={`"${filters.search}"`}    onRemove={() => setFilter('search', '')} />}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-96" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24 card">
            <div className="text-4xl mb-4">🧘</div>
            <h3 className="font-display text-xl text-[#e8e8e8] mb-2">No sessions found</h3>
            <p className="text-sm mb-5" style={{color:'var(--muted)'}}>Try adjusting your filters.</p>
            <button onClick={clearFilters} className="btn-outline text-sm">Clear All Filters</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(s => <SessionCard key={s._id} session={s}/>)}
          </div>
        )}
      </div>
    </div>
  )
}

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all"
    style={{
      background: active ? 'var(--gold)' : 'var(--surface)',
      color: active ? '#0a0a0a' : 'var(--muted)',
      border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
    }}>
    {label}
  </button>
)

const ActivePill = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
    style={{background:'rgba(201,168,76,0.1)', color:'var(--gold)', border:'1px solid rgba(201,168,76,0.2)'}}>
    {label}
    <button onClick={onRemove}><X size={11}/></button>
  </span>
)
