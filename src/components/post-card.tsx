import Link from 'next/link'
import Image from 'next/image'

interface PostForCard {
  id: string
  title: string
  body: string | null
  image_url: string | null
  created_at: string
  author: { username: string } | null
}

interface Props {
  post: PostForCard
  likeCount: number
  commentCount: number
  communitySlug: string
}

export function PostCard({ post, likeCount, commentCount, communitySlug }: Props) {
  return (
    <Link
      href={`/c/${communitySlug}/${post.id}`}
      className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
    >
      {post.image_url && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
          <Image src={post.image_url} alt="" fill className="object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 font-medium text-white">{post.title}</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          by {post.author?.username ?? 'unknown'} ·{' '}
          {new Date(post.created_at).toLocaleDateString()}
        </p>
        <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
          <span>♥ {likeCount}</span>
          <span>💬 {commentCount}</span>
        </div>
      </div>
    </Link>
  )
}
