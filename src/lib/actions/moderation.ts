'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAuditLog } from '@/lib/audit'

export async function banFromCommunity(
  communityId: string,
  userId: string,
  communitySlug: string,
  expiresAt: string | null = null   // null = permanent
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

  // Delete any existing ban first, then insert fresh (handles re-banning expired users)
  await supabase
    .from('community_bans')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId)

  const { error } = await supabase
    .from('community_bans')
    .insert({ community_id: communityId, user_id: userId, banned_by: user.id, expires_at: expiresAt })

  if (error) return { error: error.message }

  await createAuditLog(supabase, {
    actorId:     user.id,
    action:      'community_ban',
    targetType:  'user',
    targetId:    userId,
    communityId,
    metadata:    { expires_at: expiresAt },
  })

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

  await createAuditLog(supabase, {
    actorId:     user.id,
    action:      'community_unban',
    targetType:  'user',
    targetId:    userId,
    communityId,
  })

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

  await createAuditLog(supabase, {
    actorId:    user.id,
    action:     'ban_user',
    targetType: 'user',
    targetId:   userId,
  })

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

  await createAuditLog(supabase, {
    actorId:    user.id,
    action:     'unban_user',
    targetType: 'user',
    targetId:   userId,
  })

  return null
}

export async function assignModerator(
  communityId: string,
  userId: string,
  communitySlug: string
): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Only the community admin (not platform admin) can assign mods
  const { data: callerMembership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  if (callerMembership?.role !== 'admin') return { error: 'Unauthorized' }

  // Target must be a current member
  const { data: targetMembership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .single()

  if (!targetMembership) return { error: 'User is not a member of this community' }
  if (targetMembership.role === 'admin') return { error: 'Cannot change role of community admin' }

  const { error } = await supabase
    .from('memberships')
    .update({ role: 'moderator' })
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  await createAuditLog(supabase, {
    actorId:     user.id,
    action:      'assign_mod',
    targetType:  'user',
    targetId:    userId,
    communityId,
  })

  revalidatePath(`/c/${communitySlug}/settings`)
  return null
}

export async function removeModerator(
  communityId: string,
  userId: string,
  communitySlug: string
): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: callerMembership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  if (callerMembership?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('memberships')
    .update({ role: 'member' })
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  await createAuditLog(supabase, {
    actorId:     user.id,
    action:      'remove_mod',
    targetType:  'user',
    targetId:    userId,
    communityId,
  })

  revalidatePath(`/c/${communitySlug}/settings`)
  return null
}
