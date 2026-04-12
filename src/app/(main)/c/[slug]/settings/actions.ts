'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireAdmin(communityId: string, fallbackSlug: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') redirect(`/c/${fallbackSlug}`)

  return supabase
}

export async function updateCommunity(formData: FormData) {
  const communityId = formData.get('communityId') as string
  const slug        = formData.get('slug') as string
  const supabase    = await requireAdmin(communityId, slug)

  const name        = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string).trim()
  const banner_url  = formData.get('banner_url') as string | null

  if (name.length < 3) {
    redirect(`/c/${slug}/settings?error=` + encodeURIComponent('Name must be at least 3 characters'))
  }
  if (banner_url && !banner_url.startsWith('https://res.cloudinary.com/')) {
    redirect(`/c/${slug}/settings?error=` + encodeURIComponent('Invalid banner URL'))
  }

  const { error } = await supabase
    .from('communities')
    .update({
      name,
      description: description || null,
      ...(banner_url ? { banner_url } : {}),
    })
    .eq('id', communityId)

  if (error) {
    redirect(`/c/${slug}/settings?error=` + encodeURIComponent(error.message))
  }

  revalidatePath(`/c/${slug}`)
  revalidatePath(`/c/${slug}/settings`)
  redirect(`/c/${slug}/settings?success=1`)
}

export async function deleteCommunity(formData: FormData) {
  const communityId = formData.get('communityId') as string
  const slug        = formData.get('slug') as string
  const supabase    = await requireAdmin(communityId, slug)

  const { error } = await supabase
    .from('communities')
    .update({ is_removed: true })
    .eq('id', communityId)

  if (error) {
    redirect(`/c/${slug}/settings?error=` + encodeURIComponent(error.message))
  }

  revalidatePath('/')
  redirect('/')
}
