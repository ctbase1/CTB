'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquare, BarChart2, Share2, Check, X as XIcon } from 'lucide-react'
import { LikeButton } from '@/components/like-button'
import { BookmarkButton } from '@/components/bookmark-button'
import { InlineCommentForm } from '@/components/inline-comment-form'

interface PostForActionBar {
  id: string
  title: string
  view_count: number
}

interface Props {
  post: PostForActionBar
  likeCount: number
  commentCount: number
  initialLiked: boolean
  userId?: string | null
  isSaved: boolean
  communitySlug: string
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

export function PostActionBar({
  post,
  likeCount,
  commentCount,
  initialLiked,
  userId,
  isSaved,
  communitySlug,
}: Props) {
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [shareOpen, setShareOpen]             = useState(false)
  const [copied, setCopied]                   = useState(false)
  const shareRef                              = useRef<HTMLDivElement>(null)

  // Close share dropdown on outside click
  useEffect(() => {
    if (!shareOpen) return
    function onMouseDown(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [shareOpen])

  function handleCopyLink(e: React.MouseEvent) {
    e.preventDefault()
    const url = `${window.location.origin}/c/${communitySlug}/${post.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setShareOpen(false)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShareToX(e: React.MouseEvent) {
    e.preventDefault()
    const url  = `${window.location.origin}/c/${communitySlug}/${post.id}`
    const text = encodeURIComponent(post.title)
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`, '_blank')
    setShareOpen(false)
  }

  return (
    <div onClick={e => e.preventDefault()}>
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        {/* Like */}
        <LikeButton
          targetId={post.id}
          targetType="post"
          initialCount={likeCount}
          initialLiked={initialLiked}
          userId={userId ?? null}
        />

        {/* Comment */}
        <button
          onClick={() => setShowCommentForm(v => !v)}
          className={`flex items-center gap-1.5 text-sm transition-all ${
            showCommentForm
              ? 'text-violet-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{commentCount}</span>
        </button>

        {/* Views */}
        <span className="flex items-center gap-1.5 text-sm text-slate-500 cursor-default select-none">
          <BarChart2 className="h-3.5 w-3.5" />
          <span>{formatCount(post.view_count)}</span>
        </span>

        {/* Save */}
        {userId && (
          <BookmarkButton postId={post.id} isSaved={isSaved} />
        )}

        {/* Share */}
        <div ref={shareRef} className="relative">
          <button
            onClick={() => setShareOpen(v => !v)}
            className={`flex items-center gap-1.5 text-sm transition-all ${
              copied
                ? 'text-green-400'
                : shareOpen
                  ? 'text-violet-400'
                  : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Share"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>

          {shareOpen && (
            <div className="absolute bottom-full right-0 mb-2 z-20 min-w-[140px] rounded-xl border border-slate-700 bg-slate-900 py-1 shadow-xl">
              <button
                onClick={handleCopyLink}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Check className="h-3.5 w-3.5 text-slate-500" />
                Copy Link
              </button>
              <button
                onClick={handleShareToX}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <XIcon className="h-3.5 w-3.5 text-slate-500" />
                Share to X
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline comment form */}
      {showCommentForm && userId && (
        <InlineCommentForm
          postId={post.id}
          communitySlug={communitySlug}
          onClose={() => setShowCommentForm(false)}
        />
      )}
      {showCommentForm && !userId && (
        <p className="mt-3 text-xs text-slate-500">
          You must be logged in to comment.
        </p>
      )}
    </div>
  )
}
