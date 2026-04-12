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
}

export function PostCard({ post, likeCount, commentCount, communitySlug, isSaved, initialLiked, userId }: Props) {
  return (
    <div className="group relative rounded-2xl border border-slate-700/50 bg-slate-900 transition-all hover:border-violet-500/30 hover:shadow-glow-violet">
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 border-b border-slate-700/50 px-4 pt-2.5 pb-2 text-xs font-medium text-violet-300">
          <Pin className="h-3 w-3" />
          <span>Pinned</span>
        </div>
      )}

      <Link
        href={`/c/${communitySlug}/${post.id}`}
        className="flex gap-4 p-5"
      >
        {post.image_url && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-800">
            <Image src={post.image_url} alt={post.title} fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {post.flair && (
            <span className="mb-1.5 inline-block rounded-full border border-violet-800/40 bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-violet-400">
              {post.flair}
            </span>
          )}
          <h3 className="line-clamp-2 font-semibold text-white leading-snug">{post.title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            by {post.author?.username ?? 'unknown'} ·{' '}
            {new Date(post.created_at).toLocaleDateString()}
            {post.edited_at && <span className="ml-1 italic">· edited</span>}
          </p>

          {post.link_preview && (
            <div className="mt-2.5 flex items-start gap-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-2.5 border-l-2 border-l-violet-500">
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
                  <p className="line-clamp-1 text-xs text-slate-500">{post.link_preview.description}</p>
                )}
                <p className="truncate text-[10px] text-violet-400">{post.link_preview.url}</p>
              </div>
            </div>
          )}
        </div>
      </Link>

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
