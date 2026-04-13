'use client'

import { useState, useEffect } from 'react'
import { LikeButton } from './like-button'
import { CommentForm } from './comment-form'
import { ReportButton } from './report-button'
import { BanFromCommunityButton } from './ban-from-community-button'
import Link from 'next/link'
import { deleteComment, updateComment } from '@/lib/actions/comment'
import { MarkdownRenderer } from './markdown-renderer'
import { MessageSquare, Trash2, Pencil } from 'lucide-react'

export interface CommentData {
  id: string
  body: string
  created_at: string
  edited_at?: string | null
  author_id: string
  parent_id: string | null
  author: { username: string; avatar_url: string | null } | null
  likeCount: number
  liked: boolean
  authorFlair?: string | null
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
  const [editing, setEditing]             = useState(false)
  const [editBody, setEditBody]           = useState(comment.body)
  const [editError, setEditError]         = useState<string | null>(null)
  const [saving, setSaving]               = useState(false)

  const isTopLevel   = !comment.parent_id
  const isOwnComment = !!userId && userId === comment.author_id
  const canDelete    = isOwnComment || canMod
  const canBan       = canMod && !isOwnComment

  // Edit window: 15 minutes from created_at; auto-expires in UI
  const ageMs = Date.now() - new Date(comment.created_at).getTime()
  const [canEdit, setCanEdit] = useState(isOwnComment && ageMs < 15 * 60 * 1000)

  useEffect(() => {
    if (!isOwnComment) return
    const remaining = 15 * 60 * 1000 - ageMs
    if (remaining <= 0) return
    const id = setTimeout(() => setCanEdit(false), remaining)
    return () => clearTimeout(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setSaving(true)
    setEditError(null)
    const result = await updateComment(comment.id, editBody, communitySlug, postId)
    setSaving(false)
    if (result?.error) {
      setEditError(result.error)
    } else {
      setEditing(false)
    }
  }

  return (
    <div className={`${isTopLevel ? 'border-l-2 border-slate-700' : 'border-l-2 border-violet-900/50'} pl-4`}>
      <div className="group rounded-xl bg-slate-900/60 p-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {comment.author?.username ? (
              <Link
                href={`/u/${comment.author.username}`}
                className="text-sm font-medium text-white hover:text-violet-400 transition-colors"
              >
                {comment.author.username}
              </Link>
            ) : (
              <span className="text-sm font-medium text-white">unknown</span>
            )}
            {comment.authorFlair && (
              <span className="rounded-full border border-violet-800/40 bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-violet-400">
                {comment.authorFlair}
              </span>
            )}
            <span className="text-xs text-slate-500">
              {new Date(comment.created_at).toLocaleDateString()}
              {comment.edited_at && (
                <span className="ml-1 italic text-slate-600">(edited)</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {canEdit && !editing && (
              <button
                onClick={() => { setEditing(true); setEditBody(comment.body) }}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-violet-400 transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
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

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={3}
              autoFocus
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-none"
            />
            {editError && <p className="text-xs text-red-400">{editError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !editBody.trim()}
                className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setEditing(false); setEditError(null); setEditBody(comment.body) }}
                className="rounded-lg px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <MarkdownRenderer className="text-slate-300">{comment.body}</MarkdownRenderer>
        )}

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
