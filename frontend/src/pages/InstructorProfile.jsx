import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Clock, Users, MapPin, Instagram, Globe, Youtube, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import SessionCard from '../components/SessionCard'

export default function InstructorProfile() {
  const { id } = useParams()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNF]   = useState(false)

  useEffect(() => {
    api.get(`/instructor/profile/${id}`)
      .then(r => setData(r.data))
      .catch(() => setNF(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner fullPage />
  if (notFound || !data) return (
    <div className="pt-20 min-h-screen flex items-center justify-center" style={{ background:'var(--bg)' }}>
      <div className="text-center">
        <h1 className="font-display text-2xl mb-3" style={{ color:'var(--text)' }}>Instructor not found</h1>
        <Link to="/sessions" className="btn-primary px-6">Browse Sessions</Link>
      </div>
    </div>
  )

  const { instructor, sessions, application } = data
  const totalBookings = sessions.reduce((s, se) => s + (se.totalBookings || 0), 0)
  const avgRating     = sessions.filter(s => s.rating?.count > 0).reduce((sum, s, _, arr) => sum + s.rating.average / arr.length, 0)

  return (
    <div className="pt-20 pb-16" style={{ background:'var(--bg)' }}>
      <div className="page-container max-w-5xl">

        {/* Hero card */}
        <div className="card p-8 mb-8 shadow-card overflow-hidden relative">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{ background:'linear-gradient(135deg, var(--primary) 0%, transparent 60%)' }} />

          <div className="relative flex flex-col sm:flex-row items-start gap-6">
            {instructor.avatar ? (
              <img src={instructor.avatar} alt={`${instructor.firstName} ${instructor.lastName}`}
                className="w-24 h-24 rounded-2xl object-cover border-2 shrink-0"
                style={{ borderColor:'#B5D98A' }} />
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0"
                style={{ background:'#EAF4E0', color:'var(--primary)', border:'2px solid #B5D98A', fontFamily:'Georgia,serif' }}>
                {instructor.firstName?.[0]}{instructor.lastName?.[0]}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="eyebrow mb-1">Yoga Instructor</p>
                  <h1 className="font-display text-3xl font-semibold" style={{ color:'var(--text)' }}>
                    {instructor.firstName} {instructor.lastName}
                  </h1>
                  {application?.specialties?.length > 0 && (
                    <p className="text-sm mt-1" style={{ color:'var(--muted)' }}>
                      {application.specialties.join(' · ')}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                  {[
                    { label:'Sessions', value: sessions.length },
                    { label:'Students', value: totalBookings },
                    { label:'Rating',   value: avgRating ? avgRating.toFixed(1) + '★' : 'New' },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-3 rounded-xl" style={{ background:'var(--surface2)' }}>
                      <p className="font-bold text-lg font-display" style={{ color:'var(--primary)' }}>{value}</p>
                      <p className="text-xs font-medium" style={{ color:'var(--muted)' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio */}
              {application?.bio && (
                <p className="text-sm leading-relaxed mt-4" style={{ color:'var(--muted)' }}>
                  {application.bio}
                </p>
              )}

              {/* Certifications */}
              {application?.certifications?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {application.certifications.map(c => (
                    <span key={c} className="badge badge-green text-xs">{c}</span>
                  ))}
                </div>
              )}

              {/* Social links */}
              <div className="flex items-center gap-3 mt-4">
                {application?.socialLinks?.instagram && (
                  <a href={`https://instagram.com/${application.socialLinks.instagram.replace('@','')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium hover:underline"
                    style={{ color:'var(--primary)' }}>
                    <Instagram size={13}/> {application.socialLinks.instagram}
                  </a>
                )}
                {application?.socialLinks?.website && (
                  <a href={application.socialLinks.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium hover:underline"
                    style={{ color:'var(--primary)' }}>
                    <Globe size={13}/> Website
                  </a>
                )}
                {application?.socialLinks?.youtube && (
                  <a href={application.socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium hover:underline"
                    style={{ color:'var(--terra)' }}>
                    <Youtube size={13}/> YouTube
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Experience */}
        {application?.experience && (
          <div className="card p-6 mb-6 shadow-card">
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color:'var(--text)' }}>Experience</h2>
            <p className="text-sm leading-relaxed" style={{ color:'var(--muted)' }}>{application.experience}</p>
          </div>
        )}

        {/* Sessions */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold" style={{ color:'var(--text)' }}>
              Sessions ({sessions.length})
            </h2>
          </div>
          {sessions.length === 0 ? (
            <div className="card text-center py-12 shadow-card">
              <p className="text-sm" style={{ color:'var(--muted)' }}>No active sessions yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map(s => <SessionCard key={s._id} session={s} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
