import Link from 'next/link'
import Image from 'next/image'
import { BookmarkButton } from '@/components/bookmark-button'

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
  author: { username: string } | null
}

interface Props {
  post: PostForCard
  likeCount: number
  commentCount: number
  communitySlug: string
  isSaved?: boolean
  userId?: string | null
}

export function PostCard({ post, likeCount, commentCount, communitySlug, isSaved, userId }: Props) {
  return (
    <div className="relative rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
      {post.is_pinned && (
        <div className="flex items-center gap-1 border-b border-zinc-800 px-4 pt-2 pb-1.5 text-xs font-medium text-indigo-400">
          <span>📌</span>
          <span>Pinned</span>
        </div>
      )}

      {userId && (
        <div className="absolute right-3 top-3 z-10">
          <BookmarkButton postId={post.id} isSaved={!!isSaved} />
        </div>
      )}

      <Link
        href={`/c/${communitySlug}/${post.id}`}
        className="flex gap-4 p-4"
      >
        {post.image_url && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
            <Image src={post.image_url} alt={post.title} fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1 pr-6">
          {post.flair && (
            <span className="mb-1 inline-block rounded-full bg-indigo-900/60 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
              {post.flair}
            </span>
          )}
          <h3 className="line-clamp-2 font-medium text-white">{post.title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            by {post.author?.username ?? 'unknown'} ·{' '}
            {new Date(post.created_at).toLocaleDateString()}
            {post.edited_at && <span className="ml-1 italic">· edited</span>}
          </p>

          {post.link_preview && (
            <div className="mt-2 flex items-start gap-2 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800/60 p-2">
              {post.link_preview.image_url && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-zinc-700">
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
                  <p className="line-clamp-1 text-xs font-medium text-zinc-200">{post.link_preview.title}</p>
                )}
                {post.link_preview.description && (
                  <p className="line-clamp-1 text-xs text-zinc-500">{post.link_preview.description}</p>
                )}
                <p className="truncate text-[10px] text-indigo-400">{post.link_preview.url}</p>
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
            <span>♥ {likeCount}</span>
            <span>💬 {commentCount}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
