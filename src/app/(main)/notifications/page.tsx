import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const TYPE_LABEL: Record<string, string> = {
  comment: 'commented on your post',
  reply:   'replied to your comment',
  follow:  'followed you',
  like:    'liked your post',
}

export default async function NotificationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, actor:profiles!actor_id(username)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Mark all unread as read
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  const list = notifications ?? []

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-white">Notifications</h1>

      {list.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
          <p className="text-sm text-zinc-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map(n => {
            const actor = n.actor as { username: string } | null
            const isUnread = !n.read_at
            return (
              <Link
                key={n.id}
                href={n.target_url}
                className={`flex items-start gap-3 rounded-xl border p-4 transition-colors hover:border-zinc-700 ${
                  isUnread
                    ? 'border-indigo-800/50 bg-indigo-950/30'
                    : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                {isUnread && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                )}
                <div className={isUnread ? '' : 'ml-5'}>
                  <p className="text-sm text-zinc-300">
                    <span className="font-medium text-white">{actor?.username ?? 'Someone'}</span>
                    {' '}{TYPE_LABEL[n.type] ?? n.type}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
