import { Link } from 'react-router-dom'
import { Clock, Users, Star, ChevronRight, Zap } from 'lucide-react'

const levelBadge = {
  'Beginner':     'badge-green',
  'Intermediate': 'badge-amber',
  'Advanced':     'badge-terra',
  'All Levels':   'badge-blue',
}
const typeIcons = {
  'Hatha':'🧘','Vinyasa':'🌊','Yin':'🌙','Kundalini':'✨',
  'Ashtanga':'💪','Restorative':'🌿','Prenatal':'🌸','Power':'⚡','Hot Yoga':'🔥','Meditation':'🪷'
}

export default function SessionCard({ session }) {
  const next      = session.upcoming?.[0]
  const spotsLeft = next?.spotsLeft ?? session.maxCapacity
  const isFull    = next?.isFull ?? false

  const fmtDate = (d) => {
    const date = new Date(d), today = new Date(), tmrw = new Date(today)
    tmrw.setDate(today.getDate() + 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tmrw.toDateString())  return 'Tomorrow'
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="card-hover group flex flex-col h-full">
      {/* Image */}
      <div className="relative h-48 overflow-hidden" style={{ background: 'var(--surface2)' }}>
        {session.image ? (
          <img src={session.image} alt={session.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {typeIcons[session.type] || '🧘'}
          </div>
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.45) 100%)' }} />

        <div className="absolute top-3 left-3">
          <span className={`badge ${levelBadge[session.level] || 'badge-gray'}`}>{session.level}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: 'var(--primary)' }}>
            ₹{session.price?.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span className="text-lg">{typeIcons[session.type] || '🧘'}</span>
          <span className="text-xs font-semibold text-white">{session.type}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-lg leading-snug mb-1 line-clamp-2 transition-colors group-hover:text-primary"
          style={{ color: 'var(--text)' }}>
          {session.title}
        </h3>
        <p className="text-xs mb-3 font-medium" style={{ color: 'var(--muted)' }}>
          with {session.instructor?.name}
        </p>
        <p className="text-sm leading-relaxed line-clamp-2 mb-4 flex-1" style={{ color: 'var(--muted)' }}>
          {session.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs mb-4" style={{ color: 'var(--faint)' }}>
          <span className="flex items-center gap-1">
            <Clock size={11} style={{ color: 'var(--primary)' }} />{session.duration} min
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} style={{ color: isFull ? 'var(--terra)' : 'var(--primary)' }} />
            <span style={{ color: isFull ? 'var(--terra)' : 'inherit' }}>
              {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
            </span>
          </span>
          {session.rating?.count > 0 && (
            <span className="flex items-center gap-1">
              <Star size={11} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
              {session.rating.average}
            </span>
          )}
        </div>

        {/* Next slot */}
        {next && !isFull && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
            style={{ background: 'rgba(44,95,46,0.06)', border: '1px solid rgba(44,95,46,0.12)' }}>
            <Zap size={11} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
              Next: {fmtDate(next.date)} at {next.time}
            </span>
          </div>
        )}

        <Link to={`/sessions/${session._id}`}
          className={`btn-primary w-full justify-center text-sm py-2.5 ${isFull ? 'opacity-50 pointer-events-none' : ''}`}>
          {isFull ? 'Fully Booked' : <><span>View & Book</span><ChevronRight size={14} /></>}
        </Link>
      </div>
    </div>
  )
}
