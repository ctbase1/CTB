'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slug      = formData.get('community_slug') as string
  const title     = ((formData.get('title') as string) ?? '').trim()
  const body      = ((formData.get('body') as string) ?? '').trim() || null
  const image_url = (formData.get('image_url') as string) || null

  if (title.length < 3) {
    redirect(`/c/${slug}/submit?error=` + encodeURIComponent('Title must be at least 3 characters'))
  }
  if (title.length > 300) {
    redirect(`/c/${slug}/submit?error=` + encodeURIComponent('Title must be under 300 characters'))
  }
  if (image_url && !image_url.startsWith('https://res.cloudinary.com/')) {
    redirect(`/c/${slug}/submit?error=` + encodeURIComponent('Invalid image URL'))
  }

  const { data: community } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', slug)
    .eq('is_removed', false)
    .single()

  if (!community) redirect('/')

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', community.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect(`/c/${slug}/submit?error=` + encodeURIComponent('You must be a member to post'))
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({ community_id: community.id, author_id: user.id, title, body, image_url })
    .select('id')
    .single()

  if (error || !post) {
    redirect(`/c/${slug}/submit?error=` + encodeURIComponent(error?.message ?? 'Failed to create post'))
  }

  revalidatePath(`/c/${slug}`)
  redirect(`/c/${slug}/${post.id}`)
}

export async function deletePost(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postId        = formData.get('post_id') as string
  const communitySlug = formData.get('community_slug') as string

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, community_id')
    .eq('id', postId)
    .single()

  if (!post) redirect(`/c/${communitySlug}`)

  const isOwner = post.author_id === user.id
  if (!isOwner) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('community_id', post.community_id)
      .eq('user_id', user.id)
      .single()

    const canDelete = membership?.role === 'admin' || membership?.role === 'moderator'
    if (!canDelete) redirect(`/c/${communitySlug}`)
  }

  await supabase.from('posts').update({ is_removed: true }).eq('id', postId)

  revalidatePath(`/c/${communitySlug}`)
  redirect(`/c/${communitySlug}`)
}
