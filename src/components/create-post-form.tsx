'use client'

import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { createPost } from '@/lib/actions/post'
import { MarkdownToolbar } from '@/components/ui/markdown-toolbar'

const TITLE_MAX = 300
const BODY_MAX  = 10000

function CharCounter({ current, max }: { current: number; max: number }) {
  const nearLimit = current > max * 0.9
  return (
    <span className={`text-xs tabular-nums ${nearLimit ? 'text-red-400' : 'text-slate-600'}`}>
      {current} / {max}
    </span>
  )
}

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
  const [titleLen, setTitleLen]       = useState(0)
  const [bodyLen, setBodyLen]         = useState(0)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const bodyRef       = useRef<HTMLTextAreaElement>(null)

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
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">
            Title <span className="text-red-400">*</span>
          </label>
          <CharCounter current={titleLen} max={TITLE_MAX} />
        </div>
        <input
          name="title"
          required
          maxLength={TITLE_MAX}
          placeholder="Post title"
          onChange={e => setTitleLen(e.target.value.length)}
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
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">Body</label>
          <CharCounter current={bodyLen} max={BODY_MAX} />
        </div>
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 pt-2 pb-1 focus-within:border-indigo-500">
          <MarkdownToolbar textareaRef={bodyRef} onUpdate={v => setBodyLen(v.length)} />
          <textarea
            ref={bodyRef}
            name="body"
            rows={5}
            maxLength={BODY_MAX}
            placeholder="What's on your mind? (optional)"
            onChange={e => setBodyLen(e.target.value.length)}
            className="w-full resize-none bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>
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
