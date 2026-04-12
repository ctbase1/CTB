'use client'

import { useState, useTransition } from 'react'
import { toggleFollow } from '@/lib/actions/follow'

interface Props {
  targetUserId: string
  initialFollowed: boolean
  currentUserId: string | null
}

export function FollowButton({
  targetUserId,
  initialFollowed,
  currentUserId,
}: Props) {
  const [followed, setFollowed] = useState(initialFollowed)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!currentUserId) return
    const wasFollowed = followed
    setFollowed(!wasFollowed)
    setError(null)
    startTransition(async () => {
      const result = await toggleFollow(targetUserId)
      if (result.error) {
        setFollowed(wasFollowed)
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleClick}
        disabled={!currentUserId || isPending}
        className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          followed
            ? 'border border-zinc-600 text-zinc-300 hover:border-red-500 hover:text-red-400'
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
        }`}
      >
        {followed ? 'Following' : 'Follow'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
