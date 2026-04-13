import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'

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
    <div className="min-h-screen bg-hero-glow text-white">
      <Navbar profile={profile} unreadCount={unreadCount ?? 0} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-slate-800 mt-16">
        <div className="mx-auto max-w-4xl px-4 py-6 flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="text-xs font-semibold text-violet-500">CTB</span>
          <Link href="/terms"      className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Terms</Link>
          <Link href="/privacy"    className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Privacy</Link>
          <Link href="/guidelines" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Guidelines</Link>
          <span className="text-xs text-slate-700 ml-auto">Not financial advice. DYOR.</span>
        </div>
      </footer>
    </div>
  )
}
