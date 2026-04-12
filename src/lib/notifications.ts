import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type NotificationType = 'comment' | 'reply' | 'follow' | 'like'

const prefKeyMap: Record<NotificationType, 'comments' | 'replies' | 'likes' | 'follows'> = {
  comment: 'comments',
  reply:   'replies',
  like:    'likes',
  follow:  'follows',
}

export async function createNotification(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string
    actorId: string
    type: NotificationType
    targetUrl: string
  }
) {
  if (params.userId === params.actorId) return

  // Check recipient's notification preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_prefs')
    .eq('id', params.userId)
    .single()

  const prefKey = prefKeyMap[params.type]
  if (profile?.notification_prefs?.[prefKey] === false) return

  try {
    await supabase.from('notifications').insert({
      user_id:    params.userId,
      actor_id:   params.actorId,
      type:       params.type,
      target_url: params.targetUrl,
    })
  } catch (err) {
    console.error('[createNotification] failed:', err)
  }
}
