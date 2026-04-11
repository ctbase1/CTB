import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function BannedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not authenticated → go to login
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .single()

  // Not actually banned → go home
  if (!profile?.is_banned) redirect('/')

  async function signOut() {
    'use server'
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-center">
      <h1 className="text-3xl font-bold text-red-400">Account Suspended</h1>
      <p className="max-w-md text-zinc-400">
        Your account has been banned from CBT Community. If you believe this is a mistake,
        contact support.
      </p>
      <form action={signOut}>
        <Button variant="secondary" type="submit">Sign out</Button>
      </form>
    </div>
  )
}
