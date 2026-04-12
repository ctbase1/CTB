'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { uploadToCloudinary } from '@/lib/cloudinary'

interface AvatarUploadProps {
  currentUrl: string | null
  onUpload: (url: string) => void
}

export function AvatarUpload({ currentUrl, onUpload }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const url = await uploadToCloudinary(file)
      setPreview(url)
      onUpload(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Upload avatar"
        className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-zinc-800 ring-2 ring-zinc-700 hover:ring-indigo-500 focus:outline-none focus:ring-indigo-500"
      >
        {preview ? (
          <Image src={preview} alt="Avatar" fill className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-3xl text-zinc-500">
            ?
          </span>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-sm text-indigo-400 hover:underline"
        disabled={uploading}
      >
        {uploading ? 'Uploading…' : 'Change avatar'}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
