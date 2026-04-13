'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createNotification } from '@/lib/notifications'
import { sanitizeText } from '@/lib/sanitize'
import { createAuditLog } from '@/lib/audit'

export async function createComment(
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to comment' }

  const postId        = formData.get('post_id') as string
  const parentId      = (formData.get('parent_id') as string) || null
  const communitySlug = formData.get('community_slug') as string

  let body: string
  try {
    body = sanitizeText((formData.get('body') as string) ?? '', { min: 1, max: 2000 })
  } catch (e) {
    return { error: (e as Error).message }
  }
  if (!postId) return { error: 'Invalid post' }

  const { data: post } = await supabase
    .from('posts')
    .select('community_id, author_id')
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

  const targetUrl = `/c/${communitySlug}/${postId}`

  if (parentId) {
    // Reply — notify the parent comment author
    const { data: parentComment } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', parentId)
      .single()
    if (parentComment) {
      await createNotification(supabase, {
        userId:    parentComment.author_id,
        actorId:   user.id,
        type:      'reply',
        targetUrl,
      })
    }
  } else {
    // Top-level comment — notify the post author
    await createNotification(supabase, {
      userId:    post.author_id,
      actorId:   user.id,
      type:      'comment',
      targetUrl,
    })
  }

  revalidatePath(targetUrl)
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

  await createAuditLog(supabase, {
    actorId:    user.id,
    action:     'delete_comment',
    targetType: 'comment',
    targetId:   commentId,
  })

  revalidatePath(`/c/${communitySlug}/${postId}`)
  redirect(`/c/${communitySlug}/${postId}`)
}

export async function updateComment(
  commentId: string,
  body: string,
  communitySlug: string,
  postId: string
): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in' }

  const { data: comment } = await supabase
    .from('comments')
    .select('author_id, created_at')
    .eq('id', commentId)
    .eq('is_removed', false)
    .single()

  if (!comment) return { error: 'Comment not found' }
  if (comment.author_id !== user.id) return { error: 'Not your comment' }

  const ageMs = Date.now() - new Date(comment.created_at).getTime()
  if (ageMs > 15 * 60 * 1000) return { error: 'Edit window has closed (15 minutes)' }

  let sanitized: string
  try {
    sanitized = sanitizeText(body, { min: 1, max: 2000 })
  } catch (e) {
    return { error: (e as Error).message }
  }

  const { error } = await supabase
    .from('comments')
    .update({ body: sanitized, edited_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('author_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/c/${communitySlug}/${postId}`)
  return null
}
