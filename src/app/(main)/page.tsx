import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CommunityCard } from '@/components/community-card'
import type { Community, Membership } from '@/types/database'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // My communities: get memberships then fetch community rows
  let myCommunities: Community[] = []
  let membershipMap = new Map<string, Pick<Membership, 'role'>>()

  if (user) {
    const { data: memberships } = await supabase
      .from('memberships')
      .select('community_id, role')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    if (memberships && memberships.length > 0) {
      const ids = memberships.map(m => m.community_id)
      membershipMap = new Map(memberships.map(m => [m.community_id, { role: m.role }]))

      const { data: communities } = await supabase
        .from('communities')
        .select('*')
        .in('id', ids)
        .eq('is_removed', false)

      // Preserve join order
      const communityById = new Map((communities ?? []).map(c => [c.id, c]))
      myCommunities = ids.flatMap(id => { const c = communityById.get(id); return c ? [c] : [] })
    }
  }

  // Discover: communities not already joined, newest first
  const myIds = myCommunities.map(c => c.id)
  let discoverQuery = supabase
    .from('communities')
    .select('*')
    .eq('is_removed', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (myIds.length > 0) {
    discoverQuery = discoverQuery.not('id', 'in', `(${myIds.join(',')})`)
  }

  const { data: rawDiscover } = await discoverQuery
  const discoverCommunities = rawDiscover ?? []

  return (
    <div className="space-y-10">
      {/* My Communities */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">My Communities</h2>
          <Link href="/c/new" className="text-sm text-indigo-400 hover:underline">
            + Create
          </Link>
        </div>

        {myCommunities.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-zinc-400 mb-2">You haven&apos;t joined any communities yet.</p>
            <p className="text-sm text-zinc-500">Discover communities below to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myCommunities.map(c => (
              <CommunityCard
                key={c.id}
                community={c}
                membership={membershipMap.get(c.id) ?? null}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        )}
      </section>

      {/* Discover */}
      {discoverCommunities.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Discover</h2>
          <div className="space-y-2">
            {discoverCommunities.map(c => (
              <CommunityCard
                key={c.id}
                community={c}
                membership={null}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state when no communities exist at all */}
      {myCommunities.length === 0 && discoverCommunities.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-400 mb-4">No communities yet.</p>
          <Link href="/c/new" className="text-indigo-400 hover:underline text-sm">
            Be the first to create one →
          </Link>
        </div>
      )}
    </div>
  )
}
