import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { FollowButton } from '@/components/follow-button'
import { PostCard } from '@/components/post-card'

interface Props {
  params: { username: string }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, created_at')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  const isOwnProfile = user?.id === profile.id

  // Get all post + comment IDs for this user (for karma computation)
  const [{ data: userPostIds }, { data: userCommentIds }] = await Promise.all([
    supabase.from('posts').select('id').eq('author_id', profile.id).eq('is_removed', false),
    supabase.from('comments').select('id').eq('author_id', profile.id).eq('is_removed', false),
  ])
  const allContentIds = [
    ...(userPostIds ?? []).map(p => p.id),
    ...(userCommentIds ?? []).map(c => c.id),
  ]
  const { count: karma } = allContentIds.length > 0
    ? await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .in('target_id', allContentIds)
    : { count: 0 }

  const [
    { count: followerCount },
    { count: followingCount },
    { data: followRow },
    { data: rawPosts },
  ] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
    user && !isOwnProfile
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from('posts')
      .select('*, author:profiles!author_id(username), community:communities!community_id(slug)')
      .eq('author_id', profile.id)
      .eq('is_removed', false)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const isFollowing = !!followRow
  const posts = rawPosts ?? []
  const postIds = posts.map(p => p.id)

  // Saved post IDs for current user (to show bookmark state)
  const savedPostIds = new Set<string>()
  if (user && postIds.length > 0) {
    const { data: savedRows } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)
    for (const { post_id } of savedRows ?? []) savedPostIds.add(post_id)
  }

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
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative h-24 w-24 overflow-hidden rounded-full bg-zinc-800">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-4xl text-zinc-500">
            {profile.username[0].toUpperCase()}
          </span>
        )}
      </div>

      <h1 className="text-2xl font-bold text-white">{profile.username}</h1>

      <p className="text-sm text-zinc-500">
        <span className="text-white font-medium">{followerCount ?? 0}</span> followers ·{' '}
        <span className="text-white font-medium">{followingCount ?? 0}</span> following ·{' '}
        <span className="text-white font-medium">{karma ?? 0}</span> karma
      </p>

      {profile.bio && (
        <p className="max-w-md text-center text-sm text-zinc-400">{profile.bio}</p>
      )}

      <p className="text-xs text-zinc-500">
        Joined {new Date(profile.created_at).toLocaleDateString()}
      </p>

      {!isOwnProfile && (
        <FollowButton
          targetUserId={profile.id}
          initialFollowed={isFollowing}
          currentUserId={user?.id ?? null}
        />
      )}

      {/* Posts */}
      <div className="mt-4 w-full max-w-2xl">
        <h2 className="mb-3 text-sm font-medium text-zinc-400">
          Posts {posts.length > 0 && `· ${posts.length}`}
        </h2>
        {posts.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
            <p className="text-sm text-zinc-500">No posts yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map(p => {
              const community = p.community as { slug: string } | null
              if (!community) return null
              return (
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
