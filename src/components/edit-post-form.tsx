'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { editPost } from '@/lib/actions/post'

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Save'}
    </button>
  )
}

interface Props {
  postId: string
  communitySlug: string
  currentBody: string | null
  createdAt: string
}

export function EditPostForm({ postId, communitySlug, currentBody, createdAt }: Props) {
  const [open, setOpen] = useState(false)

  // Check if still within 30-min window
  const expiresAt = new Date(createdAt).getTime() + 30 * 60 * 1000
  const canEdit   = Date.now() < expiresAt

  if (!canEdit) return null

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-zinc-400 hover:text-white"
        >
          Edit
        </button>
      ) : (
        <form action={editPost} className="mt-3 space-y-2">
          <input type="hidden" name="post_id"        value={postId} />
          <input type="hidden" name="community_slug" value={communitySlug} />
          <textarea
            name="body"
            defaultValue={currentBody ?? ''}
            rows={4}
            placeholder="Post body (optional)"
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <SaveButton />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
