'use client'

import { deletePost } from '@/lib/actions/post'

interface Props {
  postId: string
  communitySlug: string
}

export function DeletePostButton({ postId, communitySlug }: Props) {
  return (
    <form action={deletePost}>
      <input type="hidden" name="post_id"        value={postId} />
      <input type="hidden" name="community_slug" value={communitySlug} />
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
  )
}
