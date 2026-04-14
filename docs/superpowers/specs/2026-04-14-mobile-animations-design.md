# Mobile Optimisation + Animations Design

**Date:** 2026-04-14  
**Status:** Approved

---

## Overview

Four layered improvements to the CTB platform:
1. Bug fixes (login redirect, post body preview, light mode colors, communities sort)
2. Loading foundation (skeleton shimmer, Suspense boundaries)
3. Mobile UX (touch targets, spacing, forms, scroll, header)
4. Framer Motion animations (page transitions, staggered lists, micro-interactions)

Each layer is independently shippable.

---

## Layer 1: Bug Fixes

### Login Redirect
- `src/app/(auth)/login/actions.ts`: change `redirect('/')` → `redirect('/feed')` after successful `signInWithPassword`
- `src/app/(auth)/login/actions.ts`: Google OAuth already redirects to `/auth/callback` — verify the callback route also ends at `/feed`

### Post Body Preview in Card
- `src/components/post-card.tsx`: add a `line-clamp-2 text-xs text-[var(--muted-foreground)]` paragraph below the title showing `post.body`
- Render only when `post.body` is non-null and non-empty
- Works regardless of whether an image is present — the image thumbnail stays in the side position, body appears below the title in the right column

### Light Mode Hardcoded Colors
Audit and replace all hardcoded slate/zinc/white colors with CSS variables across:
- `src/app/(auth)/login/page.tsx` — `bg-slate-900`, `text-white`, `text-slate-400`, `border-slate-700/50`, `text-violet-400`
- `src/components/ui/skeleton.tsx` — `bg-slate-800`, `bg-slate-900`, `border-slate-700/50`, `border-slate-800`
- `src/components/theme-toggle.tsx` — hardcoded dark/light class variants
- Any other auth pages (`register`, `verify-email`) using hardcoded slate colors
- CSS variable replacements:
  - `bg-slate-900` → `bg-[var(--surface)]`
  - `bg-slate-800` → `bg-[var(--surface-raised)]`
  - `border-slate-700/50` → `border-[var(--border)]`
  - `text-white` → `text-[var(--foreground)]`
  - `text-slate-400` → `text-[var(--muted-foreground)]`
  - `text-violet-400` → `text-[var(--accent)]`

### Communities Sort Control
- `src/app/(main)/feed/page.tsx`: add `sort` search param (`newest` | `members` | `alpha`), default `newest`
- Sort logic (server-side):
  - `newest`: `.order('created_at', { ascending: false })` (current)
  - `members`: sort by computed member count descending (fetch counts then sort in JS, or use a DB view)
  - `alpha`: `.order('name', { ascending: true })`
- UI: segmented 3-button control rendered above the community list, using URL-driven state (Link with `?tab=communities&sort=X`)
- Style: small pill buttons matching the existing tab underline aesthetic

### Banner Aspect Ratio Fix
- `src/app/(main)/c/[slug]/page.tsx`: the banner currently uses a fixed `h-32 lg:h-44` which causes the community icon/header row (positioned with `-mt-6`) to clip into the image on narrow screens
- Fix: replace fixed height with `aspect-[3/1]` so the banner scales proportionally. Remove the `-mt-6` negative margin overlap — instead stack the icon row directly below the banner with a small `mt-3` gap and a regular layout flow
- The community icon moves to sit just below the banner (no overlap), similar to how Twitter/Reddit handle this on mobile. The header row (icon + join button) sits cleanly beneath
- On desktop (`lg:`): keep `aspect-[4/1]` for a wider, shallower banner

