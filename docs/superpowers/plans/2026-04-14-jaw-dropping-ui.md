# CTB Dark Editorial — UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform CTB's UI into a jaw-dropping "Dark Editorial" design — 3-panel layout, community color-coded post cards, ambient glow orb, cleaned-up active states throughout.

**Architecture:** Build foundation utilities first (color system, CSS), then update leaf components (LikeButton, Sidebar), then compose up to PostCard and CommunityCard, then add the new RightPanel, and finally rewire the layout and feed page.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, Supabase JS client (server components), TypeScript

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/community-colors.ts` | Create | `getCommunityColor(slug)` — deterministic 8-color palette |
| `src/app/globals.css` | Modify | Add `bg-ambient` utility class for the glow orb |
| `src/components/sidebar.tsx` | Modify | Border-left active indicator instead of background pill |
| `src/components/like-button.tsx` | Modify | Fix hardcoded `violet-400` → `var(--accent)` |
| `src/components/follow-button.tsx` | Modify | Fix hardcoded `indigo-600` → `var(--accent)` |
| `src/components/post-action-bar.tsx` | Modify | Accept `communityColor` prop; fix hardcoded `slate-*` / `violet-*` |
| `src/components/post-card.tsx` | Modify | Color strip, community badge, pass `communityColor` to action bar |
| `src/components/community-card.tsx` | Modify | Apply community color; fix hardcoded `slate-*` / `violet-*` |
| `src/components/right-panel.tsx` | Create | Server component — hot communities + who to follow |
| `src/app/(main)/layout.tsx` | Modify | Ambient glow bg, 3-panel flex structure wiring in RightPanel |
| `src/app/(main)/feed/page.tsx` | Modify | Underline-only tab bar; fix hardcoded `violet-*` / `slate-*` |

---

## Task 1: Create community color utility

**Files:**
- Create: `src/lib/community-colors.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/community-colors.ts

export interface CommunityColor {
  accent: string
  bg: string
  border: string
  strip: string   // gradient for the 3px top strip
}

const PALETTE: CommunityColor[] = [
  { accent: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.22)',  strip: 'linear-gradient(90deg,#1d4ed8,#3b82f6)' },
  { accent: '#7c3aed', bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.22)', strip: 'linear-gradient(90deg,#5b21b6,#7c3aed)' },
  { accent: '#0d9488', bg: 'rgba(13,148,136,0.10)', border: 'rgba(13,148,136,0.22)', strip: 'linear-gradient(90deg,#0f766e,#0d9488)' },
  { accent: '#059669', bg: 'rgba(5,150,105,0.10)',  border: 'rgba(5,150,105,0.22)',  strip: 'linear-gradient(90deg,#047857,#059669)' },
  { accent: '#ea580c', bg: 'rgba(234,88,12,0.10)',  border: 'rgba(234,88,12,0.22)',  strip: 'linear-gradient(90deg,#c2410c,#ea580c)' },
  { accent: '#e11d48', bg: 'rgba(225,29,72,0.10)',  border: 'rgba(225,29,72,0.22)',  strip: 'linear-gradient(90deg,#be123c,#e11d48)' },
  { accent: '#d97706', bg: 'rgba(217,119,6,0.10)',  border: 'rgba(217,119,6,0.22)',  strip: 'linear-gradient(90deg,#b45309,#d97706)' },
  { accent: '#4f46e5', bg: 'rgba(79,70,229,0.10)',  border: 'rgba(79,70,229,0.22)',  strip: 'linear-gradient(90deg,#4338ca,#4f46e5)' },
]

export function getCommunityColor(slug: string): CommunityColor {
  const hash = slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return PALETTE[hash % PALETTE.length]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/community-colors.ts
git commit -m "feat: add community color palette utility"
```

---

## Task 2: Add ambient glow CSS utility

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add the `bg-ambient` utility after the existing `.skeleton` block**

Replace the closing `}` of the `@layer utilities` block with:

```css
  .bg-ambient {
    background:
      radial-gradient(ellipse 700px 500px at 12% 18%, rgba(59,130,246,0.07) 0%, transparent 70%),
      var(--background);
  }

  html.light .bg-ambient {
    background:
      radial-gradient(ellipse 700px 500px at 12% 18%, rgba(37,99,235,0.04) 0%, transparent 70%),
      var(--background);
  }
}
```

The full `@layer utilities` block should now read:

```css
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .bg-hero-glow {
    background:
      radial-gradient(ellipse at top, rgba(59, 130, 246, 0.08) 0%, transparent 60%),
      var(--background);
  }

  html.light .bg-hero-glow {
    background:
      radial-gradient(ellipse at top, rgba(37, 99, 235, 0.04) 0%, transparent 60%),
      var(--background);
  }

  .skeleton {
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--surface-raised) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 2s linear infinite;
  }

  .bg-ambient {
    background:
      radial-gradient(ellipse 700px 500px at 12% 18%, rgba(59,130,246,0.07) 0%, transparent 70%),
      var(--background);
  }

  html.light .bg-ambient {
    background:
      radial-gradient(ellipse 700px 500px at 12% 18%, rgba(37,99,235,0.04) 0%, transparent 70%),
      var(--background);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add bg-ambient glow orb utility class"
```

---

## Task 3: Update sidebar active state

**Files:**
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Replace the `linkClass` function**

Find:
```typescript
  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive(href)
        ? 'bg-[var(--surface-raised)] text-[var(--accent)]'
        : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]'
    }`
```

