import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCommunityColor } from '@/lib/community-colors'
import { FollowButton } from '@/components/follow-button'

interface Props {
  userId: string
}

export async function RightPanel({ userId }: Props) {
  const supabase = createClient()

  // ── Hot Communities ──────────────────────────────────────────
  const { data: allMemberships } = await supabase
    .from('memberships')
    .select('community_id')

  const countMap = new Map<string, number>()
  for (const m of allMemberships ?? []) {
    countMap.set(m.community_id, (countMap.get(m.community_id) ?? 0) + 1)
  }

  const topCommunityIds = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => id)

  const { data: hotCommunities } = topCommunityIds.length > 0
    ? await supabase
        .from('communities')
        .select('id, name, slug')
        .in('id', topCommunityIds)
        .eq('is_removed', false)
    : { data: [] }

  const sortedHotCommunities = (hotCommunities ?? []).sort(
    (a, b) => (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0)
  )

  // ── Who To Follow ─────────────────────────────────────────────
  const { data: followingRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  const alreadyFollowing = new Set((followingRows ?? []).map(r => r.following_id))
  alreadyFollowing.add(userId)

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('author_id')
    .eq('is_removed', false)
    .gte('created_at', since)
    .limit(200)

  const postCountByAuthor = new Map<string, number>()
  for (const p of recentPosts ?? []) {
    if (!alreadyFollowing.has(p.author_id)) {
      postCountByAuthor.set(p.author_id, (postCountByAuthor.get(p.author_id) ?? 0) + 1)
    }
  }

  const topAuthorIds = Array.from(postCountByAuthor.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id)

  const { data: suggestedProfiles } = topAuthorIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', topAuthorIds)
    : { data: [] }

  const sortedSuggested = (suggestedProfiles ?? []).sort(
    (a, b) => (postCountByAuthor.get(b.id) ?? 0) - (postCountByAuthor.get(a.id) ?? 0)
  )

  return (
    <aside className="hidden xl:flex w-72 shrink-0 flex-col gap-5 sticky top-6 self-start py-6 pl-4">

      {/* Hot Communities */}
      {sortedHotCommunities.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
            Hot Communities
          </p>
          <div className="space-y-3">
            {sortedHotCommunities.map(c => {
              const color = getCommunityColor(c.slug)
              const members = countMap.get(c.id) ?? 0
              return (
                <Link
                  key={c.id}
                  href={`/c/${c.slug}`}
                  className="flex items-center gap-2.5 group"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: color.accent }}
                  />
                  <span className="flex-1 text-sm font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors truncate">
                    c/{c.slug}
                  </span>
                  <span className="text-xs text-[var(--muted)] shrink-0">
                    {members.toLocaleString()}
                  </span>
                </Link>
              )
            })}
          </div>
          <Link
            href="/feed?tab=communities"
            className="mt-3 block text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
          >
            View all →
          </Link>
        </div>
      )}

      {/* Who to Follow */}
      {sortedSuggested.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
            Who to Follow
          </p>
          <div className="space-y-3">
            {sortedSuggested.map(profile => {
              const postCount = postCountByAuthor.get(profile.id) ?? 0
              return (
                <div key={profile.id} className="flex items-center gap-2.5">
                  <Link href={`/u/${profile.username}`} className="shrink-0">
                    <div className="h-8 w-8 rounded-full bg-[var(--surface-raised)] overflow-hidden flex items-center justify-center text-xs font-bold text-[var(--muted-foreground)]">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                      ) : (
                        profile.username[0].toUpperCase()
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/u/${profile.username}`}
                      className="block text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors truncate"
                    >
                      {profile.username}
                    </Link>
                    <p className="text-[11px] text-[var(--muted)]">
                      {postCount} {postCount === 1 ? 'post' : 'posts'} this month
                    </p>
                  </div>
                  <FollowButton
                    targetUserId={profile.id}
                    initialFollowed={false}
                    currentUserId={userId}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

    </aside>
  )
}
