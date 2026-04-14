import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CommunityCard } from '@/components/community-card'
import { PostCard } from '@/components/post-card'
import { PostCardSkeleton, CommunityCardSkeleton } from '@/components/ui/skeleton'
import { StaggeredList } from '@/components/staggered-list'
import { FadeIn } from '@/components/page-transition'
import type { Membership } from '@/types/database'

interface Props {
  searchParams: { tab?: string; limit?: string; sort?: string }
}

function PostListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => <PostCardSkeleton key={i} />)}
    </div>
  )
}

function CommunityListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => <CommunityCardSkeleton key={i} />)}
    </div>
  )
}

const TABS = [
  { id: 'feed', label: 'My Feed' },
  { id: 'all', label: 'All' },
  { id: 'communities', label: 'Communities' },
]

export default async function FeedPage({ searchParams }: Props) {
  const rawLimit = parseInt(searchParams.limit ?? '', 10)
  const pageLimit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 20), 100)
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
    view_count: number
    author: { username: string } | null
    community: { name: string; slug: string } | null
  }

  let posts: FeedPost[] = []
  const likeCountMap  = new Map<string, number>()
  const commentCountMap = new Map<string, number>()
  const savedPostIds  = new Set<string>()
  const likedPostIds  = new Set<string>()

  type CommunityRow = { id: string; name: string; slug: string; description: string | null; banner_url: string | null; created_by: string; is_removed: boolean; created_at: string; allowed_flairs: string[]; rules: { title: string; body: string }[] }
  let allCommunities: CommunityRow[] = []
  const communityMemberCountMap = new Map<string, number>()

  if (tab === 'feed') {
    if (myIds.length > 0) {
      const { data: rawPosts } = await supabase
        .from('posts')
        .select('*, view_count, author:profiles!author_id(username), community:communities!community_id(name,slug)')
        .in('community_id', myIds)
        .eq('is_removed', false)
        .order('created_at', { ascending: false })
        .limit(pageLimit)

      posts = (rawPosts ?? []) as FeedPost[]
    }
  } else if (tab === 'all') {
    const { data: rawPosts } = await supabase
      .from('posts')
      .select('*, view_count, author:profiles!author_id(username), community:communities!community_id(name,slug)')
      .eq('is_removed', false)
      .order('created_at', { ascending: false })
      .limit(pageLimit)

    posts = (rawPosts ?? []) as FeedPost[]
  } else {
    // communities tab
    const sort = (searchParams.sort ?? 'newest') as 'newest' | 'members' | 'alpha'

    const communitiesQuery = supabase
      .from('communities')
      .select('*')
      .eq('is_removed', false)

    if (sort === 'alpha') {
      communitiesQuery.order('name', { ascending: true })
    } else {
      communitiesQuery.order('created_at', { ascending: false })
    }

    const { data: communities } = await communitiesQuery
    allCommunities = (communities ?? []) as CommunityRow[]

    if (allCommunities.length > 0) {
      const { data: allMemberships } = await supabase
        .from('memberships')
        .select('community_id')

      for (const m of allMemberships ?? []) {
        communityMemberCountMap.set(m.community_id, (communityMemberCountMap.get(m.community_id) ?? 0) + 1)
      }

      if (sort === 'members') {
        allCommunities.sort((a, b) =>
          (communityMemberCountMap.get(b.id) ?? 0) - (communityMemberCountMap.get(a.id) ?? 0)
        )
      }
    }
  }

  // Bulk like + comment counts + saved + user-liked state for post tabs
  if (posts.length > 0) {
    const postIds = posts.map(p => p.id)
    const [likeResult, commentResult, savedResult, userLikedResult] = await Promise.all([
      supabase.from('likes').select('target_id').eq('target_type', 'post').in('target_id', postIds),
      supabase.from('comments').select('post_id').eq('is_removed', false).in('post_id', postIds),
      user
        ? supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds)
        : Promise.resolve({ data: null }),
      user
        ? supabase.from('likes').select('target_id').eq('user_id', user.id).eq('target_type', 'post').in('target_id', postIds)
        : Promise.resolve({ data: null }),
    ])

    for (const { target_id } of likeResult.data ?? []) {
      likeCountMap.set(target_id, (likeCountMap.get(target_id) ?? 0) + 1)
    }
    for (const { post_id } of commentResult.data ?? []) {
      commentCountMap.set(post_id, (commentCountMap.get(post_id) ?? 0) + 1)
    }
    for (const { post_id } of savedResult.data ?? []) {
      savedPostIds.add(post_id)
    }
    for (const { target_id } of userLikedResult.data ?? []) {
      likedPostIds.add(target_id)
    }
  }

  return (
    <div>
      {/* Tab nav */}
      <div className="flex items-center justify-between border-b border-[var(--border)] mb-6">
        <div className="flex gap-0">
          {TABS.map(t => (
            <Link
              key={t.id}
              href={`/feed?tab=${t.id}`}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-[var(--accent)] text-[var(--foreground)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        {user && (
          <Link href="/c/new" className="mb-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors">
            + Create
          </Link>
        )}
      </div>

      {/* My Feed tab */}
      {tab === 'feed' && (
        <Suspense fallback={<PostListSkeleton />}>
          <FadeIn>
          {myIds.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <p className="text-[var(--muted-foreground)] mb-2">You haven&apos;t joined any communities yet.</p>
              <Link href="/feed?tab=communities" className="text-sm text-[var(--accent)] hover:underline">
                Browse communities →
              </Link>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Nothing here yet</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Your communities haven&apos;t posted anything yet. Check back soon.</p>
            </div>
          ) : (
            <>
              <StaggeredList className="space-y-3">
                {posts.map(p => (
                  <PostCard
                    key={p.id}
                    post={p}
                    likeCount={likeCountMap.get(p.id) ?? 0}
                    commentCount={commentCountMap.get(p.id) ?? 0}
                    communitySlug={p.community?.slug ?? ''}
                    isSaved={savedPostIds.has(p.id)}
                    initialLiked={likedPostIds.has(p.id)}
                    userId={user?.id ?? null}
                  />
                ))}
              </StaggeredList>
              {posts.length === pageLimit && (
                <div className="pt-2 text-center">
                  <Link href={`/feed?tab=feed&limit=${pageLimit + 20}`} className="text-sm text-[var(--accent)] hover:underline">
                    Load more
                  </Link>
                </div>
              )}
            </>
          )}
          </FadeIn>
        </Suspense>
      )}

      {/* All tab */}
      {tab === 'all' && (
        <Suspense fallback={<PostListSkeleton />}>
          <FadeIn>
          {posts.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Nothing posted yet</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Be the first to join a community and share something.</p>
            </div>
          ) : (
            <>
              <StaggeredList className="space-y-3">
                {posts.map(p => (
                  <PostCard
                    key={p.id}
                    post={p}
                    likeCount={likeCountMap.get(p.id) ?? 0}
                    commentCount={commentCountMap.get(p.id) ?? 0}
                    communitySlug={p.community?.slug ?? ''}
                    isSaved={savedPostIds.has(p.id)}
                    initialLiked={likedPostIds.has(p.id)}
                    userId={user?.id ?? null}
                  />
                ))}
              </StaggeredList>
              {posts.length === pageLimit && (
                <div className="pt-2 text-center">
                  <Link href={`/feed?tab=all&limit=${pageLimit + 20}`} className="text-sm text-[var(--accent)] hover:underline">
                    Load more
                  </Link>
                </div>
              )}
            </>
          )}
          </FadeIn>
        </Suspense>
      )}

      {/* Communities tab */}
      {tab === 'communities' && (
        <Suspense fallback={<CommunityListSkeleton />}>
          <FadeIn>
          <div>
          {/* Sort control */}
          <div className="flex items-center gap-1 mb-4">
            {(['newest', 'members', 'alpha'] as const).map(s => (
              <Link
                key={s}
                href={`/feed?tab=communities&sort=${s}`}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  (searchParams.sort ?? 'newest') === s
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {s === 'newest' ? 'Newest' : s === 'members' ? 'Most Members' : 'A–Z'}
              </Link>
            ))}
          </div>
          <div className="space-y-2">
            {allCommunities.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] py-16 text-center">
                <p className="mb-4 text-sm text-[var(--muted-foreground)]">No communities yet.</p>
                {user && (
                  <Link href="/c/new" className="text-sm text-[var(--accent)] hover:underline">
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
          </div>
          </FadeIn>
        </Suspense>
      )}
    </div>
  )
}
