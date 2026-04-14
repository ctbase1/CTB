import Link from 'next/link'
import { Search } from 'lucide-react'

export function MobileHeader() {
  return (
    <header className="flex md:hidden sticky top-0 z-40 h-14 items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
      <Link
        href="/feed"
        className="text-lg font-bold tracking-tight text-[var(--accent)] hover:opacity-80 transition-opacity"
      >
        CTB
      </Link>
      <Link
        href="/search"
        className="flex items-center justify-center h-9 w-9 rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)] transition-colors"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Link>
    </header>
  )
}
