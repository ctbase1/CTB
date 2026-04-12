'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleLike(
  targetId: string,
  targetType: 'post' | 'comment'
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .single()

  if (existing) {
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
  } else {
    await supabase
      .from('likes')
      .insert({ user_id: user.id, target_id: targetId, target_type: targetType })
  }
}
