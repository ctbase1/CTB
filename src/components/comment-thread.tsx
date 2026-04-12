import { CommentItem, type CommentData } from './comment-item'

interface Props {
  comments: CommentData[]
  postId: string
  communitySlug: string
  userId: string | null
}

export function CommentThread({ comments, postId, communitySlug, userId }: Props) {
  const topLevel = comments.filter(c => !c.parent_id)

  const repliesMap = new Map<string, CommentData[]>()
  for (const c of comments) {
    if (c.parent_id) {
      const arr = repliesMap.get(c.parent_id) ?? []
      arr.push(c)
      repliesMap.set(c.parent_id, arr)
    }
  }

  if (topLevel.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-10 text-center">
        <p className="text-sm text-zinc-500">No comments yet. Be the first!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {topLevel.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          replies={repliesMap.get(comment.id) ?? []}
          postId={postId}
          communitySlug={communitySlug}
          userId={userId}
        />
      ))}
    </div>
  )
}
