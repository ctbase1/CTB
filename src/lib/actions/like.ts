'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

export async function toggleLike(
  targetId: string,
  targetType: 'post' | 'comment'
): Promise<{ error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const { data: existing } = await supabase
      .from('likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_id', targetId)
        .eq('target_type', targetType)
      if (error) return { error: 'Failed to unlike. Please try again.' }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: user.id, target_id: targetId, target_type: targetType })
      if (error) return { error: 'Failed to like. Please try again.' }

      // Notify post author on post like only
      if (targetType === 'post') {
        const { data: post } = await supabase
          .from('posts')
          .select('author_id, community_id, communities!community_id(slug)')
          .eq('id', targetId)
          .single()

        if (post) {
          const community = post.communities as { slug: string } | null
          const targetUrl = community ? `/c/${community.slug}/${targetId}` : '/'
          await createNotification(supabase, {
            userId:    post.author_id,
            actorId:   user.id,
            type:      'like',
            targetUrl,
          })
        }
      }
    }

    return {}
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}
