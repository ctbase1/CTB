'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

export async function toggleFollow(followingId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single()

  if (existing) {
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
  } else {
    await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: followingId })

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
}