### Members List in About Tab
- The About tab currently shows description, stats, and rules — no member list
- Add a **Members** section at the bottom of the About tab
- Data: fetch all memberships with joined profile usernames and avatars for the community in `c/[slug]/page.tsx`, pass to `AboutTab`
- Query: `supabase.from('memberships').select('role, user_id, profiles!user_id(username, avatar_url)').eq('community_id', id).order('role')` — roles sort naturally: `admin` < `member` < `moderator` alphabetically, so sort in JS instead
- Sort order: `admin` first, `moderator` second, `member` last
- UI layout in `about-tab.tsx`:
  - Section heading: **"Members"** with total count
  - Sub-heading row **"Admin"** — avatar + username + `Admin` badge in accent color
  - Sub-heading row **"Moderators"** (if any) — same treatment, `Mod` badge
  - Sub-heading row **"Members"** — avatar grid or list, username only
  - Each member links to `/u/[username]`
  - Cap display at 50 members total to avoid huge lists; show "View all X members" link if over 50
- Add `MembersSkeleton` to `skeleton.tsx` for the Suspense fallback

---

## Layer 2: Loading Foundation

### Fix Skeleton Shimmer
- `src/app/globals.css`: add missing `@keyframes shimmer` block:
  ```css
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  ```
- `src/components/ui/skeleton.tsx`: replace all `animate-pulse bg-slate-800` blocks with the `.skeleton` utility class. Remove hardcoded slate colors.

### Suspense Boundaries
Extract async data-fetching into separate async server components, wrap with `<Suspense>`:

| Page | Component to extract | Fallback |
|------|---------------------|---------|
| `src/app/(main)/feed/page.tsx` | `<FeedContent>` | 5× `<PostCardSkeleton />` |
| `src/app/(main)/c/[slug]/page.tsx` | `<CommunityPosts>` | 5× `<PostCardSkeleton />` |
| `src/app/(main)/c/[slug]/[postId]/page.tsx` | `<CommentSection>` | 3× `<CommentSkeleton />` |
| `src/app/(main)/u/[username]/page.tsx` | `<UserPosts>` | 3× `<PostCardSkeleton />` |

Pattern:
```tsx
// page.tsx — renders instantly
export default function Page() {
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <FeedContent />  {/* async, fetches data */}
    </Suspense>
  )
}
```

---

## Layer 3: Mobile UX

### Touch Targets
- Minimum 44×44px effective tap area on all interactive elements
- Action bar buttons (`like-button`, `bookmark-button`, comment link): add `min-h-[44px] min-w-[44px]` or wrap in a larger click zone with `p-2 -m-2`
- Bottom tab bar links: already `flex-1 py-2` — increase to `py-3`
- Join/Follow buttons: ensure `h-9` minimum (currently `h-8` in some variants)

### Post Card Mobile Spacing
- `src/components/post-card.tsx`: use responsive padding `px-3 md:px-5` for main content area
- Image thumbnail: `h-14 w-14 md:h-16 md:w-16`
- Action bar: `px-3 md:px-5 pb-3 md:pb-4`

### Bottom Tab Bar
- `src/components/bottom-tab-bar.tsx`:
  - Increase tab height: `py-3` (from `py-2`)
  - Active state: add a small `2px` accent dot above the icon (absolute positioned) in addition to color change
  - Create button: use filled `PlusCircle` with a subtle accent background pill to distinguish it from navigation tabs

### Form Keyboard Behaviour
- Comment forms: add `className="pb-[env(safe-area-inset-bottom)]"` wrapper on mobile
- Create post form: ensure submit button is not at the very bottom — position it in the header/top bar on mobile so it stays visible when keyboard opens
- Add `inputMode="text"` and `autoComplete` hints to relevant inputs

### Scroll Behaviour
- Main content `<main>`: add `style={{ overscrollBehaviorY: 'contain' }}`
- Feed list container: add `style={{ WebkitOverflowScrolling: 'touch' }}`

### Mobile Header Enhancement
- `src/components/mobile-header.tsx`: add user avatar (28px, rounded-full) to the right of the search icon
- Fetch profile from layout (already available) and pass down as a prop
- Tapping the avatar navigates to `/u/[username]`

---

