import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { adminToggleCommunityRemoved } from '@/lib/actions/community'
import Link from 'next/link'

export default async function AdminCommunitiesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) notFound()

  const [{ data: communities }, { data: allMemberships }] = await Promise.all([
    supabase
      .from('communities')
      .select('*, creator:profiles!created_by(username)')
      .order('created_at', { ascending: false }),
    supabase
      .from('memberships')
      .select('community_id'),
  ])

  // Build member count map
  const countMap = new Map<string, number>()
  for (const m of allMemberships ?? []) {
    countMap.set(m.community_id, (countMap.get(m.community_id) ?? 0) + 1)
  }

  const rows = communities ?? []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Communities</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/users" className="text-sm text-zinc-400 hover:text-white">
            Users →
          </Link>
          <Link href="/admin/reports" className="text-sm text-zinc-400 hover:text-white">
            Reports →
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map(c => {
          const creator = (c as typeof c & { creator: { username: string } | null }).creator
          return (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <Link href={`/c/${c.slug}`} className="text-sm font-medium text-white hover:underline">
                    c/{c.slug}
                  </Link>
                  {c.is_removed ? (
                    <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-xs text-red-400">removed</span>
                  ) : (
                    <span className="rounded bg-green-900/40 px-1.5 py-0.5 text-xs text-green-400">active</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">
                  by {creator?.username ?? 'unknown'} &middot; {countMap.get(c.id) ?? 0} members &middot; {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>

              <form
                action={async () => {
                  'use server'
                  await adminToggleCommunityRemoved(c.id, !c.is_removed)
                }}
              >
                <button
                  type="submit"
                  className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
                    c.is_removed
                      ? 'border-zinc-700 text-zinc-400 hover:border-green-600 hover:text-green-400'
                      : 'border-zinc-700 text-zinc-400 hover:border-red-600 hover:text-red-400'
                  }`}
                >
                  {c.is_removed ? 'Restore' : 'Remove'}
                </button>
              </form>
            </div>
          )
        })}

        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">No communities yet.</p>
        )}
      </div>
    </div>
  )
}
