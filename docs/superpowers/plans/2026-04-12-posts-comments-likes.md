# Posts + Comments + Likes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add posts (text + optional image), nested comments (one reply level), and likes (posts + comments) to the CBT crypto community platform.

**Architecture:** Posts live inside communities; only members can post/comment. Comments support one level of nesting via a nullable `parent_id`. Likes use a single polymorphic `likes` table keyed by `(user_id, target_id, target_type)`. Like counts use client-side optimistic state; comment submission triggers `revalidatePath` to refresh server-rendered comment list.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL + RLS), Cloudinary (images), TypeScript, Tailwind CSS

---

## File Map

| Status | File | Purpose |
|---|---|---|
| Create | `supabase/migrations/003_posts_comments_likes.sql` | DB schema + RLS |
| Modify | `src/types/database.ts` | Add posts, comments, likes table types |
| Create | `src/lib/actions/post.ts` | `createPost`, `deletePost` server actions |
| Create | `src/lib/actions/comment.ts` | `createComment`, `deleteComment` server actions |
| Create | `src/lib/actions/like.ts` | `toggleLike` server action |
| Create | `src/components/post-card.tsx` | Post summary card for feed |
| Create | `src/components/like-button.tsx` | Client component with optimistic like toggle |
| Create | `src/components/comment-form.tsx` | Client form for new comments / replies |
| Create | `src/components/comment-item.tsx` | Client component: single comment with reply toggle |
| Create | `src/components/comment-thread.tsx` | Renders grouped comment tree |
| Create | `src/components/create-post-form.tsx` | Client form for creating posts with image upload |
| Create | `src/app/(main)/c/[slug]/submit/page.tsx` | New post page |
| Create | `src/app/(main)/c/[slug]/[postId]/page.tsx` | Post detail + comments page |
| Modify | `src/app/(main)/c/[slug]/page.tsx` | Replace placeholder with post feed |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/003_posts_comments_likes.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- ============================================================
-- posts
-- ============================================================
CREATE TABLE posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT,
  image_url    TEXT,
  is_removed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- comments
-- ============================================================
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  is_removed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- likes (polymorphic: post | comment)
-- ============================================================
CREATE TABLE likes (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id   UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, target_id, target_type)
);

-- ============================================================
-- RLS: posts
-- ============================================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_public"
  ON posts FOR SELECT
  USING (is_removed = FALSE);

CREATE POLICY "posts_insert_auth"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "posts_update_own"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

-- ============================================================
-- RLS: comments
-- ============================================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_public"
  ON comments FOR SELECT
  USING (is_removed = FALSE);

CREATE POLICY "comments_insert_auth"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_update_own"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id);

-- ============================================================
-- RLS: likes
-- ============================================================
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select_all"
  ON likes FOR SELECT
  USING (TRUE);

CREATE POLICY "likes_insert_own"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_own"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration**

Go to the Supabase Dashboard → **SQL Editor**, paste the full contents of `supabase/migrations/003_posts_comments_likes.sql`, and run it.

Verify in Dashboard → **Table Editor** that `posts`, `comments`, and `likes` tables now exist with the correct columns.

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add table definitions to the Tables section**

In `src/types/database.ts`, inside the `Tables` object (after the `memberships` block, before the `profiles` block), add:

```typescript
      likes: {
        Row: {
          created_at: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
```

Then add the `posts` and `comments` blocks after the `profiles` block:

```typescript
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_removed: boolean
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_removed?: boolean
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_removed?: boolean
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string | null
          community_id: string
          created_at: string
          id: string
          image_url: string | null
          is_removed: boolean
          title: string
        }
        Insert: {
          author_id: string
          body?: string | null
          community_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_removed?: boolean
          title: string
        }
        Update: {
          author_id?: string
          body?: string | null
          community_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_removed?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
```

- [ ] **Step 2: Add convenience types at the bottom of database.ts**

After the existing `export type MembershipRole = ...` line, append:

```typescript
export type Post = Database['public']['Tables']['posts']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors related to the new types.

- [ ] **Step 4: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add posts, comments, likes types to database.ts"
```

