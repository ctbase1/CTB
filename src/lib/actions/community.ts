'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { slugify } from '@/lib/utils'
import { sanitizeText } from '@/lib/sanitize'

export async function adminToggleCommunityRemoved(communityId: string, remove: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) return

  await supabase
    .from('communities')
    .update({ is_removed: remove })
    .eq('id', communityId)

  revalidatePath('/admin/communities')
}

export async function createCommunity(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let name: string
  try {
    name = sanitizeText((formData.get('name') as string) ?? '', { min: 3, max: 100 })
  } catch (e) {
    redirect('/c/new?error=' + encodeURIComponent((e as Error).message))
  }
  const rawDesc    = ((formData.get('description') as string) ?? '').trim()
  const description = rawDesc ? rawDesc.slice(0, 300) : ''
  const banner_url  = (formData.get('banner_url') as string) || null

  if (banner_url && !banner_url.startsWith('https://res.cloudinary.com/')) {
    redirect('/c/new?error=' + encodeURIComponent('Invalid banner URL'))
  }

  let slug = slugify(name)
  if (!slug) {
    redirect('/c/new?error=' + encodeURIComponent('Community name contains no valid characters'))
  }

  // Ensure slug uniqueness
  const { data: existing } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    // Try up to 3 suffixed candidates; DB unique constraint is the final safety net
    let resolved = false
    for (let i = 0; i < 3 && !resolved; i++) {
      const candidate = `${slug}-${Math.random().toString(36).slice(2, 6)}`
      const { data: taken } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', candidate)
        .single()
      if (!taken) {
        slug = candidate
        resolved = true
      }
    }
  }

  const { data: community, error } = await supabase
    .from('communities')
    .insert({
      name,
      slug,
      description: description || null,
      banner_url: banner_url || null,
      created_by: user.id,
    })
    .select('slug')
    .single()

  if (error || !community) {
    const msg = error?.code === '23505'
      ? 'That community name is already taken'
      : (error?.message ?? 'Failed to create community')
    redirect('/c/new?error=' + encodeURIComponent(msg))
  }

  revalidatePath('/')
  redirect(`/c/${community.slug}`)
}

export async function setMemberFlair(communityId: string, flair: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const cleanFlair = flair.trim().slice(0, 40)

  const { error } = await supabase
    .from('memberships')
    .update({ flair: cleanFlair || null })
    .eq('community_id', communityId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/c`)
  return { success: true }
}

export async function clearMemberFlair(communityId: string, userId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify caller is a mod/admin
  const { data: callerMembership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  if (!callerMembership || !['admin', 'moderator'].includes(callerMembership.role)) {
    return { error: 'Not authorized' }
  }

  await supabase
    .from('memberships')
    .update({ flair: null })
    .eq('community_id', communityId)
    .eq('user_id', userId)

  revalidatePath(`/c`)
  return { success: true }
}
