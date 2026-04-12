'use client'

import { useTransition } from 'react'
import { banFromCommunity } from '@/lib/actions/moderation'

interface Props {
  communityId: string
  communitySlug: string
  userId: string
  username: string
}

export function BanFromCommunityButton({ communityId, communitySlug, userId, username }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`Ban ${username} from this community?`)) return
    startTransition(async () => {
      await banFromCommunity(communityId, userId, communitySlug)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-zinc-600 hover:text-orange-400 disabled:opacity-50"
    >
      {isPending ? 'Banning…' : 'Ban'}
    </button>
  )
}
