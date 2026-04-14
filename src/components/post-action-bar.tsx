'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquare, BarChart2, Share2, Check, X as XIcon } from 'lucide-react'
import { LikeButton } from '@/components/like-button'
import { BookmarkButton } from '@/components/bookmark-button'
import { InlineCommentForm } from '@/components/inline-comment-form'
import type { CommunityColor } from '@/lib/community-colors'

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
  communityColor?: CommunityColor
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
  communityColor,
}: Props) {
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [shareOpen, setShareOpen]             = useState(false)
  const [copied, setCopied]                   = useState(false)
  const shareRef                              = useRef<HTMLDivElement>(null)

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

  const accent = communityColor?.accent ?? 'var(--accent)'

  return (
    <div onClick={e => e.preventDefault()}>
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
        {/* Like */}
        <LikeButton
          targetId={post.id}
          targetType="post"
          initialCount={likeCount}
          initialLiked={initialLiked}
          userId={userId ?? null}
          accentColor={accent}
        />

        {/* Comment */}
        <button
          onClick={() => setShowCommentForm(v => !v)}
          className="flex items-center gap-1.5 text-sm transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)] min-h-[44px] min-w-[44px] justify-center md:min-h-0 md:min-w-0 md:justify-start"
          style={showCommentForm ? { color: accent } : undefined}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{commentCount}</span>
        </button>

        {/* Views */}
        <span className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] cursor-default select-none">
          <BarChart2 className="h-3.5 w-3.5" />
          <span>{formatCount(post.view_count)}</span>
        </span>

        {/* Save */}
        {userId && (
          <BookmarkButton postId={post.id} isSaved={isSaved} accentColor={accent} />
        )}

        {/* Share */}
        <div ref={shareRef} className="relative">
          <button
            onClick={() => setShareOpen(v => !v)}
            className={`flex items-center gap-1.5 text-sm transition-all min-h-[44px] min-w-[44px] justify-center md:min-h-0 md:min-w-0 ${
              copied ? 'text-green-400' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            style={shareOpen && !copied ? { color: accent } : undefined}
            title="Share"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>

          {shareOpen && (
            <div className="absolute bottom-full right-0 mb-2 z-20 min-w-[140px] rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] py-1 shadow-xl">
              <button
                onClick={handleCopyLink}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)] transition-colors"
              >
                <Check className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                Copy Link
              </button>
              <button
                onClick={handleShareToX}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)] transition-colors"
              >
                <XIcon className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
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
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          You must be logged in to comment.
        </p>
      )}
    </div>
  )
}
