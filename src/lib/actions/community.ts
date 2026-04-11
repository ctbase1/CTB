'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { slugify } from '@/lib/utils'

export async function createCommunity(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name        = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string).trim()
  const banner_url  = formData.get('banner_url') as string | null

  if (name.length < 3) {
    redirect('/c/new?error=' + encodeURIComponent('Community name must be at least 3 characters'))
  }
  if (name.length > 100) {
    redirect('/c/new?error=' + encodeURIComponent('Community name must be under 100 characters'))
  }
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
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
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
    redirect('/c/new?error=' + encodeURIComponent(error?.message ?? 'Failed to create community'))
  }

  revalidatePath('/')
  redirect(`/c/${community.slug}`)
}
