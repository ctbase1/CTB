'use server'

import { createClient } from '@/lib/supabase/server'

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
  }
}