## Layer 4: Framer Motion

### Installation
```bash
npm install framer-motion
```

### Motion Re-export (`src/components/motion.tsx`)
```tsx
'use client'
export { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
```
All animation usage imports from this file, not directly from `framer-motion`.

### Page Transitions
- `src/app/(main)/layout.tsx`: wrap `<main>` content in `<AnimatePresence mode="wait">`
- Mobile (`md:hidden` wrapper): `initial={{ x: 20, opacity: 0 }}`, `animate={{ x: 0, opacity: 1 }}`, `exit={{ x: -20, opacity: 0 }}`, duration 200ms ease-out
- Desktop: `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, duration 150ms
- Key: current pathname

### Staggered Feed List
- `src/app/(main)/feed/page.tsx` and community page: wrap the post list in a `motion.div` container with `variants` that stagger children
- Each `PostCard` wrapped in `motion.div`: `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`
- Stagger: `delayChildren: 0`, `staggerChildren: 0.05`
- Cap: only first 5 items animate (rest render static) to avoid sluggishness on long lists

### Button Micro-interactions
- `src/components/like-button.tsx`: wrap button in `motion.button`, add `whileTap={{ scale: 0.88 }}`. On like activation: brief `scale: [1, 1.3, 1]` spring keyframe
- `src/components/bookmark-button.tsx`: `whileTap={{ scale: 0.88 }}`
- `src/components/follow-button.tsx`: `whileTap={{ scale: 0.88 }}`
- `src/components/join-button.tsx`: `whileTap={{ scale: 0.95 }}`

### Skeleton → Content Fade
- Suspense fallback components: no change
- Async content components: wrap their return in `motion.div` with `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `transition={{ duration: 0.2 }}`

### Reduced Motion
All animation components check `useReducedMotion()` and return `null` variants (instant, no movement) when true.

```tsx
const prefersReduced = useReducedMotion()
const variants = prefersReduced
  ? { hidden: {}, visible: {} }
  : { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }
```

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/app/(auth)/login/actions.ts` | Redirect to `/feed` |
| `src/app/(auth)/login/page.tsx` | CSS variable colors |
| `src/app/(auth)/register/page.tsx` | CSS variable colors |
| `src/app/(auth)/verify-email/page.tsx` | CSS variable colors |
| `src/app/globals.css` | Add `@keyframes shimmer` |
| `src/components/ui/skeleton.tsx` | Use `.skeleton` class, CSS vars |
| `src/components/post-card.tsx` | Body preview, responsive padding |
| `src/components/bottom-tab-bar.tsx` | Touch targets, active dot, Create pill |
| `src/components/mobile-header.tsx` | Avatar shortcut |
| `src/components/like-button.tsx` | Framer micro-interaction |
| `src/components/bookmark-button.tsx` | Framer micro-interaction |
| `src/components/follow-button.tsx` | Framer micro-interaction |
| `src/components/join-button.tsx` | Framer micro-interaction |
| `src/components/motion.tsx` | New — Framer re-export |
| `src/app/(main)/layout.tsx` | AnimatePresence page transitions, mobile header avatar prop |
| `src/app/(main)/feed/page.tsx` | Sort control, Suspense, staggered list |
| `src/app/(main)/c/[slug]/page.tsx` | Suspense, staggered list |
| `src/app/(main)/c/[slug]/[postId]/page.tsx` | Suspense comment section |
| `src/app/(main)/u/[username]/page.tsx` | Suspense posts |
| `src/app/(main)/c/[slug]/page.tsx` | Banner aspect ratio fix, members list query |
| `src/components/about-tab.tsx` | Members section (admin/mod/member groups) |

---

## Non-goals

- Pull-to-refresh (requires native bridge or complex scroll event handling — out of scope for MVP)
- Scroll-driven animations
- Layout animations (Framer's `layout` prop — too expensive on mobile)
- Bottom sheet / drawer navigation patterns
