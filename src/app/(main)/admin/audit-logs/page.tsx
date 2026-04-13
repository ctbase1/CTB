import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const ACTION_LABELS: Record<string, string> = {
  ban_user:        'Platform ban',
  unban_user:      'Platform unban',
  community_ban:   'Community ban',
  community_unban: 'Community unban',
  delete_post:     'Deleted post',
  delete_comment:  'Deleted comment',
  resolve_report:  'Resolved report',
  assign_mod:      'Assigned moderator',
  remove_mod:      'Removed moderator',
}

export default async function AuditLogsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) notFound()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, actor:profiles!actor_id(username)')
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = logs ?? []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Audit Log</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/users" className="text-sm text-zinc-400 hover:text-white">
            Users →
          </Link>
          <Link href="/admin/reports" className="text-sm text-zinc-400 hover:text-white">
            Reports →
          </Link>
          <Link href="/admin/communities" className="text-sm text-zinc-400 hover:text-white">
            Communities →
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
          <p className="text-sm text-zinc-500">No audit log entries yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(log => {
            const actor = log.actor as { username: string } | null
            return (
              <div
                key={log.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="text-sm text-white">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </p>
                  <p className="text-xs text-zinc-500">
                    by{' '}
                    {actor?.username ? (
                      <a href={`/u/${actor.username}`} className="font-medium text-zinc-300 hover:text-violet-400 transition-colors">{actor.username}</a>
                    ) : (
                      <span className="font-medium text-zinc-300">unknown</span>
                    )}
                    {log.target_type && (
                      <>
                        {' · '}
                        <span>{log.target_type}</span>
                      </>
                    )}
                    {log.target_id && (
                      <>
                        {' · '}
                        <span className="font-mono text-zinc-600">{log.target_id.slice(0, 8)}&hellip;</span>
                      </>
                    )}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-zinc-600">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
