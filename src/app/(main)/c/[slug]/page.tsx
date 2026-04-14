import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { JoinButton } from '@/components/join-button'
import { PostCard } from '@/components/post-card'
import { CommunityTabs } from '@/components/community-tabs'
import { AboutTab } from '@/components/about-tab'
import { Settings, PenSquare } from 'lucide-react'
import type { Membership } from '@/types/database'

interface Props {
  params: { slug: string }
  searchParams: { error?: string; limit?: string; tab?: string }
}

export default async function CommunityPage({ params, searchParams }: Props) {
  const pageLimit = Math.min(Math.max(Number(searchParams.limit ?? 20), 20), 100)
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_removed', false)
    .single()

  if (!community) notFound()

  // Member count
  const { count: memberCount } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', community.id)

  // Current user membership + flair
  let membership: Pick<Membership, 'role'> | null = null
  let userFlair: string | null = null
  if (user) {
    const { data } = await supabase
      .from('memberships')
      .select('role, flair')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .single()
    if (data) {
      membership = { role: data.role }
      userFlair = data.flair ?? null
    }
  }

  // Fetch posts with author — pinned first, then by created_at desc
  const { data: rawPosts } = await supabase
    .from('posts')
    .select('*, view_count, author:profiles!author_id(username)')
    .eq('community_id', community.id)
    .eq('is_removed', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(pageLimit)

  const posts = rawPosts ?? []
  const postIds = posts.map(p => p.id)

  // Bulk like + comment counts
  const likeCountMap    = new Map<string, number>()
  const commentCountMap = new Map<string, number>()

  if (postIds.length > 0) {
    const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
      supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', 'post')
        .in('target_id', postIds),
      supabase
        .from('comments')
        .select('post_id')
        .eq('is_removed', false)
        .in('post_id', postIds),
    ])
    for (const { target_id } of likeRows ?? []) {
      likeCountMap.set(target_id, (likeCountMap.get(target_id) ?? 0) + 1)
    }
    for (const { post_id } of commentRows ?? []) {
      commentCountMap.set(post_id, (commentCountMap.get(post_id) ?? 0) + 1)
    }
  }

  // Author flairs for this community
  const authorFlairMap = new Map<string, string>()
  if (postIds.length > 0) {
    const authorIds = Array.from(new Set(posts.map(p => p.author_id).filter(Boolean)))
    if (authorIds.length > 0) {
      const { data: flairRows } = await supabase
        .from('memberships')
        .select('user_id, flair')
        .eq('community_id', community.id)
        .in('user_id', authorIds)
        .not('flair', 'is', null)
      for (const row of flairRows ?? []) {
        if (row.flair) authorFlairMap.set(row.user_id, row.flair)
      }
    }
  }

  // Saved post IDs + liked post IDs for current user
  const savedPostIds  = new Set<string>()
  const likedPostIds  = new Set<string>()
  if (user && postIds.length > 0) {
    const [{ data: savedRows }, { data: likedRows }] = await Promise.all([
      supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds),
      supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user.id)
        .eq('target_type', 'post')
        .in('target_id', postIds),
    ])
    for (const { post_id } of savedRows ?? []) savedPostIds.add(post_id)
    for (const { target_id } of likedRows ?? []) likedPostIds.add(target_id)
  }

  const isAdmin = membership?.role === 'admin'
  const count   = memberCount ?? 0
  const currentTab = searchParams.tab === 'about' ? 'about' : 'posts'

  return (
    <div className="min-w-0">
      {/* Banner hero */}
      <div className="relative w-full overflow-hidden rounded-2xl aspect-[3/1] lg:aspect-[4/1]">
        {community.banner_url ? (
          <Image src={community.banner_url} alt={community.name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-900 via-slate-900 to-[var(--background)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Header — sits below banner, no overlap */}
      <div className="flex items-center justify-between gap-4 mt-3 px-1">
        <div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[var(--background)] bg-gradient-to-br from-blue-600 to-blue-900 text-xl font-bold text-white shadow-lg">
            {community.name[0].toUpperCase()}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pb-1">
          {isAdmin && (
            <Link
              href={`/c/${community.slug}/settings`}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          )}
          <JoinButton
            communityId={community.id}
            communitySlug={community.slug}
            membership={membership}
            isLoggedIn={!!user}
          />
        </div>
      </div>

      {/* Community name + meta */}
      <div className="mt-3 px-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{community.name}</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          c/{community.slug} · <span className="text-[var(--muted-foreground)]">{count.toLocaleString()} {count === 1 ? 'member' : 'members'}</span>
        </p>
      </div>

      {searchParams.error === 'admins-cannot-leave' && (
        <p className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
          Community admins cannot leave. Delete the community instead.
        </p>
      )}

      {/* Tab bar */}
      <CommunityTabs slug={community.slug} currentTab={currentTab} />

      {/* Tab content */}
      {currentTab === 'about' ? (
        <AboutTab
          rules={community.rules}
          description={community.description}
          memberCount={count}
          createdAt={community.created_at}
          communityId={community.id}
          userId={user?.id ?? null}
          userFlair={userFlair}
          isMember={!!membership}
        />
      ) : (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              {posts.length > 0
                ? `${posts.length} post${posts.length === 1 ? '' : 's'}`
                : 'Posts'}
            </p>
            {membership && (
              <Link
                href={`/c/${community.slug}/submit`}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                <PenSquare className="h-3.5 w-3.5" />
                New Post
              </Link>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-16 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">No posts yet.</p>
              {membership && (
                <Link
                  href={`/c/${community.slug}/submit`}
                  className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline"
                >
                  Be the first to post →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(p => (
                <PostCard
                  key={p.id}
                  post={{
                    ...p,
                    author: p.author as { username: string } | null,
                  }}
                  likeCount={likeCountMap.get(p.id) ?? 0}
                  commentCount={commentCountMap.get(p.id) ?? 0}
                  communitySlug={community.slug}
                  isSaved={savedPostIds.has(p.id)}
                  initialLiked={likedPostIds.has(p.id)}
                  userId={user?.id ?? null}
                  authorFlair={authorFlairMap.get(p.author_id) ?? null}
                />
              ))}
              {posts.length === pageLimit && (
                <div className="pt-2 text-center">
                  <Link
                    href={`?limit=${pageLimit + 20}`}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    Load more
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
