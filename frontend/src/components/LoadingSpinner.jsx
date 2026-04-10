export default function LoadingSpinner({ fullPage = false, size = 'md' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  const spin = <div className={`${sz[size]} spinner`} />
  if (!fullPage) return spin
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 spinner" />
        <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Loading…</p>
      </div>
    </div>
  )
}
