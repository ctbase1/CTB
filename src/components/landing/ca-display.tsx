'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const CA = '36gzzGe4RnndAxmdDNahci75tGn9dvBn18S7tTsspump'

export function CaDisplay() {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(CA)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-mono text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)]"
      title="Copy CA"
    >
      <span className="hidden sm:inline">CA: </span>
      <span>{CA.slice(0, 6)}…{CA.slice(-4)}</span>
      {copied
        ? <Check className="h-3 w-3 text-green-400 shrink-0" />
        : <Copy className="h-3 w-3 shrink-0" />
      }
    </button>
  )
}
