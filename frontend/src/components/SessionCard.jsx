import { Link } from 'react-router-dom'
import { Clock, Users, Star, ChevronRight, Zap } from 'lucide-react'

const levelColors = {
  'Beginner':     { bg:'rgba(74,222,128,0.1)',  color:'#4ade80' },
  'Intermediate': { bg:'rgba(251,191,36,0.1)',  color:'#fbbf24' },
  'Advanced':     { bg:'rgba(248,113,113,0.1)', color:'#f87171' },
  'All Levels':   { bg:'rgba(147,197,253,0.1)', color:'#93c5fd' },
}
const typeIcons = { 'Hatha':'🧘','Vinyasa':'🌊','Yin':'🌙','Kundalini':'✨','Ashtanga':'💪','Restorative':'🌿','Prenatal':'🌸','Power':'⚡','Hot Yoga':'🔥','Meditation':'🪷' }

export default function SessionCard({ session }) {
  const nextSlot  = session.upcoming?.[0]
  const spotsLeft = nextSlot?.spotsLeft ?? session.maxCapacity
  const isFull    = nextSlot?.isFull ?? false
  const lvl       = levelColors[session.level] || { bg:'rgba(255,255,255,0.06)', color:'#aaa' }

  const formatDate = (d) => {
    const date = new Date(d), today = new Date(), tmrw = new Date(today)
    tmrw.setDate(today.getDate()+1)
    if (date.toDateString()===today.toDateString()) return 'Today'
    if (date.toDateString()===tmrw.toDateString())  return 'Tomorrow'
    return date.toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'})
  }

  return (
    <div className="card-hover group flex flex-col">
      <div className="relative h-44 overflow-hidden" style={{background:'var(--surface2)'}}>
        {session.image ? (
          <img src={session.image} alt={session.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{opacity:0.6}}
            onError={e=>{e.target.onerror=null;e.target.src='https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format'}} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">{typeIcons[session.type]||'🧘'}</div>
        )}
        <div className="absolute inset-0" style={{background:'linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.75) 100%)'}}/>
        <div className="absolute top-3 left-3">
          <span className="badge text-xs" style={{background:lvl.bg,color:lvl.color}}>{session.level}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:'rgba(201,168,76,0.92)',color:'#0a0a0a'}}>
            ₹{session.price?.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 text-xl">{typeIcons[session.type]||'🧘'}</div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-lg leading-tight line-clamp-2 mb-1 transition-colors" style={{color:'#e8e8e8'}}>
          {session.title}
        </h3>
        <p className="text-xs mb-3" style={{color:'var(--muted)'}}>{session.type} · {session.instructor?.name}</p>
        <p className="text-sm leading-relaxed line-clamp-2 mb-4 flex-1" style={{color:'#555'}}>{session.description}</p>

        <div className="flex items-center gap-4 text-xs mb-4" style={{color:'var(--muted)'}}>
          <span className="flex items-center gap-1"><Clock size={11}/>{session.duration} min</span>
          <span className="flex items-center gap-1"><Users size={11}/>
            {isFull ? <span style={{color:'#f87171'}}>Full</span> : <span>{spotsLeft} left</span>}
          </span>
          {session.rating?.count > 0 && (
            <span className="flex items-center gap-1">
              <Star size={11} style={{fill:'var(--gold)',color:'var(--gold)'}}/>{session.rating.average}
            </span>
          )}
        </div>

        {nextSlot && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
            style={{background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.12)'}}>
            <Zap size={11} style={{color:'var(--gold)',flexShrink:0}}/>
            <span className="text-xs font-medium" style={{color:'#d4b35a'}}>
              Next: {formatDate(nextSlot.date)} at {nextSlot.time}
            </span>
          </div>
        )}

        <Link to={`/sessions/${session._id}`}
          className={`btn-gold w-full justify-center text-xs py-2.5 gap-1.5 ${isFull?'opacity-40 pointer-events-none':''}`}>
          {isFull ? 'Fully Booked' : <><span>View & Book</span><ChevronRight size={13}/></>}
        </Link>
      </div>
    </div>
  )
}
