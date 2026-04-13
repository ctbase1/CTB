'use client'

import { useState, useTransition } from 'react'
import { banFromCommunity } from '@/lib/actions/moderation'

interface Props {
  communityId: string
  communitySlug: string
  userId: string
  username: string
}

const DURATIONS = [
  { label: '1 hour',    ms: 1 * 60 * 60 * 1000 },
  { label: '24 hours',  ms: 24 * 60 * 60 * 1000 },
  { label: '7 days',    ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 days',   ms: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Permanent', ms: null },
] as const

export function BanFromCommunityButton({ communityId, communitySlug, userId, username }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showPicker, setShowPicker]  = useState(false)

  function handleBan(ms: number | null) {
    const expiresAt = ms ? new Date(Date.now() + ms).toISOString() : null
    const label     = DURATIONS.find(d => d.ms === ms)?.label ?? 'permanently'
    if (!confirm(`Ban ${username} for ${label}?`)) return
    setShowPicker(false)
    startTransition(async () => {
      await banFromCommunity(communityId, userId, communitySlug, expiresAt)
    })
  }

  if (showPicker) {
    return (
      <div className="relative">
        <div className="absolute right-0 top-5 z-10 w-36 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-lg">
          {DURATIONS.map(({ label, ms }) => (
            <button
              key={label}
              onClick={() => handleBan(ms)}
              disabled={isPending}
              className="block w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setShowPicker(false)}
            className="block w-full px-3 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowPicker(true)}
      disabled={isPending}
      aria-label={`Ban ${username} from this community`}
      className="text-xs text-zinc-600 hover:text-red-400 disabled:opacity-50"
    >
      {isPending ? 'Banning…' : 'Ban'}
    </button>
  )
}
