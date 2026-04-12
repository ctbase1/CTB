import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'

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
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar profile={profile} unreadCount={unreadCount ?? 0} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
