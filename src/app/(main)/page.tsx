import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CommunityCard } from '@/components/community-card'
import { PostCard } from '@/components/post-card'
import type { Membership } from '@/types/database'

interface Props {
  searchParams: { tab?: string }
}

const TABS = [
  { id: 'feed', label: 'My Feed' },
  { id: 'all', label: 'All' },
  { id: 'communities', label: 'Communities' },
]

export default async function HomePage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Always fetch memberships — needed for tab defaulting + feed tab + admin badges
  let myIds: string[] = []
  let membershipMap = new Map<string, Pick<Membership, 'role'>>()

  if (user) {
    const { data: memberships } = await supabase
      .from('memberships')
      .select('community_id, role')
      .eq('user_id', user.id)

    if (memberships && memberships.length > 0) {
      myIds = memberships.map(m => m.community_id)
      membershipMap = new Map(memberships.map(m => [m.community_id, { role: m.role }]))
    }
  }

  // Determine active tab
  const defaultTab = user && myIds.length > 0 ? 'feed' : 'communities'
  const tab = searchParams.tab ?? defaultTab

  // --- Data fetching per tab ---
  type FeedPost = {
    id: string
    title: string
    body: string | null
    image_url: string | null
    created_at: string
    edited_at?: string | null
    flair?: string | null
    is_pinned?: boolean
    link_preview?: { title: string | null; description: string | null; image_url: string | null; url: string } | null
    author: { username: string } | null
    community: { name: string; slug: string } | null
  }

  let posts: FeedPost[] = []
  const likeCountMap = new Map<string, number>()
  const commentCountMap = new Map<string, number>()
  const savedPostIds = new Set<string>()

  type CommunityRow = { id: string; name: string; slug: string; description: string | null; banner_url: string | null; created_by: string; is_removed: boolean; created_at: string; allowed_flairs: string[]; rules: { title: string; body: string }[] }
  let allCommunities: CommunityRow[] = []
  const communityMemberCountMap = new Map<string, number>()

  if (tab === 'feed') {
    if (myIds.length > 0) {
      const { data: rawPosts } = await supabase
        .from('posts')
        .select('*, author:profiles!author_id(username), community:communities!community_id(name,slug)')
        .in('community_id', myIds)
        .eq('is_removed', false)
        .order('created_at', { ascending: false })
        .limit(20)

      posts = (rawPosts ?? []) as FeedPost[]
    }
  } else if (tab === 'all') {
    const { data: rawPosts } = await supabase
      .from('posts')
      .select('*, author:profiles!author_id(username), community:communities!community_id(name,slug)')
      .eq('is_removed', false)
      .order('created_at', { ascending: false })
      .limit(20)

    posts = (rawPosts ?? []) as FeedPost[]
  } else {
    // communities tab
    const { data: communities } = await supabase
      .from('communities')
      .select('*')
      .eq('is_removed', false)
      .order('created_at', { ascending: false })

    allCommunities = (communities ?? []) as CommunityRow[]

    if (allCommunities.length > 0) {
      const { data: allMemberships } = await supabase
        .from('memberships')
        .select('community_id')

      for (const m of allMemberships ?? []) {
        communityMemberCountMap.set(m.community_id, (communityMemberCountMap.get(m.community_id) ?? 0) + 1)
      }
    }
  }

  // Bulk like + comment counts + saved state for post tabs
  if (posts.length > 0) {
    const postIds = posts.map(p => p.id)
    const [likeResult, commentResult, savedResult] = await Promise.all([
      supabase.from('likes').select('target_id').eq('target_type', 'post').in('target_id', postIds),
      supabase.from('comments').select('post_id').eq('is_removed', false).in('post_id', postIds),
      user
        ? supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds)
        : Promise.resolve({ data: null }),
    ])
    const likeRows    = likeResult.data
    const commentRows = commentResult.data
    const savedRows   = savedResult.data

    for (const { target_id } of likeRows ?? []) {
      likeCountMap.set(target_id, (likeCountMap.get(target_id) ?? 0) + 1)
    }
    for (const { post_id } of commentRows ?? []) {
      commentCountMap.set(post_id, (commentCountMap.get(post_id) ?? 0) + 1)
    }
    for (const { post_id } of savedRows ?? []) {
      savedPostIds.add(post_id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {TABS.map(t => (
            <Link
              key={t.id}
              href={`/?tab=${t.id}`}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        {user && (
          <Link href="/c/new" className="text-sm text-indigo-400 hover:underline">
            + Create
          </Link>
        )}
      </div>

      {/* My Feed tab */}
      {tab === 'feed' && (
        <div className="space-y-3">
          {myIds.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-zinc-400 mb-2">You haven&apos;t joined any communities yet.</p>
              <Link href="/?tab=communities" className="text-sm text-indigo-400 hover:underline">
                Browse communities →
              </Link>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-zinc-400">No posts yet in your communities.</p>
            </div>
          ) : (
            posts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                likeCount={likeCountMap.get(p.id) ?? 0}
                commentCount={commentCountMap.get(p.id) ?? 0}
                communitySlug={p.community?.slug ?? ''}
                isSaved={savedPostIds.has(p.id)}
                userId={user?.id ?? null}
              />
            ))
          )}
        </div>
      )}

      {/* All tab */}
      {tab === 'all' && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-zinc-400">No posts yet.</p>
            </div>
          ) : (
            posts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                likeCount={likeCountMap.get(p.id) ?? 0}
                commentCount={commentCountMap.get(p.id) ?? 0}
                communitySlug={p.community?.slug ?? ''}
                isSaved={savedPostIds.has(p.id)}
                userId={user?.id ?? null}
              />
            ))
          )}
        </div>
      )}

      {/* Communities tab */}
      {tab === 'communities' && (
        <div className="space-y-2">
          {allCommunities.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
              <p className="mb-4 text-sm text-zinc-500">No communities yet.</p>
              {user && (
                <Link href="/c/new" className="text-sm text-indigo-400 hover:underline">
                  Be the first to create one →
                </Link>
              )}
            </div>
          ) : (
            allCommunities.map(c => (
              <CommunityCard
                key={c.id}
                community={c}
                membership={membershipMap.get(c.id) ?? null}
                isLoggedIn={!!user}
                memberCount={communityMemberCountMap.get(c.id) ?? 0}
                isAdmin={membershipMap.get(c.id)?.role === 'admin'}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
