'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const username   = (formData.get('username') as string).trim().toLowerCase()
  const bio        = (formData.get('bio') as string).trim()
  const avatar_url = formData.get('avatar_url') as string | null

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    redirect('/settings?error=' + encodeURIComponent('Username must be 3-20 chars: letters, numbers, underscores only'))
  }

  // Check username availability (exclude self)
  const { data: taken } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .single()

  if (taken) {
    redirect('/settings?error=' + encodeURIComponent('Username already taken'))
  }

  const update = { username, bio: bio || null, ...(avatar_url ? { avatar_url } : {}) }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) {
    redirect('/settings?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/settings')
  revalidatePath(`/u/${username}`)
  redirect('/settings?success=1')
}
