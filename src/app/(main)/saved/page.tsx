import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PostCard } from '@/components/post-card'

export default async function SavedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch saved posts with full post data + community slug
  const { data: savedRows } = await supabase
    .from('saved_posts')
    .select('post_id, saved_at, post:posts!post_id(*, author:profiles!author_id(username), community:communities!community_id(slug))')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })
    .limit(50)

  const items = (savedRows ?? []).flatMap(row => {
    const post = row.post as (typeof row.post & { community: { slug: string } | null }) | null
    if (!post || post.is_removed) return []
    const community = post.community
    if (!community) return []
    return [{ post, communitySlug: community.slug }]
  })

  const postIds = items.map(i => i.post.id)
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

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-white">Saved Posts</h1>

      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
          <p className="text-sm text-zinc-500">No saved posts yet.</p>
          <p className="mt-1 text-xs text-zinc-600">Bookmark posts to find them here later.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(({ post, communitySlug }) => (
            <PostCard
              key={post.id}
              post={{
                ...post,
                author: post.author as { username: string } | null,
              }}
              likeCount={likeCountMap.get(post.id) ?? 0}
              commentCount={commentCountMap.get(post.id) ?? 0}
              communitySlug={communitySlug}
              isSaved={true}
              userId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
