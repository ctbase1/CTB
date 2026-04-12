'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createComment(
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to comment' }

  const postId        = formData.get('post_id') as string
  const parentId      = (formData.get('parent_id') as string) || null
  const body          = ((formData.get('body') as string) ?? '').trim()
  const communitySlug = formData.get('community_slug') as string

  if (!body)           return { error: 'Comment cannot be empty' }
  if (body.length > 2000) return { error: 'Comment must be under 2000 characters' }
  if (!postId)         return { error: 'Invalid post' }

  const { data: post } = await supabase
    .from('posts')
    .select('community_id')
    .eq('id', postId)
    .eq('is_removed', false)
    .single()

  if (!post) return { error: 'Post not found' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', post.community_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) return { error: 'You must be a member to comment' }

  const { error } = await supabase
    .from('comments')
    .insert({ post_id: postId, author_id: user.id, parent_id: parentId, body })

  if (error) return { error: error.message }

  revalidatePath(`/c/${communitySlug}/${postId}`)
  return null
}

export async function deleteComment(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const commentId     = formData.get('comment_id') as string
  const postId        = formData.get('post_id') as string
  const communitySlug = formData.get('community_slug') as string

  const { data: comment } = await supabase
    .from('comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (!comment) redirect(`/c/${communitySlug}/${postId}`)

  const isOwner = comment.author_id === user.id
  if (!isOwner) {
    const { data: post } = await supabase
      .from('posts')
      .select('community_id')
      .eq('id', postId)
      .single()

    if (post) {
      const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('community_id', post.community_id)
        .eq('user_id', user.id)
        .single()

      const canDelete = membership?.role === 'admin' || membership?.role === 'moderator'
      if (!canDelete) redirect(`/c/${communitySlug}/${postId}`)
    }
  }

  await supabase.from('comments').update({ is_removed: true }).eq('id', commentId)

  revalidatePath(`/c/${communitySlug}/${postId}`)
  redirect(`/c/${communitySlug}/${postId}`)
}
