import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { LikeButton } from '@/components/like-button'
import { CommentForm } from '@/components/comment-form'
import { CommentThread } from '@/components/comment-thread'
import { ReportButton } from '@/components/report-button'
import { BanFromCommunityButton } from '@/components/ban-from-community-button'
import { deletePost } from '@/lib/actions/post'
import type { Membership } from '@/types/database'
import type { CommentData } from '@/components/comment-item'

interface Props {
  params: { slug: string; postId: string }
}

export default async function PostPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch community
  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .eq('is_removed', false)
    .single()

  if (!community) notFound()

  // Fetch post with author
  const { data: post } = await supabase
    .from('posts')
    .select('*, author:profiles!author_id(username, avatar_url)')
    .eq('id', params.postId)
    .eq('community_id', community.id)
    .eq('is_removed', false)
    .single()

  if (!post) notFound()

  const postAuthor = post.author as { username: string; avatar_url: string | null } | null

  // Post like count
  const { count: postLikeCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('target_id', post.id)
    .eq('target_type', 'post')

  // User membership + liked state
  let membership: Pick<Membership, 'role'> | null = null
  let userLikedPost = false

  if (user) {
    const [membershipResult, likeResult] = await Promise.all([
      supabase
        .from('memberships')
        .select('role')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('likes')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('target_id', post.id)
        .eq('target_type', 'post')
        .single(),
    ])
    membership    = membershipResult.data
    userLikedPost = !!likeResult.data
  }

  const isMember      = !!membership
  const canMod        = membership?.role === 'admin' || membership?.role === 'moderator'
  const isPostAuthor  = !!user && user.id === post.author_id
  const canDeletePost = isPostAuthor || canMod
  const canBanAuthor  = canMod && !isPostAuthor && !!post.author_id

  // Fetch comments with authors
  const { data: rawComments } = await supabase
    .from('comments')
    .select('*, author:profiles!author_id(username, avatar_url)')
    .eq('post_id', post.id)
    .eq('is_removed', false)
    .order('created_at', { ascending: true })

  const rawCommentList = rawComments ?? []
  const commentIds = rawCommentList.map(c => c.id)

  // Comment like counts + user liked state
  const commentLikeCountMap = new Map<string, number>()
  const userLikedCommentIds = new Set<string>()

  if (commentIds.length > 0) {
    const { data: commentLikeRows } = await supabase
      .from('likes')
      .select('target_id')
      .eq('target_type', 'comment')
      .in('target_id', commentIds)

    for (const { target_id } of commentLikeRows ?? []) {
      commentLikeCountMap.set(target_id, (commentLikeCountMap.get(target_id) ?? 0) + 1)
    }

    if (user) {
      const { data: userCommentLikes } = await supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user.id)
        .eq('target_type', 'comment')
        .in('target_id', commentIds)

      for (const { target_id } of userCommentLikes ?? []) {
        userLikedCommentIds.add(target_id)
      }
    }
  }

  const enrichedComments: CommentData[] = rawCommentList.map(c => ({
    id:         c.id,
    body:       c.body,
    created_at: c.created_at,
    author_id:  c.author_id,
    parent_id:  c.parent_id,
    author:     c.author as { username: string; avatar_url: string | null } | null,
    likeCount:  commentLikeCountMap.get(c.id) ?? 0,
    liked:      userLikedCommentIds.has(c.id),
  }))

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <p className="text-sm text-zinc-500">
        <Link href={`/c/${community.slug}`} className="hover:text-white">
          c/{community.slug}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-zinc-400">Post</span>
      </p>

      {/* Post card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-1 flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold leading-tight text-white">{post.title}</h1>
          <div className="flex shrink-0 items-center gap-3">
            {user && !isPostAuthor && (
              <ReportButton targetId={post.id} targetType="post" />
            )}
            {canBanAuthor && (
              <BanFromCommunityButton
                communityId={community.id}
                communitySlug={community.slug}
                userId={post.author_id}
                username={postAuthor?.username ?? 'user'}
              />
            )}
            {canDeletePost && (
              <form action={deletePost}>
                <input type="hidden" name="post_id"        value={post.id} />
                <input type="hidden" name="community_slug" value={community.slug} />
                <button
                  type="submit"
                  onClick={(e) => {
                    if (!confirm('Delete this post?')) e.preventDefault()
                  }}
                  className="text-xs text-zinc-600 hover:text-red-400"
                >
                  Delete
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mb-4 text-xs text-zinc-500">
          by {postAuthor?.username ?? 'unknown'} ·{' '}
          {new Date(post.created_at).toLocaleDateString()}
        </p>

        {post.image_url && (
          <div className="relative mb-4 w-full overflow-hidden rounded-lg bg-zinc-800"
               style={{ aspectRatio: '16/9' }}>
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              className="object-contain"
            />
          </div>
        )}

        {post.body && (
          <p className="mb-4 whitespace-pre-wrap text-sm text-zinc-300">{post.body}</p>
        )}

        <LikeButton
          targetId={post.id}
          targetType="post"
          initialCount={postLikeCount ?? 0}
          initialLiked={userLikedPost}
          userId={user?.id ?? null}
        />
      </div>

      {/* Comment form — members only */}
      {isMember && (
        <div>
          <p className="mb-3 text-sm font-medium text-zinc-400">Add a comment</p>
          <CommentForm postId={post.id} communitySlug={community.slug} />
        </div>
      )}

      {/* Comment thread */}
      <div>
        <p className="mb-3 text-sm font-medium text-zinc-400">
          {enrichedComments.length}{' '}
          {enrichedComments.length === 1 ? 'comment' : 'comments'}
        </p>
        <CommentThread
          comments={enrichedComments}
          postId={post.id}
          communityId={community.id}
          communitySlug={community.slug}
          userId={user?.id ?? null}
          canMod={canMod}
        />
      </div>
    </div>
  )
}
