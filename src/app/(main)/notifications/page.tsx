import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Heart, MessageSquare, UserPlus, Flag, Bell } from 'lucide-react'

const TYPE_LABEL: Record<string, string> = {
  comment: 'commented on your post',
  reply:   'replied to your comment',
  follow:  'followed you',
  like:    'liked your post',
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  comment: <MessageSquare className="h-4 w-4 text-violet-400" />,
  reply:   <MessageSquare className="h-4 w-4 text-violet-400" />,
  follow:  <UserPlus className="h-4 w-4 text-violet-400" />,
  like:    <Heart className="h-4 w-4 text-violet-400" />,
  report:  <Flag className="h-4 w-4 text-red-400" />,
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
      <div className="mb-6 flex items-center gap-2">
        <Bell className="h-5 w-5 text-violet-400" />
        <h1 className="text-xl font-bold text-white">Notifications</h1>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900 py-16 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-slate-700" />
          <p className="text-sm font-medium text-slate-400">You&apos;re all caught up</p>
          <p className="mt-1 text-xs text-slate-600">Notifications from likes, comments, and follows will appear here.</p>
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
                className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                  isUnread
                    ? 'border-l-2 border-violet-500 border-t-slate-700/50 border-r-slate-700/50 border-b-slate-700/50 bg-violet-950/20 hover:bg-violet-950/30'
                    : 'border-l-2 border-transparent border-t-slate-700/50 border-r-slate-700/50 border-b-slate-700/50 bg-slate-900 hover:border-l-slate-600'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {TYPE_ICON[n.type] ?? <Bell className="h-4 w-4 text-slate-400" />}
                </div>
                <div>
                  <p className="text-sm text-slate-300">
                    <span className="font-medium text-white">{actor?.username ?? 'Someone'}</span>
                    {' '}{TYPE_LABEL[n.type] ?? n.type}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
                {isUnread && (
                  <span className="ml-auto mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
