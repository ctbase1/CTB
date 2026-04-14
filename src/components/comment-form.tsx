'use client'

import { useRef, useState, useTransition } from 'react'
import { createComment } from '@/lib/actions/comment'
import { MarkdownToolbar } from '@/components/ui/markdown-toolbar'

const COMMENT_MAX = 2000

interface Props {
  postId: string
  parentId?: string | null
  communitySlug: string
  onSuccess?: () => void
}

export function CommentForm({ postId, parentId, communitySlug, onSuccess }: Props) {
  const formRef    = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [charCount, setCharCount] = useState(0)
  const [isPending, startTransition] = useTransition()

  const nearLimit = charCount > COMMENT_MAX * 0.9

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createComment(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        setCharCount(0)
        onSuccess?.()
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2.5">
      <input type="hidden" name="post_id"        value={postId} />
      <input type="hidden" name="parent_id"      value={parentId ?? ''} />
      <input type="hidden" name="community_slug" value={communitySlug} />
      <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 pt-2.5 pb-2 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <MarkdownToolbar textareaRef={textareaRef} onUpdate={v => setCharCount(v.length)} />
        <textarea
          ref={textareaRef}
          name="body"
          required
          rows={3}
          maxLength={COMMENT_MAX}
          placeholder={parentId ? 'Write a reply…' : 'Write a comment…'}
          onChange={e => setCharCount(e.target.value.length)}
          inputMode="text"
          autoComplete="off"
          className="w-full resize-none bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs tabular-nums ${nearLimit ? 'text-red-400' : 'text-slate-600'}`}>
            {charCount} / {COMMENT_MAX}
          </span>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Posting…' : parentId ? 'Reply' : 'Comment'}
          </button>
        </div>
      </div>
    </form>
  )
}
