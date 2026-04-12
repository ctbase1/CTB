'use client'

import { useState } from 'react'
import { LikeButton } from './like-button'
import { CommentForm } from './comment-form'
import { ReportButton } from './report-button'
import { BanFromCommunityButton } from './ban-from-community-button'
import { deleteComment } from '@/lib/actions/comment'
import { MessageSquare, Trash2 } from 'lucide-react'

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
  communityId: string
  communitySlug: string
  userId: string | null
  canMod: boolean
}

export function CommentItem({
  comment,
  replies,
  postId,
  communityId,
  communitySlug,
  userId,
  canMod,
}: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const isTopLevel   = !comment.parent_id
  const isOwnComment = !!userId && userId === comment.author_id
  const canDelete    = isOwnComment || canMod
  const canBan       = canMod && !isOwnComment

  return (
    <div className={`${isTopLevel ? 'border-l-2 border-slate-700' : 'border-l-2 border-violet-900/50'} pl-4`}>
      <div className="group rounded-xl bg-slate-900/60 p-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {comment.author?.username ?? 'unknown'}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {userId && !isOwnComment && (
              <ReportButton targetId={comment.id} targetType="comment" />
            )}
            {canBan && comment.author_id && (
              <BanFromCommunityButton
                communityId={communityId}
                communitySlug={communitySlug}
                userId={comment.author_id}
                username={comment.author?.username ?? 'user'}
              />
            )}
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
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">{comment.body}</p>

        <div className="mt-2.5 flex items-center gap-3">
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
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <MessageSquare className="h-3 w-3" />
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
        <div className="ml-4 mt-2 space-y-2">
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]}
              postId={postId}
              communityId={communityId}
              communitySlug={communitySlug}
              userId={userId}
              canMod={canMod}
            />
          ))}
        </div>
      )}
    </div>
  )
}
