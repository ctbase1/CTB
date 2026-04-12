'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { Bell, Bookmark, Settings, LogOut, PlusCircle, Search, User, Menu, X, ShieldAlert } from 'lucide-react'

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
    <nav className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center gap-4">

        {/* Logo */}
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-violet-400 hover:text-violet-300 transition-colors">
          CBT
        </Link>

        {/* Search — pill shaped */}
        <form action="/search" className="flex flex-1 items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            <input
              name="q"
              type="search"
              placeholder="Search communities, posts…"
              className="w-full rounded-full border border-slate-700 bg-slate-800 pl-9 pr-4 py-1.5 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 sm:flex">
          <Link
            href="/c/new"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create</span>
          </Link>

          <Link
            href="/notifications"
            className="relative flex items-center rounded-lg px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-slate-900" />
            )}
          </Link>

          <Link
            href="/saved"
            className="flex items-center rounded-lg px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Saved"
          >
            <Bookmark className="h-4 w-4" />
          </Link>

          <Link
            href={`/u/${profile.username}`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <User className="h-4 w-4" />
            <span className="max-w-[80px] truncate">{profile.username}</span>
          </Link>

          <Link
            href="/settings"
            className="flex items-center rounded-lg px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center rounded-lg px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile: bell + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link href="/notifications" className="relative flex items-center rounded-lg p-2 text-slate-400" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-slate-900" />
            )}
          </Link>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-700/50 mt-3 pt-3 pb-2 space-y-0.5 px-4 animate-fade-in">
          <Link
            href="/c/new"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <PlusCircle className="h-4 w-4 text-violet-400" />
            Create Community
          </Link>
          <Link
            href="/saved"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Bookmark className="h-4 w-4 text-violet-400" />
            Saved Posts
          </Link>
          <Link
            href={`/u/${profile.username}`}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <User className="h-4 w-4 text-violet-400" />
            Profile ({profile.username})
          </Link>
          <Link
            href="/settings"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Settings className="h-4 w-4 text-violet-400" />
            Settings
          </Link>
          {profile.is_platform_admin && (
            <Link
              href="/admin/reports"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ShieldAlert className="h-4 w-4 text-violet-400" />
              Admin Panel
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
