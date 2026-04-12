'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

interface NavbarProps {
  profile: Profile
}

export function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <Link href="/" className="text-lg font-bold text-white">
          CBT
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/notifications" className="text-sm text-zinc-400 hover:text-white">
            Notifications
          </Link>
          <Link href="/c/new" className="text-sm text-zinc-400 hover:text-white">
            + Create
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
      </div>
    </nav>
  )
}
