'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

export async function toggleFollow(followingId: string): Promise<{ error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const { data: existing } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
      if (error) return { error: 'Failed to unfollow. Please try again.' }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: followingId })
      if (error) return { error: 'Failed to follow. Please try again.' }

      // Fetch actor username for the notification target URL
      const { data: actor } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      await createNotification(supabase, {
        userId:    followingId,
        actorId:   user.id,
        type:      'follow',
        targetUrl: `/u/${actor?.username ?? ''}`,
      })
    }

    return {}
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}
