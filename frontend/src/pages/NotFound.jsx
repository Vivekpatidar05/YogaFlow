import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4" style={{background:'var(--bg)'}}>
      <div className="text-center max-w-md">
        <div className="font-display text-[120px] font-bold leading-none select-none mb-2"
          style={{color:'#EAF4E0'}}>
          404
        </div>
        <h1 className="font-display text-2xl font-semibold mb-3" style={{color:'var(--text)'}}>Page Not Found</h1>
        <p className="text-sm leading-relaxed mb-8" style={{color:'var(--muted)'}}>
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary gap-2 px-6 py-3">
            <ArrowLeft size={15}/> Back to Home
          </Link>
          <Link to="/sessions" className="btn-outline px-6 py-3">Browse Sessions</Link>
        </div>
      </div>
    </div>
  )
}
