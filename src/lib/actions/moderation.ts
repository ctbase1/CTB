'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function banFromCommunity(
  communityId: string,
  userId: string,
  communitySlug: string
): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['admin', 'moderator'].includes(membership.role)) {
    return { error: 'Unauthorized' }
  }

  // Remove membership
  await supabase
    .from('memberships')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId)

  // Insert ban
  const { error } = await supabase
    .from('community_bans')
    .insert({ community_id: communityId, user_id: userId, banned_by: user.id })

  if (error && !error.message.includes('duplicate')) return { error: error.message }

  revalidatePath(`/c/${communitySlug}`)
  return null
}

export async function unbanFromCommunity(
  communityId: string,
  userId: string,
  communitySlug: string
): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['admin', 'moderator'].includes(membership.role)) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('community_bans')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/c/${communitySlug}`)
  return null
}

export async function banFromPlatform(userId: string): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: true })
    .eq('id', userId)

  if (error) return { error: error.message }
  return null
}

export async function unbanFromPlatform(userId: string): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: false })
    .eq('id', userId)

  if (error) return { error: error.message }
  return null
}
