'use client'

import { useRef, useState, useTransition } from 'react'
import { createComment } from '@/lib/actions/comment'

interface Props {
  postId: string
  communitySlug: string
  onClose: () => void
}

export function InlineCommentForm({ postId, communitySlug, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createComment(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        onClose()
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mt-3 space-y-2">
      <input type="hidden" name="post_id"        value={postId} />
      <input type="hidden" name="parent_id"      value="" />
      <input type="hidden" name="community_slug" value={communitySlug} />
      <textarea
        name="body"
        required
        rows={2}
        placeholder="Write a comment…"
        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  )
}
