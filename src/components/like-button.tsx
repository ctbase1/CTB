'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/lib/actions/like'
import { Heart } from 'lucide-react'

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
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!userId) return
    const wasLiked = liked
    setLiked(!wasLiked)
    setCount(c => (wasLiked ? c - 1 : c + 1))
    setError(null)
    startTransition(async () => {
      const result = await toggleLike(targetId, targetType)
      if (result.error) {
        setLiked(wasLiked)
        setCount(c => (wasLiked ? c + 1 : c - 1))
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        onClick={handleClick}
        disabled={!userId || isPending}
        className={`flex items-center gap-1.5 text-sm transition-all disabled:opacity-50 ${
          liked
            ? 'text-violet-400 scale-105'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Heart className={`h-3.5 w-3.5 transition-all ${liked ? 'fill-violet-400' : ''}`} />
        <span>{count}</span>
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
