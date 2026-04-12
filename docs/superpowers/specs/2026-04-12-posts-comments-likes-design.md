# Phase 3: Posts + Comments + Likes — Design Spec

**Date:** 2026-04-12
**Status:** Approved

---

## Overview

Phase 3 adds the core content layer to the CBT crypto community platform. Users can create posts inside communities, comment on them (with one level of threaded replies), and like both posts and comments.

---

## Decisions

| Topic | Decision |
|---|---|
| Post types | Text + optional image (Cloudinary) |
| Comments | Nested — one level of replies (top-level comment → replies) |
| Likes | Posts and comments, single `likes` table with `target_type` discriminator |

---

## 1. Database Schema

### `posts`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
community_id uuid NOT NULL REFERENCES communities(id)
author_id    uuid NOT NULL REFERENCES profiles(id)
title        text NOT NULL
body         text
image_url    text
is_removed   boolean NOT NULL DEFAULT false
created_at   timestamptz NOT NULL DEFAULT now()
```

### `comments`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
post_id     uuid NOT NULL REFERENCES posts(id)
author_id   uuid NOT NULL REFERENCES profiles(id)
parent_id   uuid REFERENCES comments(id)   -- null = top-level, non-null = reply
body        text NOT NULL
is_removed  boolean NOT NULL DEFAULT false
created_at  timestamptz NOT NULL DEFAULT now()
```

One level of nesting is enforced at the application layer — the reply form is only rendered on top-level comments (those with `parent_id IS NULL`).

### `likes`
```sql
user_id     uuid NOT NULL REFERENCES profiles(id)
target_id   uuid NOT NULL
target_type text NOT NULL CHECK (target_type IN ('post', 'comment'))
created_at  timestamptz NOT NULL DEFAULT now()
PRIMARY KEY (user_id, target_id, target_type)
```

No FK on `target_id` (polymorphic). Integrity is enforced by RLS + `target_type` check constraint.

### RLS Policies

**posts**
- Public read: `is_removed = false`
- Insert: authenticated users only (membership check in Server Action)
- Update/delete: own row only (soft delete via `is_removed`)

**comments**
- Same pattern as posts

**likes**
- Public read
- Insert: authenticated users only
- Delete: own row only (`user_id = auth.uid()`)

---

## 2. Routes & Pages

| Route | Purpose |
|---|---|
| `/c/[slug]` | Community feed — list of posts (extends existing page) |
| `/c/[slug]/submit` | Create post form |
| `/c/[slug]/[postId]` | Post detail — full content + comment thread |

### `/c/[slug]` (extended)
- Fetches posts for the community ordered newest-first
- Each `PostCard` shows: title, author username, timestamp, like count, comment count, image thumbnail (if present)
- "New Post" button visible to members only (hidden for non-members and logged-out users)

### `/c/[slug]/submit`
- Fields: title (required), body (optional textarea), image (optional Cloudinary upload)
- Only community members can post — membership check inside `createPost` Server Action
- On success: redirect to `/c/[slug]/[postId]`

### `/c/[slug]/[postId]`
- Full post: title, body, image, author, like button with count
- Comment form at the top (authenticated members only)
- Comments listed chronologically; each top-level comment has:
  - Like button + count
  - "Reply" toggle revealing an inline `CommentForm`
- Replies shown indented under their parent, with like button

---

## 3. Component Structure

| Component | Type | Purpose |
|---|---|---|
| `PostCard` | Server | Post summary row for community feed |
| `PostFeed` | Server | List of `PostCard`s + empty state |
| `CreatePostForm` | Client | Title + body + image upload, submits `createPost` action |
| `LikeButton` | Client | Toggle like on post or comment, shows count, optimistic UI |
| `CommentForm` | Client | Textarea + submit, used for new comments and inline replies |
| `CommentThread` | Server | Fetches and renders top-level comments with nested replies |
| `CommentItem` | Client | Single comment — body, author, like button, reply toggle |

---

## 4. Server Actions

| Action | File | Description |
|---|---|---|
| `createPost` | `src/lib/actions/post.ts` | Validates membership, inserts post row |
| `deletePost` | `src/lib/actions/post.ts` | Soft delete — own post or community admin/mod |
| `createComment` | `src/lib/actions/comment.ts` | Validates membership, inserts comment (optional `parent_id`) |
| `deleteComment` | `src/lib/actions/comment.ts` | Soft delete — own comment or admin/mod |
| `toggleLike` | `src/lib/actions/like.ts` | Upsert or delete row in `likes` table for post or comment |

---

## 5. Data Fetching Pattern

- Pages are Server Components — data fetched directly via `createClient()`
- Like counts and comment counts fetched as aggregates alongside post queries
- Like state (has current user liked?) resolved server-side and passed as prop to `LikeButton`
- Client Components (`LikeButton`, `CommentItem`, `CommentForm`) handle only interactivity

---

## 6. Image Upload

- Reuses existing `src/lib/cloudinary.ts` utility from Phase 1
- `CreatePostForm` uploads image client-side to Cloudinary before form submission (same pattern as avatar upload in settings)
- `image_url` stored on post row; `null` if no image

---

## Out of Scope (Phase 3)

- Edit post / edit comment (future)
- Reaction types beyond a single like
- Pagination / infinite scroll (load 20 posts; can be added in polish phase)
- Post sorting (chronological only per CLAUDE.md)
