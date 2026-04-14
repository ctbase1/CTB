import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { banFromPlatform, unbanFromPlatform } from '@/lib/actions/moderation'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) notFound()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, is_banned, is_platform_admin, created_at')
    .order('created_at', { ascending: false })

  const allUsers = (users ?? []).filter(u => u.id !== user.id)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Users</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/communities" className="text-sm text-slate-400 hover:text-white">
            Communities →
          </Link>
          <Link href="/admin/reports" className="text-sm text-slate-400 hover:text-white">
            Reports →
          </Link>
          <Link href="/admin/audit-logs" className="text-sm text-slate-400 hover:text-white">
            Audit Log →
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {allUsers.map(u => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[var(--surface)] px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href={`/u/${u.username}`} className="text-sm font-medium text-white hover:underline">
                {u.username}
              </Link>
              {u.is_banned && (
                <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-xs text-red-400">banned</span>
              )}
              {u.is_platform_admin && (
                <span className="rounded bg-indigo-900/40 px-1.5 py-0.5 text-xs text-indigo-400">admin</span>
              )}
            </div>
            {!u.is_platform_admin && (
              <form
                action={async () => {
                  'use server'
                  if (u.is_banned) {
                    await unbanFromPlatform(u.id)
                  } else {
                    await banFromPlatform(u.id)
                  }
                }}
              >
                <button
                  type="submit"
                  className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
                    u.is_banned
                      ? 'border-slate-700 text-slate-400 hover:border-green-600 hover:text-green-400'
                      : 'border-slate-700 text-slate-400 hover:border-red-600 hover:text-red-400'
                  }`}
                >
                  {u.is_banned ? 'Unban' : 'Ban'}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
