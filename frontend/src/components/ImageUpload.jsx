import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

/**
 * ImageUpload component
 * Props:
 *   value       - current image URL (to show preview)
 *   onChange    - (url) => void — called with uploaded Cloudinary URL
 *   type        - 'avatar' | 'session' | 'instructor' (determines upload endpoint/folder)
 *   label       - label text
 *   aspectRatio - 'square' | 'landscape' | 'any' (default: 'any')
 *   className   - extra class
 */
export default function ImageUpload({
  value, onChange, type = 'session',
  label = 'Upload Image', aspectRatio = 'any', className = '',
}) {
  const [preview,   setPreview]   = useState(value || null)
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const MAX_MB   = 5
  const MAX_BYTES = MAX_MB * 1024 * 1024

  const processFile = useCallback(async (file) => {
    if (!file) return

    // Validate type
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP and GIF images are allowed.')
      return
    }

    // Validate size
    if (file.size > MAX_BYTES) {
      toast.error(`Image too large. Maximum size is ${MAX_MB}MB.`)
      return
    }

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)

    // Upload to Cloudinary via backend
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('type',  type)

      const endpoint = type === 'avatar' ? '/upload/avatar' : '/upload/image'
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (data.success) {
        setPreview(data.url)
        onChange(data.url)
        toast.success('Image uploaded!')
      } else {
        toast.error(data.message || 'Upload failed.')
        setPreview(value || null)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.'
      toast.error(msg)
      setPreview(value || null)
    } finally {
      setUploading(false)
    }
  }, [type, value, onChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    processFile(file)
  }, [processFile])

  const handleChange = (e) => processFile(e.target.files[0])

  const remove = (e) => {
    e.stopPropagation()
    setPreview(null)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const h = aspectRatio === 'square' ? 'h-32 w-32' : aspectRatio === 'landscape' ? 'h-40 w-full' : 'h-36 w-full'

  return (
    <div className={className}>
      {label && <label className="label mb-2">{label}</label>}

      <div
        className={`relative ${h} rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden`}
        style={{
          borderColor: dragging ? 'var(--primary)' : preview ? 'var(--border)' : 'var(--border2)',
          background:  dragging ? 'rgba(44,95,46,0.04)' : preview ? 'transparent' : 'var(--surface)',
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-semibold">Click to change</span>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={remove}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={12} className="text-white" />
              </button>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <Loader size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
            ) : (
              <Upload size={22} style={{ color: dragging ? 'var(--primary)' : 'var(--faint)' }} />
            )}
            <div className="text-center px-3">
              <p className="text-xs font-semibold" style={{ color: uploading ? 'var(--primary)' : 'var(--muted)' }}>
                {uploading ? 'Uploading…' : dragging ? 'Drop image here' : 'Click or drag & drop'}
              </p>
              {!uploading && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--faint)' }}>
                  PNG, JPG, WebP · Max {MAX_MB}MB
                </p>
              )}
            </div>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.8)' }}>
            <div className="flex flex-col items-center gap-2">
              <Loader size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--primary)' }}>Uploading…</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />

      {!preview && !uploading && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--faint)' }}>
          Or paste a URL in the field above
        </p>
      )}
    </div>
  )
}
