'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function joinCommunity(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const communityId   = formData.get('communityId') as string | null
  const communitySlug = formData.get('communitySlug') as string | null
  if (!communityId || !communitySlug) redirect('/')

  const { data: ban } = await supabase
    .from('community_bans')
    .select('expires_at')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  // Block only if ban is permanent (expires_at is null) or not yet expired
  if (ban && (ban.expires_at === null || new Date(ban.expires_at) > new Date())) {
    redirect(`/c/${communitySlug}?error=banned`)
  }

  await supabase.from('memberships').insert({
    user_id: user.id,
    community_id: communityId,
    role: 'member',
  })
  // Silently ignore duplicate membership error

  revalidatePath(`/c/${communitySlug}`)
  revalidatePath('/')
  redirect(`/c/${communitySlug}`)
}

export async function leaveCommunity(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const communityId   = formData.get('communityId') as string | null
  const communitySlug = formData.get('communitySlug') as string | null
  if (!communityId || !communitySlug) redirect('/')

  // Verify not admin (RLS also enforces, but check here for a clear error)
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('community_id', communityId)
    .single()

  if (membership?.role === 'admin') {
    redirect(`/c/${communitySlug}?error=admins-cannot-leave`)
  }

  await supabase
    .from('memberships')
    .delete()
    .eq('user_id', user.id)
    .eq('community_id', communityId)

  revalidatePath(`/c/${communitySlug}`)
  revalidatePath('/')
  redirect(`/c/${communitySlug}`)
}
