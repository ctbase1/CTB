'use client'

import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { createPost } from '@/lib/actions/post'

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
    >
      {pending ? 'Posting…' : 'Post'}
    </button>
  )
}

interface Props {
  communitySlug: string
  communityFlairs?: string[]
  error?: string | null
}

export function CreatePostForm({ communitySlug, communityFlairs = [], error: initialError }: Props) {
  const [imageUrl, setImageUrl]       = useState<string | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setImageUrl(url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form action={createPost} className="space-y-4">
      <input type="hidden" name="community_slug" value={communitySlug} />
      <input type="hidden" name="image_url"      value={imageUrl ?? ''} />

      {(initialError || uploadError) && (
        <div className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {initialError ?? uploadError}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          name="title"
          required
          maxLength={300}
          placeholder="Post title"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {communityFlairs.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">Flair</label>
          <select
            name="flair"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">— No flair —</option>
            {communityFlairs.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">Body</label>
        <textarea
          name="body"
          rows={5}
          placeholder="What's on your mind? (optional)"
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">Image</label>
        {imageUrl ? (
          <div>
            <div className="relative h-48 w-full overflow-hidden rounded-lg bg-zinc-800">
              <Image src={imageUrl} alt="Post image" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="mt-1 text-xs text-zinc-500 hover:text-red-400"
            >
              Remove image
            </button>
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-dashed border-zinc-700 px-6 py-3 text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : '+ Add image'}
            </button>
          </div>
        )}
      </div>

      <SubmitButton disabled={uploading} />
    </form>
  )
}