---

## Task 3: Post Server Actions

**Files:**
- Create: `src/lib/actions/post.ts`

- [ ] **Step 1: Create the file**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slug      = formData.get('community_slug') as string
  const title     = ((formData.get('title') as string) ?? '').trim()
  const body      = ((formData.get('body') as string) ?? '').trim() || null
  const image_url = (formData.get('image_url') as string) || null

  if (title.length < 3) {
    redirect(`/c/${slug}/submit?error=` + encodeURIComponent('Title must be at least 3 characters'))
  }
  if (title.length > 300) {
    redirect(`/c/${slug}/submit?error=` + encodeURIComponent('Title must be under 300 characters'))
  }
  if (image_url && !image_url.startsWith('https://res.cloudinary.com/')) {
    redirect(`/c/${slug}/submit?error=` + encodeURIComponent('Invalid image URL'))
  }

  const { data: community } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', slug)
    .eq('is_removed', false)
    .single()

  if (!community) redirect('/')

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', community.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect(`/c/${slug}/submit?error=` + encodeURIComponent('You must be a member to post'))
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({ community_id: community.id, author_id: user.id, title, body, image_url })
    .select('id')
    .single()

  if (error || !post) {
    redirect(`/c/${slug}/submit?error=` + encodeURIComponent(error?.message ?? 'Failed to create post'))
  }

  revalidatePath(`/c/${slug}`)
  redirect(`/c/${slug}/${post.id}`)
}

export async function deletePost(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postId        = formData.get('post_id') as string
  const communitySlug = formData.get('community_slug') as string

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, community_id')
    .eq('id', postId)
    .single()

  if (!post) redirect(`/c/${communitySlug}`)

  const isOwner = post.author_id === user.id
  if (!isOwner) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('community_id', post.community_id)
      .eq('user_id', user.id)
      .single()

    const canDelete = membership?.role === 'admin' || membership?.role === 'moderator'
    if (!canDelete) redirect(`/c/${communitySlug}`)
  }

  await supabase.from('posts').update({ is_removed: true }).eq('id', postId)

  revalidatePath(`/c/${communitySlug}`)
  redirect(`/c/${communitySlug}`)
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/post.ts
git commit -m "feat: add createPost and deletePost server actions"
```

---

## Task 4: Comment Server Actions

**Files:**
- Create: `src/lib/actions/comment.ts`

- [ ] **Step 1: Create the file**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createComment(
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to comment' }

  const postId        = formData.get('post_id') as string
  const parentId      = (formData.get('parent_id') as string) || null
  const body          = ((formData.get('body') as string) ?? '').trim()
  const communitySlug = formData.get('community_slug') as string

  if (!body)           return { error: 'Comment cannot be empty' }
  if (body.length > 2000) return { error: 'Comment must be under 2000 characters' }
  if (!postId)         return { error: 'Invalid post' }

  const { data: post } = await supabase
    .from('posts')
    .select('community_id')
    .eq('id', postId)
    .eq('is_removed', false)
    .single()

  if (!post) return { error: 'Post not found' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', post.community_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) return { error: 'You must be a member to comment' }

  const { error } = await supabase
    .from('comments')
    .insert({ post_id: postId, author_id: user.id, parent_id: parentId, body })

  if (error) return { error: error.message }

  revalidatePath(`/c/${communitySlug}/${postId}`)
  return null
}

export async function deleteComment(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const commentId     = formData.get('comment_id') as string
  const postId        = formData.get('post_id') as string
  const communitySlug = formData.get('community_slug') as string

  const { data: comment } = await supabase
    .from('comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (!comment) redirect(`/c/${communitySlug}/${postId}`)

  const isOwner = comment.author_id === user.id
  if (!isOwner) {
    const { data: post } = await supabase
      .from('posts')
      .select('community_id')
      .eq('id', postId)
      .single()

    if (post) {
      const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('community_id', post.community_id)
        .eq('user_id', user.id)
        .single()

      const canDelete = membership?.role === 'admin' || membership?.role === 'moderator'
      if (!canDelete) redirect(`/c/${communitySlug}/${postId}`)
    }
  }

  await supabase.from('comments').update({ is_removed: true }).eq('id', commentId)

  revalidatePath(`/c/${communitySlug}/${postId}`)
  redirect(`/c/${communitySlug}/${postId}`)
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/comment.ts
git commit -m "feat: add createComment and deleteComment server actions"
```

