import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export async function LandingNavbar() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          CTB
        </Link>

        <div className="flex-1" />

        <ThemeToggle />

        {user ? (
          <Link
            href="/feed"
            className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Go to Feed
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Join CTB
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
