'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react'
import type { Profile } from '@/types/database'

interface BottomTabBarProps {
  profile: Profile
  unreadCount: number
}

export function BottomTabBar({ profile, unreadCount }: BottomTabBarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const tabClass = (href: string) =>
    `relative flex flex-col items-center justify-center gap-1 flex-1 py-3 text-xs font-medium transition-colors ${
      isActive(href)
        ? 'text-[var(--accent)]'
        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
    }`

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
      <div className="flex w-full items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Link href="/feed" className={tabClass('/feed')}>
          {isActive('/feed') && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[var(--accent)]" />}
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link href="/search" className={tabClass('/search')}>
          {isActive('/search') && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[var(--accent)]" />}
          <Search className="h-5 w-5" />
          <span>Search</span>
        </Link>

        <Link
          href="/c/new"
          className="flex flex-col items-center justify-center gap-1 flex-1 py-3 text-xs font-medium"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--accent)] text-white">
            <PlusCircle className="h-5 w-5" />
          </span>
          <span className="text-[var(--accent)]">Create</span>
        </Link>

        <Link href="/notifications" className={tabClass('/notifications')}>
          {isActive('/notifications') && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[var(--accent)]" />}
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--accent)]" />
            )}
          </div>
          <span>Alerts</span>
        </Link>

        <Link href={`/u/${profile.username}`} className={tabClass(`/u/${profile.username}`)}>
          {isActive(`/u/${profile.username}`) && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[var(--accent)]" />}
          <User className="h-5 w-5" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  )
}
