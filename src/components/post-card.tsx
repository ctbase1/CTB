import Link from 'next/link'
import Image from 'next/image'
import { Pin } from 'lucide-react'
import { PostActionBar } from '@/components/post-action-bar'
import { getCommunityColor } from '@/lib/community-colors'

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
  const color = getCommunityColor(communitySlug)

  return (
    <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-colors duration-200 hover:border-[var(--border-strong)]">
      {/* Community color strip */}
      <div className="h-[3px] w-full" style={{ background: color.strip }} />

      {post.is_pinned && (
        <div
          className="flex items-center gap-1.5 border-b border-[var(--border)] px-4 pt-2.5 pb-2 text-xs font-medium"
          style={{ color: color.accent }}
        >
          <Pin className="h-3 w-3" />
          <span>Pinned</span>
        </div>
      )}

      {/* Main clickable area */}
      <Link href={`/c/${communitySlug}/${post.id}`} className="flex gap-4 px-3 pt-3 pb-2 md:px-5 md:pt-4">
        {post.image_url && (
          <div className="relative h-14 w-14 md:h-16 md:w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-raised)]">
            <Image src={post.image_url} alt={post.title} fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {/* Flair + community badge row */}
          <div className="mb-1.5 flex items-center gap-2">
            {post.flair && (
              <span
                className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold border"
                style={{ color: color.accent, background: color.bg, borderColor: color.border }}
              >
                {post.flair}
              </span>
            )}
            <span
              className="ml-auto inline-block rounded px-2 py-0.5 text-[10px] font-semibold border"
              style={{ color: color.accent, background: color.bg, borderColor: color.border }}
            >
              c/{communitySlug}
            </span>
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold text-[var(--foreground)] leading-snug">{post.title}</h3>

          {post.body && (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)] leading-relaxed">
              {post.body}
            </p>
          )}

          {post.link_preview && (
            <div
              className="mt-2.5 flex items-start gap-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-2.5"
              style={{ borderLeftWidth: '2px', borderLeftColor: color.accent }}
            >
              {post.link_preview.image_url && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-raised)]">
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
                  <p className="line-clamp-1 text-xs font-medium text-[var(--foreground)]">{post.link_preview.title}</p>
                )}
                {post.link_preview.description && (
                  <p className="line-clamp-1 text-xs text-[var(--muted-foreground)]">{post.link_preview.description}</p>
                )}
                <p className="truncate text-[10px]" style={{ color: color.accent }}>{post.link_preview.url}</p>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Byline */}
      <div className="flex items-center gap-1.5 px-3 pb-2 md:px-5 text-xs text-[var(--muted-foreground)]">
        <span>by</span>
        {authorUsername ? (
          <Link
            href={`/u/${authorUsername}`}
            className="font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            {authorUsername}
          </Link>
        ) : (
          <span>unknown</span>
        )}
        {authorFlair && (
          <span
            className="rounded border px-1.5 py-0.5 text-[10px] font-medium"
            style={{ color: color.accent, background: color.bg, borderColor: color.border }}
          >
            {authorFlair}
          </span>
        )}
        <span>·</span>
        <span>{new Date(post.created_at).toLocaleDateString()}</span>
        {post.edited_at && <span className="italic">· edited</span>}
      </div>

      {/* Action bar */}
      <div className="px-3 pb-3 md:px-5 md:pb-4">
        <PostActionBar
          post={post}
          likeCount={likeCount}
          commentCount={commentCount}
          initialLiked={initialLiked ?? false}
          userId={userId}
          isSaved={isSaved ?? false}
          communitySlug={communitySlug}
          communityColor={color}
        />
      </div>
    </div>
  )
}
