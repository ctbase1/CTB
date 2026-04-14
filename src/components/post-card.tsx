import Link from 'next/link'
import Image from 'next/image'
import { Pin } from 'lucide-react'
import { PostActionBar } from '@/components/post-action-bar'

interface LinkPreview {
  title: string | null
  description: string | null
  image_url: string | null
  url: string
}

interface PostForCard {
  id: string
  title: string
  body: string | null
  image_url: string | null
  created_at: string
  edited_at?: string | null
  flair?: string | null
  is_pinned?: boolean
  link_preview?: LinkPreview | null
  view_count: number
  author: { username: string } | null
}

interface Props {
  post: PostForCard
  likeCount: number
  commentCount: number
  communitySlug: string
  isSaved?: boolean
  initialLiked?: boolean
  userId?: string | null
  authorFlair?: string | null
}

export function PostCard({ post, likeCount, commentCount, communitySlug, isSaved, initialLiked, userId, authorFlair }: Props) {
  const authorUsername = post.author?.username ?? null

  return (
    <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-all hover:border-[var(--accent)]/30 hover:shadow-glow-blue">
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-4 pt-2.5 pb-2 text-xs font-medium text-blue-300">
          <Pin className="h-3 w-3" />
          <span>Pinned</span>
        </div>
      )}

      {/* Main clickable area — title + image + preview only */}
      <Link
        href={`/c/${communitySlug}/${post.id}`}
        className="flex gap-4 px-5 pt-5 pb-2"
      >
        {post.image_url && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-raised)]">
            <Image src={post.image_url} alt={post.title} fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {post.flair && (
            <span className="mb-1.5 inline-block rounded-full border border-[var(--accent)]/40 bg-[var(--surface-raised)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">
              {post.flair}
            </span>
          )}
          <h3 className="line-clamp-2 font-semibold text-white leading-snug">{post.title}</h3>

          {post.link_preview && (
            <div className="mt-2.5 flex items-start gap-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-2.5 border-l-2 border-l-[var(--accent)]">
              {post.link_preview.image_url && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-700">
                  <Image
                    src={post.link_preview.image_url}
                    alt={post.link_preview.title ?? ''}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="min-w-0">
                {post.link_preview.title && (
                  <p className="line-clamp-1 text-xs font-medium text-slate-200">{post.link_preview.title}</p>
                )}
                {post.link_preview.description && (
                  <p className="line-clamp-1 text-xs text-[var(--muted-foreground)]">{post.link_preview.description}</p>
                )}
                <p className="truncate text-[10px] text-[var(--accent)]">{post.link_preview.url}</p>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Byline — separate row so username can be its own link */}
      <div className="flex items-center gap-1.5 px-5 pb-2 text-xs text-[var(--muted-foreground)]">
        <span>by</span>
        {authorUsername ? (
          <Link href={`/u/${authorUsername}`} className="font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors">
            {authorUsername}
          </Link>
        ) : (
          <span>unknown</span>
        )}
        {authorFlair && (
          <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--surface-raised)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
            {authorFlair}
          </span>
        )}
        <span>·</span>
        <span>{new Date(post.created_at).toLocaleDateString()}</span>
        {post.edited_at && <span className="italic">· edited</span>}
      </div>

      {/* Action bar */}
      <div className="px-5 pb-4">
        <PostActionBar
          post={post}
          likeCount={likeCount}
          commentCount={commentCount}
          initialLiked={initialLiked ?? false}
          userId={userId}
          isSaved={isSaved ?? false}
          communitySlug={communitySlug}
        />
      </div>
    </div>
  )
}
