import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import type { Profile } from '@/types/database'

interface Props {
  profile: Profile
}

export function MobileHeader({ profile }: Props) {
  return (
    <header className="flex md:hidden sticky top-0 z-40 h-14 items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
      <Link
        href="/feed"
        className="text-lg font-bold tracking-tight text-[var(--accent)] hover:opacity-80 transition-opacity"
      >
        CTB
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/search"
          className="flex items-center justify-center h-9 w-9 rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)] transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Link>
        <Link href={`/u/${profile.username}`} aria-label="Profile">
          <div className="relative h-7 w-7 overflow-hidden rounded-full bg-[var(--surface-raised)]">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--muted-foreground)]">
                {profile.username[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </Link>
      </div>
    </header>
  )
}
