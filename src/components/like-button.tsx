'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/lib/actions/like'

interface Props {
  targetId: string
  targetType: 'post' | 'comment'
  initialCount: number
  initialLiked: boolean
  userId: string | null
}

export function LikeButton({
  targetId,
  targetType,
  initialCount,
  initialLiked,
  userId,
}: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!userId) return
    const wasLiked = liked
    setLiked(!wasLiked)
    setCount(c => (wasLiked ? c - 1 : c + 1))
    startTransition(async () => {
      await toggleLike(targetId, targetType)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={!userId || isPending}
      className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${
        liked
          ? 'text-indigo-400'
          : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <span>{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  )
}
