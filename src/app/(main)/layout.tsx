import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/sidebar'
import { MobileHeader } from '@/components/mobile-header'
import { BottomTabBar } from '@/components/bottom-tab-bar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, { count: unreadCount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),
  ])

  const { data: profile } = profileResult
  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen bg-hero-glow text-[var(--foreground)]">
      {/* Desktop sidebar — hidden on mobile, shows from md+ */}
      <Sidebar profile={profile} unreadCount={unreadCount ?? 0} />

      {/* Content column — offset by sidebar width on md+ */}
      <div className="flex flex-col min-h-screen md:ml-16 lg:ml-64">
        {/* Mobile header — only visible on mobile */}
        <MobileHeader />

        {/* Page content */}
        <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6 pb-24 md:pb-6">
          {children}
        </main>

        {/* Desktop footer — hidden on mobile */}
        <footer className="hidden md:block border-t border-[var(--border)] mt-16">
          <div className="mx-auto max-w-2xl px-4 py-6 flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="text-xs font-semibold text-[var(--accent)]">CTB</span>
            <Link href="/terms"      className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Terms</Link>
            <Link href="/privacy"    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Privacy</Link>
            <Link href="/guidelines" className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Guidelines</Link>
            <span className="text-xs text-[var(--muted)] ml-auto">Not financial advice. DYOR.</span>
          </div>
        </footer>
      </div>

      {/* Mobile bottom tab bar — only visible on mobile */}
      <BottomTabBar profile={profile} unreadCount={unreadCount ?? 0} />
    </div>
  )
}
