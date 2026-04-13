'use client'

import { useState, useTransition } from 'react'
import { DEFAULT_FLAIRS } from '@/lib/default-flairs'
import { setMemberFlair } from '@/lib/actions/community'

const FLAIR_MAX = 40

interface Props {
  communityId: string
  currentFlair: string | null
}

export function FlairPicker({ communityId, currentFlair }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(currentFlair ?? '')
  const [flair, setFlair] = useState(currentFlair)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const nearLimit = value.length > FLAIR_MAX * 0.9

  function handlePreset(preset: string) {
    setValue(preset)
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await setMemberFlair(communityId, value)
      if (result?.error) {
        setError(result.error)
      } else {
        setFlair(value || null)
        setOpen(false)
      }
    })
  }

  return (
    <div className="mt-3 border-t border-slate-700/50 pt-3">
      {flair ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            Your flair: <span className="font-medium text-violet-300">{flair}</span>
          </span>
          <button
            type="button"
            onClick={() => { setValue(flair); setOpen(true) }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Edit
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-lg border border-dashed border-slate-700 py-1.5 text-xs text-slate-500 hover:border-violet-500/50 hover:text-violet-400 transition-colors"
        >
          + Set your flair
        </button>
      )}

      {open && (
        <div className="mt-2 space-y-2">
          {/* Preset grid */}
          <div className="flex flex-wrap gap-1">
            {DEFAULT_FLAIRS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => handlePreset(f)}
                className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                  value === f
                    ? 'border-violet-500 bg-violet-900/40 text-violet-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={value}
              maxLength={FLAIR_MAX}
              placeholder="Custom flair…"
              onChange={e => setValue(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none"
            />
            <span className={`text-[10px] tabular-nums ${nearLimit ? 'text-red-400' : 'text-slate-600'}`}>
              {value.length}/{FLAIR_MAX}
            </span>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setValue(flair ?? '') }}
              className="rounded-lg px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
