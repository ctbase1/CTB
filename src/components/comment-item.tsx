'use client'

import { useState } from 'react'
import { LikeButton } from './like-button'
import { CommentForm } from './comment-form'
import { deleteComment } from '@/lib/actions/comment'

export interface CommentData {
  id: string
  body: string
  created_at: string
  author_id: string
  parent_id: string | null
  author: { username: string; avatar_url: string | null } | null
  likeCount: number
  liked: boolean
}

interface Props {
  comment: CommentData
  replies: CommentData[]
  postId: string
  communitySlug: string
  userId: string | null
}

export function CommentItem({
  comment,
  replies,
  postId,
  communitySlug,
  userId,
}: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const isTopLevel = !comment.parent_id
  const canDelete  = !!userId && userId === comment.author_id

  return (
    <div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {comment.author?.username ?? 'unknown'}
            </span>
            <span className="text-xs text-zinc-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          {canDelete && (
            <form action={deleteComment}>
              <input type="hidden" name="comment_id"     value={comment.id} />
              <input type="hidden" name="post_id"        value={postId} />
              <input type="hidden" name="community_slug" value={communitySlug} />
              <button
                type="submit"
                onClick={(e) => {
                  if (!confirm('Delete this comment?')) e.preventDefault()
                }}
                className="text-xs text-zinc-600 hover:text-red-400"
              >
                Delete
              </button>
            </form>
          )}
        </div>

        <p className="whitespace-pre-wrap text-sm text-zinc-300">{comment.body}</p>

        <div className="mt-2 flex items-center gap-3">
          <LikeButton
            targetId={comment.id}
            targetType="comment"
            initialCount={comment.likeCount}
            initialLiked={comment.liked}
            userId={userId}
          />
          {isTopLevel && userId && (
            <button
              onClick={() => setShowReplyForm(v => !v)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              {showReplyForm ? 'Cancel' : 'Reply'}
            </button>
          )}
        </div>

        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              communitySlug={communitySlug}
              onSuccess={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>

      {replies.length > 0 && (
        <div className="ml-6 mt-2 space-y-2">
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]}
              postId={postId}
              communitySlug={communitySlug}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
