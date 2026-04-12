'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

interface NavbarProps {
  profile: Profile
  unreadCount: number
}

export function Navbar({ profile, unreadCount }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center gap-4">

        {/* Logo */}
        <Link href="/" className="shrink-0 text-lg font-bold text-white">
          CBT
        </Link>

        {/* Search — grows to fill space */}
        <form action="/search" className="flex flex-1 items-center">
          <input
            name="q"
            type="search"
            placeholder="Search…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </form>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 sm:flex">
          <Link href="/c/new" className="text-sm text-zinc-400 hover:text-white">
            + Create
          </Link>
          <Link href="/notifications" className="relative text-sm text-zinc-400 hover:text-white">
            🔔
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/saved" className="text-sm text-zinc-400 hover:text-white">
            Saved
          </Link>
          <Link href={`/u/${profile.username}`} className="text-sm text-zinc-400 hover:text-white">
            {profile.username}
          </Link>
          <Link href="/settings" className="text-sm text-zinc-400 hover:text-white">
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-zinc-400 hover:text-red-400"
          >
            Sign out
          </button>
        </div>

        {/* Mobile: bell + hamburger */}
        <div className="flex items-center gap-3 sm:hidden">
          <Link href="/notifications" className="relative text-zinc-400">
            🔔
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 text-zinc-400"
            aria-label="Menu"
          >
            <span className={`block h-0.5 w-5 bg-current transition-transform ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-current transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-current transition-transform ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-zinc-800 mt-3 pt-3 pb-2 space-y-1 px-4">
          <Link href="/c/new" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-zinc-300 hover:text-white">
            + Create Community
          </Link>
          <Link href="/saved" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-zinc-300 hover:text-white">
            Saved Posts
          </Link>
          <Link href={`/u/${profile.username}`} onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-zinc-300 hover:text-white">
            Profile ({profile.username})
          </Link>
          <Link href="/settings" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-zinc-300 hover:text-white">
            Settings
          </Link>
          {profile.is_platform_admin && (
            <>
              <Link href="/admin/reports" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-zinc-300 hover:text-white">
                Admin — Reports
              </Link>
              <Link href="/admin/users" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-zinc-300 hover:text-white">
                Admin — Users
              </Link>
            </>
          )}
          <button
            onClick={handleSignOut}
            className="block w-full py-2 text-left text-sm text-zinc-400 hover:text-red-400"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
