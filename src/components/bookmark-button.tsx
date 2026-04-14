'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleSaved } from '@/lib/actions/saved'
import { Bookmark } from 'lucide-react'

interface Props {
  postId: string
  isSaved: boolean
  accentColor?: string
}

export function BookmarkButton({ postId, isSaved, accentColor = 'var(--accent)' }: Props) {
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(isSaved)
  const [, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      setOptimisticSaved(!optimisticSaved)
      const fd = new FormData()
      fd.set('post_id', postId)
      await toggleSaved(fd)
    })
  }

  return (
    <button
      onClick={handleClick}
      title={optimisticSaved ? 'Remove bookmark' : 'Save post'}
      className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] md:h-7 md:w-7"
      style={optimisticSaved ? { color: accentColor } : undefined}
    >
      <Bookmark
        className="h-4 w-4 transition-all"
        style={optimisticSaved ? { fill: accentColor, color: accentColor } : undefined}
      />
    </button>
  )
}
