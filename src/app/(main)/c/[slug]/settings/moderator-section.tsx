'use client'

import { useState, useTransition } from 'react'
import { assignModerator, removeModerator } from '@/lib/actions/moderation'

interface Member {
  userId:    string
  role:      string
  username:  string
  avatarUrl: string | null
}

interface Props {
  communityId:   string
  communitySlug: string
  members:       Member[]
}

export function ModeratorSection({ communityId, communitySlug, members }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const mods        = members.filter(m => m.role === 'moderator')
  const nonMods     = members.filter(m => m.role !== 'moderator')
  const filteredNonMods = search
    ? nonMods.filter(m => m.username.toLowerCase().includes(search.toLowerCase()))
    : nonMods

  function handleAssign(userId: string) {
    setError(null)
    startTransition(async () => {
      const result = await assignModerator(communityId, userId, communitySlug)
      if (result?.error) setError(result.error)
    })
  }

  function handleRemove(userId: string) {
    setError(null)
    startTransition(async () => {
      const result = await removeModerator(communityId, userId, communitySlug)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="rounded-xl border border-zinc-800 p-6">
      <h3 className="text-sm font-semibold text-white mb-4">Moderators</h3>

      {error && (
        <p className="mb-3 rounded-md bg-red-900/30 px-3 py-2 text-xs text-red-400">{error}</p>
      )}

      {/* Current mods */}
      {mods.length > 0 ? (
        <div className="mb-5 space-y-2">
          {mods.map(m => (
            <div key={m.userId} className="flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-300">{m.username}</span>
              <button
                onClick={() => handleRemove(m.userId)}
                disabled={isPending}
                className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-red-600 hover:text-red-400 disabled:opacity-50"
              >
                Remove mod
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-5 text-xs text-zinc-500">No moderators yet.</p>
      )}

      {/* Assign from members */}
      {nonMods.length > 0 && (
        <>
          <p className="mb-2 text-xs font-medium text-zinc-500">Assign a member</p>
          <input
            type="text"
            placeholder="Search members…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-3 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredNonMods.map(m => (
              <div key={m.userId} className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-300">{m.username}</span>
                <button
                  onClick={() => handleAssign(m.userId)}
                  disabled={isPending}
                  className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-50"
                >
                  Make mod
                </button>
              </div>
            ))}
            {filteredNonMods.length === 0 && (
              <p className="text-xs text-zinc-500">No members found.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
