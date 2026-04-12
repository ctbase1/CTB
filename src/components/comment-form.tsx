'use client'

import { useRef, useState, useTransition } from 'react'
import { createComment } from '@/lib/actions/comment'

interface Props {
  postId: string
  parentId?: string | null
  communitySlug: string
  onSuccess?: () => void
}

export function CommentForm({ postId, parentId, communitySlug, onSuccess }: Props) {
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
        onSuccess?.()
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2.5">
      <input type="hidden" name="post_id"        value={postId} />
      <input type="hidden" name="parent_id"      value={parentId ?? ''} />
      <input type="hidden" name="community_slug" value={communitySlug} />
      <textarea
        name="body"
        required
        rows={3}
        placeholder={parentId ? 'Write a reply…' : 'Write a comment…'}
        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Posting…' : parentId ? 'Reply' : 'Comment'}
      </button>
    </form>
  )
}
