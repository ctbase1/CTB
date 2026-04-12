'use client'

import { useState, useTransition } from 'react'
import { createReport } from '@/lib/actions/report'

interface Props {
  targetId: string
  targetType: 'post' | 'comment'
}

export function ReportButton({ targetId, targetType }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createReport(targetId, targetType, reason)
      if (result?.error) {
        setError(result.error)
      } else {
        setSubmitted(true)
        setReason('')
        setTimeout(() => { setOpen(false); setSubmitted(false) }, 1500)
      }
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`Report this ${targetType}`}
        className="text-xs text-zinc-600 hover:text-zinc-400"
      >
        Report
      </button>

      {open && (
        <div className="absolute right-0 top-6 z-10 w-64 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
          {submitted ? (
            <p className="text-xs text-green-400">Report submitted. Thank you.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <p className="text-xs font-medium text-zinc-300">Report this {targetType}</p>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Describe the issue…"
                className="w-full resize-none rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isPending ? 'Sending…' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