Replace with:
```typescript
  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive(href)
        ? 'border-l-2 border-[var(--accent)] pl-[calc(0.75rem-2px)] text-[var(--accent)]'
        : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]'
    }`
```

- [ ] **Step 2: Verify visually**

Start dev server (`npm run dev`) and confirm:
- Active nav item shows a blue left border bar with no background fill
- Inactive items still show hover background
- Logo still renders correctly

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar.tsx
git commit -m "feat: sidebar active state — border-l indicator, no background pill"
```

---

## Task 4: Fix LikeButton colors

**Files:**
- Modify: `src/components/like-button.tsx`

- [ ] **Step 1: Replace hardcoded violet with CSS variable accent**

Find:
```typescript
        className={`flex items-center gap-1.5 text-sm transition-all disabled:opacity-50 ${
          liked
            ? 'text-violet-400 scale-105'
            : 'text-slate-500 hover:text-slate-300'
        }`}
```

Replace with:
```typescript
        className={`flex items-center gap-1.5 text-sm transition-all disabled:opacity-50 ${
          liked
            ? 'scale-105'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
        style={liked ? { color: accentColor } : undefined}
```

Find:
```typescript
        <Heart className={`h-3.5 w-3.5 transition-all ${liked ? 'fill-violet-400' : ''}`} />
```

Replace with:
```typescript
        <Heart
          className="h-3.5 w-3.5 transition-all"
          style={liked ? { fill: accentColor, color: accentColor } : undefined}
        />
```

- [ ] **Step 2: Add `accentColor` prop to the interface**

Find:
```typescript
interface Props {
  targetId: string
  targetType: 'post' | 'comment'
  initialCount: number
  initialLiked: boolean
  userId: string | null
}
```

Replace with:
```typescript
interface Props {
  targetId: string
  targetType: 'post' | 'comment'
  initialCount: number
  initialLiked: boolean
  userId: string | null
  accentColor?: string
}
```

- [ ] **Step 3: Destructure `accentColor` in the function signature**

Find:
```typescript
export function LikeButton({
  targetId,
  targetType,
  initialCount,
  initialLiked,
  userId,
}: Props) {
```

Replace with:
```typescript
export function LikeButton({
  targetId,
  targetType,
  initialCount,
  initialLiked,
  userId,
  accentColor = 'var(--accent)',
}: Props) {
```

- [ ] **Step 4: Commit**

```bash
git add src/components/like-button.tsx
git commit -m "feat: like-button uses accent CSS var; add accentColor prop for community override"
```

---

## Task 5: Fix FollowButton colors

**Files:**
- Modify: `src/components/follow-button.tsx`

- [ ] **Step 1: Replace hardcoded indigo with CSS variable**

Find:
```typescript
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
```

Replace with:
```typescript
            : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
```

- [ ] **Step 2: Commit**

```bash
git add src/components/follow-button.tsx
git commit -m "feat: follow-button uses accent CSS variable"
```

---

## Task 6: Update PostActionBar

**Files:**
- Modify: `src/components/post-action-bar.tsx`

- [ ] **Step 1: Add `CommunityColor` import and prop**

Add import at the top:
```typescript
import type { CommunityColor } from '@/lib/community-colors'
```

Find the `Props` interface:
```typescript
interface Props {
  post: PostForActionBar
  likeCount: number
  commentCount: number
  initialLiked: boolean
  userId?: string | null
  isSaved: boolean
  communitySlug: string
}
```

Replace with:
```typescript
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
```

- [ ] **Step 2: Destructure `communityColor` in the function signature**

Find:
```typescript
export function PostActionBar({
  post,
  likeCount,
  commentCount,
  initialLiked,
  userId,
  isSaved,
  communitySlug,
}: Props) {
```

Replace with:
```typescript
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
```

- [ ] **Step 3: Fix the action bar border and button colors**

Find:
```typescript
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
```

Replace with:
```typescript
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
```

Find:
```typescript
        <LikeButton
          targetId={post.id}
          targetType="post"
          initialCount={likeCount}
          initialLiked={initialLiked}
          userId={userId ?? null}
        />
```

Replace with:
```typescript
        <LikeButton
          targetId={post.id}
          targetType="post"
          initialCount={likeCount}
          initialLiked={initialLiked}
          userId={userId ?? null}
          accentColor={communityColor?.accent}
        />
```

Find:
```typescript
          className={`flex items-center gap-1.5 text-sm transition-all ${
            showCommentForm
              ? 'text-violet-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
```

Replace with:
```typescript
          className="flex items-center gap-1.5 text-sm transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          style={showCommentForm ? { color: communityColor?.accent ?? 'var(--accent)' } : undefined}
```

Find:
```typescript
        <span className="flex items-center gap-1.5 text-sm text-slate-500 cursor-default select-none">
```

Replace with:
```typescript
        <span className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] cursor-default select-none">
```

Find:
```typescript
            className={`flex items-center gap-1.5 text-sm transition-all ${
              copied
                ? 'text-green-400'
                : shareOpen
                  ? 'text-violet-400'
                  : 'text-slate-500 hover:text-slate-300'
            }`}
```

Replace with:
```typescript
            className={`flex items-center gap-1.5 text-sm transition-all ${
              copied ? 'text-green-400' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            style={shareOpen && !copied ? { color: communityColor?.accent ?? 'var(--accent)' } : undefined}
```

Find:
```typescript
            <div className="absolute bottom-full right-0 mb-2 z-20 min-w-[140px] rounded-xl border border-slate-700 bg-slate-900 py-1 shadow-xl">
```

Replace with:
```typescript
            <div className="absolute bottom-full right-0 mb-2 z-20 min-w-[140px] rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] py-1 shadow-xl">
```

Find (both occurrences in the share dropdown):
```typescript
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
```

Replace both with:
```typescript
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)] transition-colors"
```

Find (the Check icon in the share dropdown):
```typescript
                <Check className="h-3.5 w-3.5 text-slate-500" />
```

Replace with:
```typescript
                <Check className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
```

Find:
```typescript
                <XIcon className="h-3.5 w-3.5 text-slate-500" />
```

Replace with:
```typescript
                <XIcon className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
```

- [ ] **Step 4: Commit**

```bash
git add src/components/post-action-bar.tsx
git commit -m "feat: post-action-bar accepts communityColor; fix hardcoded slate/violet colors"
```

---

## Task 7: Update PostCard with color strip and community badge

**Files:**
- Modify: `src/components/post-card.tsx`

- [ ] **Step 1: Add community color import**

Add after the existing imports:
```typescript
import { getCommunityColor } from '@/lib/community-colors'
```

- [ ] **Step 2: Add community color to PostActionBar import (already imported, but update Props)**

Find the `Props` interface:
```typescript
interface Props {
  post: PostForCard
  likeCount: number
  commentCount: number
  communitySlug: string
  isSaved?: boolean
  initialLiked?: boolean
  userId?: string | null
  authorFlair?: string | null
}
```

No change needed — `communitySlug` is already there and we'll derive color from it.

- [ ] **Step 3: Replace the full component body**

The full new `PostCard` component:

```typescript
export function PostCard({ post, likeCount, commentCount, communitySlug, isSaved, initialLiked, userId, authorFlair }: Props) {
  const authorUsername = post.author?.username ?? null
  const color = getCommunityColor(communitySlug)

  return (
    <div
      className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-colors duration-200 hover:border-[var(--border-strong)]"
    >
      {/* Community color strip */}
      <div
        className="h-[3px] w-full"
        style={{ background: color.strip }}
      />

      {post.is_pinned && (
        <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-4 pt-2.5 pb-2 text-xs font-medium" style={{ color: color.accent }}>
          <Pin className="h-3 w-3" />
          <span>Pinned</span>
        </div>
      )}

      {/* Main clickable area */}
      <Link
        href={`/c/${communitySlug}/${post.id}`}
        className="flex gap-4 px-5 pt-4 pb-2"
      >
        {post.image_url && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-raised)]">
            <Image src={post.image_url} alt={post.title} fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {/* Flair + community badge row */}
          <div className="mb-1.5 flex items-center gap-2">
            {post.flair && (
              <span
                className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold border"
                style={{ color: color.accent, background: color.bg, borderColor: color.border }}
              >
                {post.flair}
              </span>
            )}
            <span
              className="ml-auto inline-block rounded px-2 py-0.5 text-[10px] font-semibold border"
              style={{ color: color.accent, background: color.bg, borderColor: color.border }}
            >
              c/{communitySlug}
            </span>
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold text-[var(--foreground)] leading-snug">{post.title}</h3>

          {post.link_preview && (
            <div className="mt-2.5 flex items-start gap-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-2.5"
              style={{ borderLeftWidth: '2px', borderLeftColor: color.accent }}>
              {post.link_preview.image_url && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-raised)]">
                  <Image
                    src={post.link_preview.image_url}
                    alt={post.link_preview.title ?? ''}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="min-w-0">
                {post.link_preview.title && (
                  <p className="line-clamp-1 text-xs font-medium text-[var(--foreground)]">{post.link_preview.title}</p>
                )}
                {post.link_preview.description && (
                  <p className="line-clamp-1 text-xs text-[var(--muted-foreground)]">{post.link_preview.description}</p>
                )}
                <p className="truncate text-[10px]" style={{ color: color.accent }}>{post.link_preview.url}</p>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Byline */}
      <div className="flex items-center gap-1.5 px-5 pb-2 text-xs text-[var(--muted-foreground)]">
        <span>by</span>
        {authorUsername ? (
          <Link
            href={`/u/${authorUsername}`}
            className="font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            {authorUsername}
          </Link>
        ) : (
          <span>unknown</span>
        )}
        {authorFlair && (
          <span
            className="rounded border px-1.5 py-0.5 text-[10px] font-medium"
            style={{ color: color.accent, background: color.bg, borderColor: color.border }}
          >
            {authorFlair}
          </span>
        )}
        <span>·</span>
        <span>{new Date(post.created_at).toLocaleDateString()}</span>
        {post.edited_at && <span className="italic">· edited</span>}
      </div>

      {/* Action bar */}
      <div className="px-5 pb-4">
        <PostActionBar
          post={post}
          likeCount={likeCount}
          commentCount={commentCount}
          initialLiked={initialLiked ?? false}
          userId={userId}
          isSaved={isSaved ?? false}
          communitySlug={communitySlug}
          communityColor={color}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd D:/CTB && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/post-card.tsx
git commit -m "feat: post-card — community color strip, badge, and color-coded action bar"
```

---

## Task 8: Update CommunityCard

**Files:**
- Modify: `src/components/community-card.tsx`

- [ ] **Step 1: Add community color import**

Add after existing imports:
```typescript
import { getCommunityColor } from '@/lib/community-colors'
```

- [ ] **Step 2: Replace the full component body**

```typescript
export function CommunityCard({ community, membership, isLoggedIn, memberCount, isAdmin }: Props) {
  const color = getCommunityColor(community.slug)

  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-center gap-3">
        {community.banner_url ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <Image src={community.banner_url} alt={community.name} fill className="object-cover" />
          </div>
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${color.accent}cc, ${color.accent}66)` }}
          >
            {community.name[0].toUpperCase()}
          </div>
        )}
        <div>
          <Link
            href={`/c/${community.slug}`}
            className="text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
          >
            c/{community.slug}
          </Link>
          <p className="text-xs text-[var(--muted-foreground)]">
            {community.name}
            {memberCount !== undefined && (
              <span className="ml-2 text-[var(--muted)]">{memberCount.toLocaleString()} {memberCount === 1 ? 'member' : 'members'}</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link
            href={`/c/${community.slug}/settings`}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <Settings className="h-3 w-3" />
            Settings
          </Link>
        )}
        <JoinButton
          communityId={community.id}
          communitySlug={community.slug}
          membership={membership}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/community-card.tsx
git commit -m "feat: community-card uses community color for avatar gradient; fix hardcoded colors"
```

---

## Task 9: Create RightPanel server component

**Files:**
- Create: `src/components/right-panel.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/components/right-panel.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCommunityColor } from '@/lib/community-colors'
import { FollowButton } from '@/components/follow-button'

interface Props {
  userId: string
}

export async function RightPanel({ userId }: Props) {
  const supabase = createClient()

  // ── Hot Communities ──────────────────────────────────────────
  // Get member counts per community
  const { data: allMemberships } = await supabase
    .from('memberships')
    .select('community_id')

  const countMap = new Map<string, number>()
  for (const m of allMemberships ?? []) {
    countMap.set(m.community_id, (countMap.get(m.community_id) ?? 0) + 1)
  }

  const topCommunityIds = [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => id)

  const { data: hotCommunities } = topCommunityIds.length > 0
    ? await supabase
        .from('communities')
        .select('id, name, slug')
        .in('id', topCommunityIds)
        .eq('is_removed', false)
    : { data: [] }

  // Sort fetched communities to match the rank order
  const sortedHotCommunities = (hotCommunities ?? []).sort(
    (a, b) => (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0)
  )

  // ── Who To Follow ─────────────────────────────────────────────
  // Users this person already follows
  const { data: followingRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  const alreadyFollowing = new Set((followingRows ?? []).map(r => r.following_id))
  alreadyFollowing.add(userId) // exclude self

  // Top posters (by post count, last 30 days) not already followed
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('author_id')
    .eq('is_removed', false)
    .gte('created_at', since)
    .limit(200)

  const postCountByAuthor = new Map<string, number>()
  for (const p of recentPosts ?? []) {
    if (!alreadyFollowing.has(p.author_id)) {
      postCountByAuthor.set(p.author_id, (postCountByAuthor.get(p.author_id) ?? 0) + 1)
    }
  }

  const topAuthorIds = [...postCountByAuthor.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id)

  const { data: suggestedProfiles } = topAuthorIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', topAuthorIds)
    : { data: [] }

  // Sort to match post count rank
  const sortedSuggested = (suggestedProfiles ?? []).sort(
    (a, b) => (postCountByAuthor.get(b.id) ?? 0) - (postCountByAuthor.get(a.id) ?? 0)
  )

  return (
    <aside className="hidden xl:flex w-72 shrink-0 flex-col gap-5 sticky top-6 self-start py-6 pl-4">

      {/* Hot Communities */}
      {sortedHotCommunities.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
            Hot Communities
          </p>
          <div className="space-y-3">
            {sortedHotCommunities.map(c => {
              const color = getCommunityColor(c.slug)
              const members = countMap.get(c.id) ?? 0
              return (
                <Link
                  key={c.id}
                  href={`/c/${c.slug}`}
                  className="flex items-center gap-2.5 group"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: color.accent }}
                  />
                  <span className="flex-1 text-sm font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors truncate">
                    c/{c.slug}
                  </span>
                  <span className="text-xs text-[var(--muted)] shrink-0">
                    {members.toLocaleString()}
                  </span>
                </Link>
              )
            })}
          </div>
          <Link
            href="/feed?tab=communities"
            className="mt-3 block text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
          >
            View all →
          </Link>
        </div>
      )}

      {/* Who to Follow */}
      {sortedSuggested.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
            Who to Follow
          </p>
          <div className="space-y-3">
            {sortedSuggested.map(profile => {
              const postCount = postCountByAuthor.get(profile.id) ?? 0
              return (
                <div key={profile.id} className="flex items-center gap-2.5">
                  <Link href={`/u/${profile.username}`} className="shrink-0">
                    <div className="h-8 w-8 rounded-full bg-[var(--surface-raised)] overflow-hidden flex items-center justify-center text-xs font-bold text-[var(--muted-foreground)]">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                      ) : (
                        profile.username[0].toUpperCase()
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/u/${profile.username}`}
                      className="block text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors truncate"
                    >
                      {profile.username}
                    </Link>
                    <p className="text-[11px] text-[var(--muted)]">
                      {postCount} {postCount === 1 ? 'post' : 'posts'} this month
                    </p>
                  </div>
                  <FollowButton
                    targetUserId={profile.id}
                    initialFollowed={false}
                    currentUserId={userId}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

    </aside>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd D:/CTB && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/right-panel.tsx
git commit -m "feat: add RightPanel server component — hot communities and who to follow"
```

---

## Task 10: Update main layout — ambient glow + 3-panel structure

**Files:**
- Modify: `src/app/(main)/layout.tsx`

- [ ] **Step 1: Add RightPanel import**

Add after existing imports:
```typescript
import { RightPanel } from '@/components/right-panel'
```

- [ ] **Step 2: Replace the full layout JSX**

Replace the `return (...)` block with:

```typescript
  return (
    <div className="min-h-screen bg-ambient text-[var(--foreground)]">
      {/* Desktop sidebar */}
      <Sidebar profile={profile} unreadCount={unreadCount ?? 0} />

      {/* Content column — offset by sidebar width on md+ */}
      <div className="flex flex-col min-h-screen md:ml-16 lg:ml-64">
        {/* Mobile header */}
        <MobileHeader />

        {/* Main content row (feed + right panel) */}
        <div className="flex flex-1">
          <main className="flex-1 min-w-0 py-6 px-4 pb-24 md:pb-6">
            <div className="mx-auto w-full max-w-2xl">
              {children}
            </div>
          </main>

          {/* Right panel — xl+ only, sticky */}
          <RightPanel userId={user.id} />
        </div>

        {/* Desktop footer */}
        <footer className="hidden md:block border-t border-[var(--border)] mt-8">
          <div className="mx-auto max-w-2xl px-4 py-6 flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="text-xs font-semibold text-[var(--accent)]">CTB</span>
            <Link href="/terms"      className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Terms</Link>
            <Link href="/privacy"    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Privacy</Link>
            <Link href="/guidelines" className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Guidelines</Link>
            <span className="text-xs text-[var(--muted)] ml-auto">Not financial advice. DYOR.</span>
          </div>
        </footer>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar profile={profile} unreadCount={unreadCount ?? 0} />
    </div>
  )
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd D:/CTB && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Start dev server and visually verify**

```bash
npm run dev
```

Check at `http://localhost:3000/feed`:
- Page background has a faint blue glow in the top-left area
- At ≥1280px wide: right panel visible with hot communities + who to follow
- At <1280px: right panel hidden, feed takes full width
- Feed column content is centered and capped at `max-w-2xl`

- [ ] **Step 5: Commit**

```bash
git add src/app/(main)/layout.tsx
git commit -m "feat: main layout — ambient glow bg, 3-panel flex structure with RightPanel"
```

---

## Task 11: Update feed page tab bar and fix hardcoded colors

**Files:**
- Modify: `src/app/(main)/feed/page.tsx`

- [ ] **Step 1: Replace the tab nav section**

Find:
```typescript
      {/* Tab nav */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-2xl border border-slate-700/50 bg-slate-900 p-1">
          {TABS.map(t => (
            <Link
              key={t.id}
              href={`/feed?tab=${t.id}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-violet-600 text-white shadow-glow-violet-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        {user && (
          <Link href="/c/new" className="text-sm text-violet-400 hover:underline">
            + Create
          </Link>
        )}
      </div>
```

Replace with:
```typescript
      {/* Tab nav */}
      <div className="flex items-center justify-between border-b border-[var(--border)] mb-6">
        <div className="flex gap-0">
          {TABS.map(t => (
            <Link
              key={t.id}
              href={`/feed?tab=${t.id}`}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-[var(--accent)] text-[var(--foreground)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        {user && (
          <Link href="/c/new" className="mb-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors">
            + Create
          </Link>
        )}
      </div>
```

- [ ] **Step 2: Fix empty state containers (feed tab — no communities joined)**

Find:
```typescript
            <div className="rounded-xl border border-slate-700/50 bg-slate-900 p-8 text-center">
              <p className="text-slate-400 mb-2">You haven&apos;t joined any communities yet.</p>
              <Link href="/feed?tab=communities" className="text-sm text-violet-400 hover:underline">
                Browse communities →
              </Link>
            </div>
```

Replace with:
```typescript
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <p className="text-[var(--muted-foreground)] mb-2">You haven&apos;t joined any communities yet.</p>
              <Link href="/feed?tab=communities" className="text-sm text-[var(--accent)] hover:underline">
                Browse communities →
              </Link>
            </div>
```

- [ ] **Step 3: Fix empty state (feed tab — no posts yet)**

Find:
```typescript
            <div className="rounded-xl border border-slate-700/50 bg-slate-900 p-8 text-center">
              <p className="text-sm font-medium text-slate-400">Nothing here yet</p>
              <p className="mt-1 text-xs text-slate-600">Your communities haven&apos;t posted anything yet. Check back soon.</p>
            </div>
```

Replace with:
```typescript
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Nothing here yet</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Your communities haven&apos;t posted anything yet. Check back soon.</p>
            </div>
```

- [ ] **Step 4: Fix "Load more" links in feed tab**

Find (feed tab):
```typescript
                  <Link href={`/feed?tab=feed&limit=${pageLimit + 20}`} className="text-sm text-violet-400 hover:underline">
```

Replace with:
```typescript
                  <Link href={`/feed?tab=feed&limit=${pageLimit + 20}`} className="text-sm text-[var(--accent)] hover:underline">
```

- [ ] **Step 5: Fix empty state and "Load more" in all tab**

Find (all tab empty state):
```typescript
            <div className="rounded-xl border border-slate-700/50 bg-slate-900 p-8 text-center">
              <p className="text-sm font-medium text-slate-400">Nothing posted yet</p>
              <p className="mt-1 text-xs text-slate-600">Be the first to join a community and share something.</p>
            </div>
```

Replace with:
```typescript
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Nothing posted yet</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Be the first to join a community and share something.</p>
            </div>
```

Find (all tab load more):
```typescript
                  <Link href={`/feed?tab=all&limit=${pageLimit + 20}`} className="text-sm text-violet-400 hover:underline">
```

Replace with:
```typescript
                  <Link href={`/feed?tab=all&limit=${pageLimit + 20}`} className="text-sm text-[var(--accent)] hover:underline">
```

- [ ] **Step 6: Fix communities tab empty state**

Find:
```typescript
            <div className="rounded-xl border border-slate-700/50 bg-slate-900 py-16 text-center">
              <p className="mb-4 text-sm text-slate-500">No communities yet.</p>
              {user && (
                <Link href="/c/new" className="text-sm text-violet-400 hover:underline">
                  Be the first to create one →
                </Link>
              )}
            </div>
```

Replace with:
```typescript
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] py-16 text-center">
              <p className="mb-4 text-sm text-[var(--muted-foreground)]">No communities yet.</p>
              {user && (
                <Link href="/c/new" className="text-sm text-[var(--accent)] hover:underline">
                  Be the first to create one →
                </Link>
              )}
            </div>
```

- [ ] **Step 7: Final TypeScript check + visual verification**

```bash
cd D:/CTB && npx tsc --noEmit
```

Then in dev server, verify at `http://localhost:3000/feed`:
- Tab bar shows underline indicator on active tab — no pill background
- All empty states use CSS variable colors
- "Load more" and "+ Create" links are blue (accent), not violet
- Community tab shows community cards with community-color avatars
- Feed tab shows posts with color strips and community badges

- [ ] **Step 8: Commit**

```bash
git add src/app/(main)/feed/page.tsx
git commit -m "feat: feed page — underline tab bar, fix hardcoded violet/slate colors"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Left sidebar border-l active indicator (Task 3)
- ✅ Feed column max-w-2xl centered in flex-1 (Task 10)
- ✅ Right panel xl+ with hot communities + who to follow (Tasks 9, 10)
- ✅ Community color-coded post cards — strip, badge, flair, like pill (Tasks 1, 7)
- ✅ Underline-only tab bar (Task 11)
- ✅ Ambient glow orb CSS (Tasks 2, 10)
- ✅ No hardcoded violet-* / slate-* in feed/sidebar/cards (Tasks 3–11)
- ✅ Light mode: `html.light .bg-ambient` defined in Task 2
- ✅ Mobile layout unchanged — only `hidden xl:flex` panel added

**Placeholder scan:** No TBDs or incomplete steps found.

**Type consistency:**
- `CommunityColor` interface defined in Task 1, imported in Tasks 6, 7, 8, 9
- `getCommunityColor(slug)` defined in Task 1, used in Tasks 7, 8, 9
- `communityColor?: CommunityColor` prop added to `PostActionBar` in Task 6, passed from `PostCard` in Task 7
- `accentColor?: string` added to `LikeButton` in Task 4, passed from `PostActionBar` in Task 6
- `RightPanel` accepts `{ userId: string }`, passed from layout in Task 10