---

## Task 5: Like Server Action

**Files:**
- Create: `src/lib/actions/like.ts`

- [ ] **Step 1: Create the file**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleLike(
  targetId: string,
  targetType: 'post' | 'comment'
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .single()

  if (existing) {
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
  } else {
    await supabase
      .from('likes')
      .insert({ user_id: user.id, target_id: targetId, target_type: targetType })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/like.ts
git commit -m "feat: add toggleLike server action"
```

---

## Task 6: PostCard Component

**Files:**
- Create: `src/components/post-card.tsx`

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/post-card.tsx
git commit -m "feat: add PostCard component"
```

---

## Task 7: LikeButton Component

**Files:**
- Create: `src/components/like-button.tsx`

- [ ] **Step 1: Create the file**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/lib/actions/like'

interface Props {
  targetId: string
  targetType: 'post' | 'comment'
  initialCount: number
  initialLiked: boolean
  userId: string | null
}

export function LikeButton({
  targetId,
  targetType,
  initialCount,
  initialLiked,
  userId,
}: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!userId) return
    const wasLiked = liked
    setLiked(!wasLiked)
    setCount(c => (wasLiked ? c - 1 : c + 1))
    startTransition(async () => {
      await toggleLike(targetId, targetType)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={!userId || isPending}
      className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${
        liked
          ? 'text-indigo-400'
          : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <span>{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/like-button.tsx
git commit -m "feat: add LikeButton component with optimistic UI"
```

---

## Task 8: CommentForm Component

**Files:**
- Create: `src/components/comment-form.tsx`

- [ ] **Step 1: Create the file**

```typescript
'use client'

import { useRef, useState, useTransition } from 'react'
import { createComment } from '@/lib/actions/comment'

interface Props {
  postId: string
  parentId?: string | null
  communitySlug: string
  onSuccess?: () => void
}

export function CommentForm({ postId, parentId, communitySlug, onSuccess }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createComment(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        onSuccess?.()
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      <input type="hidden" name="post_id"        value={postId} />
      <input type="hidden" name="parent_id"      value={parentId ?? ''} />
      <input type="hidden" name="community_slug" value={communitySlug} />
      <textarea
        name="body"
        required
        rows={3}
        placeholder={parentId ? 'Write a reply…' : 'Write a comment…'}
        className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {isPending ? 'Posting…' : parentId ? 'Reply' : 'Comment'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/comment-form.tsx
git commit -m "feat: add CommentForm component"
```

---

## Task 9: CommentItem Component

**Files:**
- Create: `src/components/comment-item.tsx`

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/comment-item.tsx
git commit -m "feat: add CommentItem component with reply toggle"
```

---

## Task 10: CommentThread Component

**Files:**
- Create: `src/components/comment-thread.tsx`

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/comment-thread.tsx
git commit -m "feat: add CommentThread component"
```

---

## Task 11: CreatePostForm Component

**Files:**
- Create: `src/components/create-post-form.tsx`

- [ ] **Step 1: Create the file**

```typescript
'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { createPost } from '@/lib/actions/post'

interface Props {
  communitySlug: string
  error?: string | null
}

export function CreatePostForm({ communitySlug, error: initialError }: Props) {
  const [imageUrl, setImageUrl]       = useState<string | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setImageUrl(url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form action={createPost} className="space-y-4">
      <input type="hidden" name="community_slug" value={communitySlug} />
      <input type="hidden" name="image_url"      value={imageUrl ?? ''} />

      {(initialError || uploadError) && (
        <div className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {initialError ?? uploadError}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          name="title"
          required
          maxLength={300}
          placeholder="Post title"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">Body</label>
        <textarea
          name="body"
          rows={5}
          placeholder="What's on your mind? (optional)"
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">Image</label>
        {imageUrl ? (
          <div>
            <div className="relative h-48 w-full overflow-hidden rounded-lg bg-zinc-800">
              <Image src={imageUrl} alt="Post image" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="mt-1 text-xs text-zinc-500 hover:text-red-400"
            >
              Remove image
            </button>
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-dashed border-zinc-700 px-6 py-3 text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : '+ Add image'}
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        Post
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/create-post-form.tsx
git commit -m "feat: add CreatePostForm component with Cloudinary upload"
```

---

## Task 12: Submit Page

**Files:**
- Create: `src/app/(main)/c/[slug]/submit/page.tsx`

- [ ] **Step 1: Create the file**

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CreatePostForm } from '@/components/create-post-form'

interface Props {
  params: { slug: string }
  searchParams: { error?: string }
}

export default async function SubmitPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .eq('is_removed', false)
    .single()

  if (!community) notFound()

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', community.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect(`/c/${params.slug}`)

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link
          href={`/c/${community.slug}`}
          className="text-sm text-zinc-500 hover:text-white"
        >
          ← c/{community.slug}
        </Link>
        <h1 className="mt-2 text-xl font-bold text-white">New Post</h1>
      </div>
      <CreatePostForm
        communitySlug={community.slug}
        error={searchParams.error ?? null}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/c/[slug]/submit/page.tsx
git commit -m "feat: add post submit page at /c/[slug]/submit"
```

---

## Task 13: Post Detail Page

**Files:**
- Create: `src/app/(main)/c/[slug]/[postId]/page.tsx`

- [ ] **Step 1: Create the file**

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { LikeButton } from '@/components/like-button'
import { CommentForm } from '@/components/comment-form'
import { CommentThread } from '@/components/comment-thread'
import { deletePost } from '@/lib/actions/post'
import type { Membership } from '@/types/database'
import type { CommentData } from '@/components/comment-item'

interface Props {
  params: { slug: string; postId: string }
}

export default async function PostPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch community
  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .eq('is_removed', false)
    .single()

  if (!community) notFound()

  // Fetch post with author
  const { data: post } = await supabase
    .from('posts')
    .select('*, author:profiles!author_id(username, avatar_url)')
    .eq('id', params.postId)
    .eq('community_id', community.id)
    .eq('is_removed', false)
    .single()

  if (!post) notFound()

  const postAuthor = post.author as { username: string; avatar_url: string | null } | null

  // Post like count
  const { count: postLikeCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('target_id', post.id)
    .eq('target_type', 'post')

  // User membership + liked state
  let membership: Pick<Membership, 'role'> | null = null
  let userLikedPost = false

  if (user) {
    const [membershipResult, likeResult] = await Promise.all([
      supabase
        .from('memberships')
        .select('role')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('likes')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('target_id', post.id)
        .eq('target_type', 'post')
        .single(),
    ])
    membership    = membershipResult.data
    userLikedPost = !!likeResult.data
  }

  const isMember    = !!membership
  const canDeletePost =
    !!user &&
    (user.id === post.author_id ||
      membership?.role === 'admin' ||
      membership?.role === 'moderator')

  // Fetch comments with authors
  const { data: rawComments } = await supabase
    .from('comments')
    .select('*, author:profiles!author_id(username, avatar_url)')
    .eq('post_id', post.id)
    .eq('is_removed', false)
    .order('created_at', { ascending: true })

  const rawCommentList = rawComments ?? []
  const commentIds = rawCommentList.map(c => c.id)

  // Comment like counts + user liked state
  const commentLikeCountMap  = new Map<string, number>()
  const userLikedCommentIds  = new Set<string>()

  if (commentIds.length > 0) {
    const { data: commentLikeRows } = await supabase
      .from('likes')
      .select('target_id')
      .eq('target_type', 'comment')
      .in('target_id', commentIds)

    for (const { target_id } of commentLikeRows ?? []) {
      commentLikeCountMap.set(target_id, (commentLikeCountMap.get(target_id) ?? 0) + 1)
    }

    if (user) {
      const { data: userCommentLikes } = await supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user.id)
        .eq('target_type', 'comment')
        .in('target_id', commentIds)

      for (const { target_id } of userCommentLikes ?? []) {
        userLikedCommentIds.add(target_id)
      }
    }
  }

  const enrichedComments: CommentData[] = rawCommentList.map(c => ({
    id:         c.id,
    body:       c.body,
    created_at: c.created_at,
    author_id:  c.author_id,
    parent_id:  c.parent_id,
    author:     c.author as { username: string; avatar_url: string | null } | null,
    likeCount:  commentLikeCountMap.get(c.id) ?? 0,
    liked:      userLikedCommentIds.has(c.id),
  }))

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <p className="text-sm text-zinc-500">
        <Link href={`/c/${community.slug}`} className="hover:text-white">
          c/{community.slug}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-zinc-400">Post</span>
      </p>

      {/* Post card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-1 flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold leading-tight text-white">{post.title}</h1>
          {canDeletePost && (
            <form action={deletePost}>
              <input type="hidden" name="post_id"        value={post.id} />
              <input type="hidden" name="community_slug" value={community.slug} />
              <button
                type="submit"
                onClick={(e) => {
                  if (!confirm('Delete this post?')) e.preventDefault()
                }}
                className="shrink-0 text-xs text-zinc-600 hover:text-red-400"
              >
                Delete
              </button>
            </form>
          )}
        </div>

        <p className="mb-4 text-xs text-zinc-500">
          by {postAuthor?.username ?? 'unknown'} ·{' '}
          {new Date(post.created_at).toLocaleDateString()}
        </p>

        {post.image_url && (
          <div className="relative mb-4 w-full overflow-hidden rounded-lg bg-zinc-800"
               style={{ aspectRatio: '16/9' }}>
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              className="object-contain"
            />
          </div>
        )}

        {post.body && (
          <p className="mb-4 whitespace-pre-wrap text-sm text-zinc-300">{post.body}</p>
        )}

        <LikeButton
          targetId={post.id}
          targetType="post"
          initialCount={postLikeCount ?? 0}
          initialLiked={userLikedPost}
          userId={user?.id ?? null}
        />
      </div>

      {/* Comment form — members only */}
      {isMember && (
        <div>
          <p className="mb-3 text-sm font-medium text-zinc-400">Add a comment</p>
          <CommentForm postId={post.id} communitySlug={community.slug} />
        </div>
      )}

      {/* Comment thread */}
      <div>
        <p className="mb-3 text-sm font-medium text-zinc-400">
          {enrichedComments.length}{' '}
          {enrichedComments.length === 1 ? 'comment' : 'comments'}
        </p>
        <CommentThread
          comments={enrichedComments}
          postId={post.id}
          communitySlug={community.slug}
          userId={user?.id ?? null}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/c/[slug]/[postId]/page.tsx
git commit -m "feat: add post detail page with comments and likes"
```

---

## Task 14: Update Community Feed Page

**Files:**
- Modify: `src/app/(main)/c/[slug]/page.tsx`

- [ ] **Step 1: Replace the entire file**

Replace `src/app/(main)/c/[slug]/page.tsx` with:

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { JoinButton } from '@/components/join-button'
import { PostCard } from '@/components/post-card'
import type { Membership } from '@/types/database'

interface Props {
  params: { slug: string }
  searchParams: { error?: string }
}

export default async function CommunityPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_removed', false)
    .single()

  if (!community) notFound()

  // Member count
  const { count: memberCount } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', community.id)

  // Current user membership
  let membership: Pick<Membership, 'role'> | null = null
  if (user) {
    const { data } = await supabase
      .from('memberships')
      .select('role')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .single()
    membership = data
  }

  // Fetch posts with author
  const { data: rawPosts } = await supabase
    .from('posts')
    .select('*, author:profiles!author_id(username)')
    .eq('community_id', community.id)
    .eq('is_removed', false)
    .order('created_at', { ascending: false })
    .limit(20)

  const posts = rawPosts ?? []
  const postIds = posts.map(p => p.id)

  // Bulk like + comment counts
  const likeCountMap    = new Map<string, number>()
  const commentCountMap = new Map<string, number>()

  if (postIds.length > 0) {
    const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
      supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', 'post')
        .in('target_id', postIds),
      supabase
        .from('comments')
        .select('post_id')
        .eq('is_removed', false)
        .in('post_id', postIds),
    ])
    for (const { target_id } of likeRows ?? []) {
      likeCountMap.set(target_id, (likeCountMap.get(target_id) ?? 0) + 1)
    }
    for (const { post_id } of commentRows ?? []) {
      commentCountMap.set(post_id, (commentCountMap.get(post_id) ?? 0) + 1)
    }
  }

  const isAdmin = membership?.role === 'admin'
  const count   = memberCount ?? 0

  return (
    <div>
      {/* Banner */}
      {community.banner_url && (
        <div className="relative mb-4 h-32 w-full overflow-hidden rounded-xl bg-zinc-800">
          <Image src={community.banner_url} alt={community.name} fill className="object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{community.name}</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            c/{community.slug} · {count} {count === 1 ? 'member' : 'members'}
          </p>
          {community.description && (
            <p className="mt-3 max-w-lg text-sm text-zinc-300">{community.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isAdmin && (
            <Link href={`/c/${community.slug}/settings`} className="text-xs text-zinc-400 hover:text-white">
              Settings
            </Link>
          )}
          <JoinButton
            communityId={community.id}
            communitySlug={community.slug}
            membership={membership}
            isLoggedIn={!!user}
          />
        </div>
      </div>

      {searchParams.error === 'admins-cannot-leave' && (
        <p className="mt-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
          Community admins cannot leave. Delete the community instead.
        </p>
      )}

      {/* Posts feed */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-400">
            {posts.length > 0
              ? `${posts.length} post${posts.length === 1 ? '' : 's'}`
              : 'Posts'}
          </p>
          {membership && (
            <Link
              href={`/c/${community.slug}/submit`}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              New Post
            </Link>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
            <p className="text-sm text-zinc-500">No posts yet.</p>
            {membership && (
              <Link
                href={`/c/${community.slug}/submit`}
                className="mt-2 inline-block text-sm text-indigo-400 hover:underline"
              >
                Be the first to post →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map(p => (
              <PostCard
                key={p.id}
                post={{
                  ...p,
                  author: p.author as { username: string } | null,
                }}
                likeCount={likeCountMap.get(p.id) ?? 0}
                commentCount={commentCountMap.get(p.id) ?? 0}
                communitySlug={community.slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/c/[slug]/page.tsx
git commit -m "feat: replace community page placeholder with live post feed"
```

---

## Task 15: Final Build Verification

- [ ] **Step 1: Full TypeScript check**

```bash
cd D:/CBT && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Lint**

```bash
cd D:/CBT && npm run lint
```

Expected: no errors (warnings acceptable).

- [ ] **Step 3: Production build**

```bash
cd D:/CBT && npm run build
```

Expected: Build completes successfully with no errors. All new routes show up in the output:
- `/c/[slug]`
- `/c/[slug]/submit`
- `/c/[slug]/[postId]`

- [ ] **Step 4: Manual smoke test**

Start dev server: `npm run dev`

Checklist:
1. Visit `/c/[slug]` — "No posts yet" + "New Post" button visible as member
2. Click "New Post" → submit page loads
3. Fill in title, optionally add image, submit → redirected to post detail page
4. Post detail page shows title, body, image, like button, comment form
5. Like the post → count increments optimistically
6. Submit a comment → appears in list without page reload
7. Click "Reply" on a comment → inline reply form appears
8. Submit a reply → appears indented under parent comment
9. Like a comment → count increments
10. Delete a comment (as author) → redirects back, comment gone
11. Visit community page → post appears in feed with correct like/comment counts

- [ ] **Step 5: Commit any lint fixes if needed**

```bash
git add -A
git commit -m "fix: resolve any lint issues from build"
```
