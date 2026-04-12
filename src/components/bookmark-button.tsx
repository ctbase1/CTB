'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleSaved } from '@/lib/actions/saved'

interface Props {
  postId: string
  isSaved: boolean
}

export function BookmarkButton({ postId, isSaved }: Props) {
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
      className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors hover:bg-zinc-700"
    >
      {optimisticSaved ? '🔖' : '🏷️'}
    </button>
  )
}
