'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/lib/actions/like'
import { Heart } from 'lucide-react'
import { motion, useReducedMotion } from '@/components/motion'

interface Props {
  targetId: string
  targetType: 'post' | 'comment'
  initialCount: number
  initialLiked: boolean
  userId: string | null
  accentColor?: string
}

export function LikeButton({
  targetId,
  targetType,
  initialCount,
  initialLiked,
  userId,
  accentColor = 'var(--accent)',
}: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const reduced = useReducedMotion()

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
      <motion.button
        onClick={handleClick}
        disabled={!userId || isPending}
        whileTap={reduced ? {} : { scale: 0.85 }}
        animate={liked && !reduced ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.25, type: 'spring', stiffness: 400, damping: 15 }}
        className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] justify-center md:min-h-0 md:min-w-0 md:justify-start ${
          liked ? '' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
        style={liked ? { color: accentColor } : undefined}
      >
        <Heart
          className="h-3.5 w-3.5 transition-all"
          style={liked ? { fill: accentColor, color: accentColor } : undefined}
        />
        <span>{count}</span>
      </motion.button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
