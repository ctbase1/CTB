'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, Users, Bell, Bookmark, User, Settings, LogOut, ShieldAlert } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

interface SidebarProps {
  profile: Profile
  unreadCount: number
}

export function Sidebar({ profile, unreadCount }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive(href)
        ? 'border-l-2 border-[var(--accent)] pl-[calc(0.75rem-2px)] text-[var(--accent)]'
        : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]'
    }`

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 border-r border-[var(--border)] bg-[var(--surface)] w-16 lg:w-64 transition-all">

      {/* Logo */}
      <div className="flex h-16 items-center justify-center lg:justify-start lg:px-4 border-b border-[var(--border)]">
        <Link
          href="/feed"
          className="text-lg font-bold tracking-tight text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          <span className="hidden lg:inline">CTB</span>
          <span className="lg:hidden text-xl">C</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <Link href="/feed" className={linkClass('/feed')} title="Home">
          <Home className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Home</span>
        </Link>

        <Link href="/search" className={linkClass('/search')} title="Search">
          <Search className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Search</span>
        </Link>

        <Link href="/feed?tab=communities" className={linkClass('/feed?tab=communities')} title="Communities">
          <Users className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Communities</span>
        </Link>

        <Link href="/notifications" className={linkClass('/notifications')} title="Notifications">
          <div className="relative">
            <Bell className="h-5 w-5 shrink-0" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[var(--accent)]" />
            )}
          </div>
          <span className="hidden lg:inline">Notifications</span>
          {unreadCount > 0 && (
            <span className="hidden lg:inline ml-auto text-xs font-medium bg-[var(--accent)] text-white rounded-full px-1.5 py-0.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <Link href="/saved" className={linkClass('/saved')} title="Saved">
          <Bookmark className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Saved</span>
        </Link>

        <Link href={`/u/${profile.username}`} className={linkClass(`/u/${profile.username}`)} title="Profile">
          <User className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline truncate">{profile.username}</span>
        </Link>

        {profile.is_platform_admin && (
          <Link href="/admin/reports" className={linkClass('/admin')} title="Admin">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span className="hidden lg:inline">Admin</span>
          </Link>
        )}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[var(--border)] py-4 px-2 space-y-1">
        <Link href="/settings" className={linkClass('/settings')} title="Settings">
          <Settings className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Settings</span>
        </Link>

        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <ThemeToggle />
          <span className="hidden lg:inline text-sm text-[var(--muted-foreground)]">Theme</span>
        </div>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-red-400 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Sign out</span>
        </button>
      </div>
    </aside>
  )
}
