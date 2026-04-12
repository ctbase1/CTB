import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type NotificationType = 'comment' | 'reply' | 'follow' | 'like'

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
  await supabase.from('notifications').insert({
    user_id:    params.userId,
    actor_id:   params.actorId,
    type:       params.type,
    target_url: params.targetUrl,
  })
}
