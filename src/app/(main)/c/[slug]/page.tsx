import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { JoinButton } from '@/components/join-button'
import { PostCard } from '@/components/post-card'
import { CommunitySidebar } from '@/components/community-sidebar'
import type { Membership } from '@/types/database'

interface Props {
  params: { slug: string }
  searchParams: { error?: string; limit?: string }
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

  // Current user membership
  let membership: Pick<Membership, 'role'> | null = null
  if (user) {
    const { data } = await supabase
      .from('memberships')
      .select('role')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .single()
    membership = data
  }

  // Fetch posts with author — pinned first, then by created_at desc
  const { data: rawPosts } = await supabase
    .from('posts')
    .select('*, author:profiles!author_id(username)')
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

  // Saved post IDs for current user
  const savedPostIds = new Set<string>()
  if (user && postIds.length > 0) {
    const { data: savedRows } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)
    for (const { post_id } of savedRows ?? []) savedPostIds.add(post_id)
  }

  const isAdmin = membership?.role === 'admin'
  const count   = memberCount ?? 0

  return (
    <div className="flex gap-6">
      {/* Main feed */}
      <div className="min-w-0 flex-1">
        {/* Banner */}
        {community.banner_url && (
          <div className="relative mb-4 h-32 w-full overflow-hidden rounded-xl bg-zinc-800">
            <Image src={community.banner_url} alt={community.name} fill className="object-cover" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{community.name}</h1>
            <p className="mt-0.5 text-sm text-zinc-400">
              c/{community.slug} · {count} {count === 1 ? 'member' : 'members'}
            </p>
            {community.description && (
              <p className="mt-3 max-w-lg text-sm text-zinc-300">{community.description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && (
              <Link href={`/c/${community.slug}/settings`} className="text-xs text-zinc-400 hover:text-white">
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

        {searchParams.error === 'admins-cannot-leave' && (
          <p className="mt-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
            Community admins cannot leave. Delete the community instead.
          </p>
        )}

        {/* Posts feed */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-400">
              {posts.length > 0
                ? `${posts.length} post${posts.length === 1 ? '' : 's'}`
                : 'Posts'}
            </p>
            {membership && (
              <Link
                href={`/c/${community.slug}/submit`}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
              >
                New Post
              </Link>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
              <p className="text-sm text-zinc-500">No posts yet.</p>
              {membership && (
                <Link
                  href={`/c/${community.slug}/submit`}
                  className="mt-2 inline-block text-sm text-indigo-400 hover:underline"
                >
                  Be the first to post →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
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
                  userId={user?.id ?? null}
                />
              ))}
              {posts.length === pageLimit && (
                <div className="pt-2 text-center">
                  <Link
                    href={`?limit=${pageLimit + 20}`}
                    className="text-sm text-indigo-400 hover:underline"
                  >
                    Load more
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      {community.rules.length > 0 && (
        <div className="hidden w-64 shrink-0 lg:block">
          <CommunitySidebar rules={community.rules} />
        </div>
      )}
    </div>
  )
}
