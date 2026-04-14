# Mobile Optimisation + Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four bug categories, add loading skeletons with shimmer, improve mobile UX across touch targets / spacing / forms, then add Framer Motion page transitions, staggered lists, and button micro-interactions.

**Architecture:** Four independent layers — bug fixes → loading foundation → mobile UX → animations. Each layer is shippable on its own. No new routes or DB changes. Framer Motion is isolated via a `motion.tsx` re-export so server components stay clean.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, Supabase, Framer Motion (new dep), TypeScript

---

## File Map

| File | What changes |
|------|-------------|
| `src/app/(auth)/login/actions.ts` | Redirect to `/feed` |
| `src/app/(auth)/login/page.tsx` | CSS variable colors |
| `src/app/(auth)/register/page.tsx` | CSS variable colors |
| `src/app/globals.css` | Add `@keyframes shimmer` |
| `src/components/ui/skeleton.tsx` | Use `.skeleton` class + CSS vars + `MembersSkeleton` |
| `src/components/post-card.tsx` | Body preview, responsive padding |
| `src/app/(main)/feed/page.tsx` | Communities sort control, Suspense, staggered list |
| `src/app/(main)/c/[slug]/page.tsx` | Banner aspect ratio, members query, Suspense |
| `src/app/(main)/c/[slug]/[postId]/page.tsx` | Suspense comment section |
| `src/app/(main)/u/[username]/page.tsx` | Suspense posts |
| `src/components/about-tab.tsx` | Members section |
| `src/components/bottom-tab-bar.tsx` | Touch targets, active dot, Create pill |
| `src/components/mobile-header.tsx` | Avatar shortcut prop |
| `src/app/(main)/layout.tsx` | Pass profile to MobileHeader, scroll overscroll, AnimatePresence |
| `src/components/like-button.tsx` | Framer micro-interaction |
| `src/components/bookmark-button.tsx` | Framer micro-interaction |
| `src/components/follow-button.tsx` | Framer micro-interaction |
| `src/components/join-button.tsx` | Framer micro-interaction |
| `src/components/motion.tsx` | New — Framer re-export (client) |

---

## Layer 1 — Bug Fixes

### Task 1: Login redirects to `/feed`

**Files:**
- Modify: `src/app/(auth)/login/actions.ts`

- [ ] **Step 1: Fix the redirect**

In `src/app/(auth)/login/actions.ts`, change line 18:

```ts
  redirect('/feed')
```

(was `redirect('/')`)

- [ ] **Step 2: Build check**

```bash
npm run build
```
Expected: no TypeScript errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/login/actions.ts
git commit -m "fix: redirect to /feed after login"
```

---

### Task 2: Post body preview in card

**Files:**
- Modify: `src/components/post-card.tsx`

- [ ] **Step 1: Add body below title**

In `src/components/post-card.tsx`, after the `<h3>` title line (line 84), add:

```tsx
          {post.body && (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)] leading-relaxed">
              {post.body}
            </p>
          )}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/components/post-card.tsx
git commit -m "feat: show post body preview (2-line truncate) in card"
```

---

### Task 3: Fix hardcoded colors in auth pages

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Replace login page colors**

Replace the entire content of `src/app/(auth)/login/page.tsx`:

```tsx
import { signInWithEmail } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  searchParams: { error?: string }
}

export default function LoginPage({ searchParams }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
      <h2 className="mb-6 text-xl font-semibold text-[var(--foreground)]">Sign in</h2>

      {searchParams.error && (
        <p className="mb-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}

      <form action={signInWithEmail} className="flex flex-col gap-4">
        <Input name="email" type="email" label="Email" required placeholder="you@example.com" />
        <Input name="password" type="password" label="Password" required placeholder="••••••••" />
        <Button type="submit" className="w-full mt-1">Sign in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        No account?{' '}
        <Link href="/register" className="text-[var(--accent)] hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Replace register page colors**

Replace the entire content of `src/app/(auth)/register/page.tsx`:

```tsx
import { signUp, resendConfirmation } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  searchParams: { error?: string; verify?: string; email?: string; resent?: string }
}

export default function RegisterPage({ searchParams }: Props) {
  if (searchParams.verify === '1') {
    const email = searchParams.email ? decodeURIComponent(searchParams.email) : ''
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <div className="mb-4 text-4xl">📬</div>
        <h2 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Check your email</h2>
        <p className="mb-1 text-sm text-[var(--muted-foreground)]">
          We sent a confirmation link to
        </p>
        <p className="mb-6 text-sm font-medium text-[var(--accent)] break-all">{email}</p>
        <p className="mb-6 text-sm text-[var(--muted-foreground)]">
          Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
        </p>

        {searchParams.resent === '1' && (
          <p className="mb-4 rounded-xl border border-green-900/50 bg-green-950/30 px-4 py-2 text-sm text-green-400">
            Confirmation email resent.
          </p>
        )}

        <form action={resendConfirmation}>
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="secondary" className="w-full">
            Resend confirmation email
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          Wrong email?{' '}
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            Start over
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
      <h2 className="mb-6 text-xl font-semibold text-[var(--foreground)]">Create account</h2>

      {searchParams.error && (
        <p className="mb-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}

      <form action={signUp} className="flex flex-col gap-4">
        <Input
          name="username"
          label="Username"
          required
          placeholder="satoshi"
          pattern="[a-zA-Z0-9_]{3,20}"
          title="3-20 characters: letters, numbers, underscores"
        />
        <Input name="email" type="email" label="Email" required placeholder="you@example.com" />
        <Input name="password" type="password" label="Password" required placeholder="••••••••" minLength={8} />
        <Button type="submit" className="w-full mt-1">Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Have an account?{' '}
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 3b: Fix theme-toggle.tsx hardcoded colors**

Replace `src/components/theme-toggle.tsx`:

```tsx
'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-8 w-8" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center justify-center rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
```

- [ ] **Step 4: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src/app/(auth)/login/page.tsx src/app/(auth)/register/page.tsx src/components/theme-toggle.tsx
git commit -m "fix: replace hardcoded slate colors with CSS vars in auth pages and theme toggle"
```

---

### Task 4: Communities sort control

**Files:**
- Modify: `src/app/(main)/feed/page.tsx`

- [ ] **Step 1: Add sort param to Props and fetch logic**

At the top of `FeedPage`, update the Props interface and add sort logic. Find the `interface Props` and the `tab === 'communities'` block:

```tsx
interface Props {
  searchParams: { tab?: string; limit?: string; sort?: string }
}
```

In the communities fetch block (after `else {`), replace the communities query:

```tsx
  } else {
    // communities tab
    const sort = (searchParams.sort ?? 'newest') as 'newest' | 'members' | 'alpha'

    const communitiesQuery = supabase
      .from('communities')
      .select('*')
      .eq('is_removed', false)

    if (sort === 'alpha') {
      communitiesQuery.order('name', { ascending: true })
    } else {
      communitiesQuery.order('created_at', { ascending: false })
    }

    const { data: communities } = await communitiesQuery
    allCommunities = (communities ?? []) as CommunityRow[]

    if (allCommunities.length > 0) {
      const { data: allMemberships } = await supabase
        .from('memberships')
        .select('community_id')

      for (const m of allMemberships ?? []) {
        communityMemberCountMap.set(m.community_id, (communityMemberCountMap.get(m.community_id) ?? 0) + 1)
      }

      if (sort === 'members') {
        allCommunities.sort((a, b) =>
          (communityMemberCountMap.get(b.id) ?? 0) - (communityMemberCountMap.get(a.id) ?? 0)
        )
      }
    }
  }
```

- [ ] **Step 2: Add sort UI above the communities list**

Find the communities tab render block (`{tab === 'communities' && (`). Add a sort control above the community list, right after the opening `<div className="space-y-2">`:

```tsx
      {tab === 'communities' && (
        <div>
          {/* Sort control */}
          <div className="flex items-center gap-1 mb-4">
            {(['newest', 'members', 'alpha'] as const).map(s => (
              <Link
                key={s}
                href={`/feed?tab=communities&sort=${s}`}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  (searchParams.sort ?? 'newest') === s
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {s === 'newest' ? 'Newest' : s === 'members' ? 'Most Members' : 'A–Z'}
              </Link>
            ))}
          </div>
          <div className="space-y-2">
            {allCommunities.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] py-16 text-center">
                <p className="mb-4 text-sm text-[var(--muted-foreground)]">No communities yet.</p>
                {user && (
                  <Link href="/c/new" className="text-sm text-[var(--accent)] hover:underline">
                    Be the first to create one →
                  </Link>
                )}
              </div>
            ) : (
              allCommunities.map(c => (
                <CommunityCard
                  key={c.id}
                  community={c}
                  membership={membershipMap.get(c.id) ?? null}
                  isLoggedIn={!!user}
                  memberCount={communityMemberCountMap.get(c.id) ?? 0}
                  isAdmin={membershipMap.get(c.id)?.role === 'admin'}
                />
              ))
            )}
          </div>
        </div>
      )}
```

(Remove the old `{tab === 'communities' && (` block entirely and replace with the above.)

- [ ] **Step 3: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/app/(main)/feed/page.tsx
git commit -m "feat: communities sort control (newest / most members / a-z)"
```

---

### Task 5: Banner aspect ratio fix

**Files:**
- Modify: `src/app/(main)/c/[slug]/page.tsx`

- [ ] **Step 1: Replace fixed banner height with aspect ratio**

Find the banner block (lines 135–143):

```tsx
      {/* Banner hero */}
      <div className="relative mb-0 h-32 w-full overflow-hidden rounded-2xl lg:h-44">
        {community.banner_url ? (
          <Image src={community.banner_url} alt={community.name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-900 via-slate-900 to-[var(--background)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Header — overlaps banner */}
      <div className="flex items-end justify-between gap-4 -mt-6 px-1">
```

Replace with:

```tsx
      {/* Banner hero */}
      <div className="relative w-full overflow-hidden rounded-2xl aspect-[3/1] lg:aspect-[4/1]">
        {community.banner_url ? (
          <Image src={community.banner_url} alt={community.name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-900 via-slate-900 to-[var(--background)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Header — sits below banner, no overlap */}
      <div className="flex items-center justify-between gap-4 mt-3 px-1">
```

- [ ] **Step 2: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/c/[slug]/page.tsx
git commit -m "fix: community banner uses aspect-ratio instead of fixed height"
```

---

### Task 6: Members list in About tab

**Files:**
- Modify: `src/app/(main)/c/[slug]/page.tsx`
- Modify: `src/components/about-tab.tsx`

- [ ] **Step 1: Fetch members in community page**

In `src/app/(main)/c/[slug]/page.tsx`, after the `userFlair` block (around line 50), add:

```tsx
  // Fetch members with profiles for About tab
  const { data: membersRaw } = await supabase
    .from('memberships')
    .select('role, user_id, profiles!user_id(username, avatar_url)')
    .eq('community_id', community.id)
    .limit(50)

  type MemberRow = { role: string; user_id: string; profiles: { username: string; avatar_url: string | null } | null }
  const members: MemberRow[] = (membersRaw ?? []) as MemberRow[]

  // Sort: admin first, moderator second, member last
  const roleOrder: Record<string, number> = { admin: 0, moderator: 1, member: 2 }
  members.sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3))
```

- [ ] **Step 2: Pass members to AboutTab**

Find where `<AboutTab` is rendered and add the `members` prop:

```tsx
        <AboutTab
          rules={community.rules}
          description={community.description}
          memberCount={count}
          createdAt={community.created_at}
          communityId={community.id}
          userId={user?.id ?? null}
          userFlair={userFlair}
          isMember={!!membership}
          members={members}
        />
```

- [ ] **Step 3: Update AboutTab component**

Replace the entire `src/components/about-tab.tsx`:

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { PLATFORM_RULES } from '@/lib/platform-rules'
import { FlairPicker } from './flair-picker'

interface Rule {
  title: string
  body: string
}

interface Member {
  role: string
  user_id: string
  profiles: { username: string; avatar_url: string | null } | null
}

interface Props {
  rules: Rule[]
  description?: string | null
  memberCount?: number
  createdAt?: string
  communityId?: string
  userId?: string | null
  userFlair?: string | null
  isMember?: boolean
  members?: Member[]
}

export function AboutTab({ rules, description, memberCount, createdAt, communityId, userId, userFlair, isMember, members = [] }: Props) {
  const admins = members.filter(m => m.role === 'admin')
  const mods   = members.filter(m => m.role === 'moderator')
  const regular = members.filter(m => m.role === 'member')

  return (
    <div className="space-y-4 py-6">
      {/* About card */}
      {(description || memberCount !== undefined) && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">About</h2>
          {description && (
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{description}</p>
          )}
          {memberCount !== undefined && (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              <span className="font-semibold text-[var(--foreground)]">{memberCount.toLocaleString()}</span>{' '}
              {memberCount === 1 ? 'member' : 'members'}
            </p>
          )}
          {createdAt && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Created {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
          {isMember && communityId && userId && (
            <FlairPicker communityId={communityId} currentFlair={userFlair ?? null} />
          )}
        </section>
      )}

      {/* Members */}
      {members.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            Members
            <span className="ml-1.5 text-xs font-normal text-[var(--muted-foreground)]">({memberCount?.toLocaleString()})</span>
          </h2>

          {admins.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">Admin</p>
              <div className="space-y-2">
                {admins.map(m => (
                  <MemberRow key={m.user_id} member={m} badge="Admin" badgeClass="text-[var(--accent)] bg-[var(--surface-raised)] border border-[var(--border)]" />
                ))}
              </div>
            </div>
          )}

          {mods.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Moderators</p>
              <div className="space-y-2">
                {mods.map(m => (
                  <MemberRow key={m.user_id} member={m} badge="Mod" badgeClass="text-[var(--muted-foreground)] bg-[var(--surface-raised)] border border-[var(--border)]" />
                ))}
              </div>
            </div>
          )}

          {regular.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Members</p>
              <div className="space-y-2">
                {regular.map(m => (
                  <MemberRow key={m.user_id} member={m} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Platform rules */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">Platform Rules</h2>
        <p className="mb-3 text-xs text-[var(--muted-foreground)]">Applies to all communities</p>
        <ol className="space-y-3">
          {PLATFORM_RULES.map((rule, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[11px] font-medium text-[var(--muted-foreground)]">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-[var(--foreground)]">{rule.title}</p>
                {rule.body && (
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{rule.body}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Community-specific rules */}
      {rules.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Community Rules</h2>
          <ol className="space-y-3">
            {rules.map((rule, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[11px] font-medium text-[var(--accent)]">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-[var(--foreground)]">{rule.title}</p>
                  {rule.body && (
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{rule.body}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

function MemberRow({ member, badge, badgeClass }: { member: { user_id: string; profiles: { username: string; avatar_url: string | null } | null }; badge?: string; badgeClass?: string }) {
  const username = member.profiles?.username ?? 'unknown'
  const avatar   = member.profiles?.avatar_url

  return (
    <Link href={`/u/${username}`} className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-[var(--surface-raised)] transition-colors">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[var(--surface-raised)]">
        {avatar ? (
          <Image src={avatar} alt={username} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--muted-foreground)]">
            {username[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <span className="text-sm text-[var(--foreground)] font-medium">{username}</span>
      {badge && (
        <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass}`}>{badge}</span>
      )}
    </Link>
  )
}
```

- [ ] **Step 4: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src/app/(main)/c/[slug]/page.tsx src/components/about-tab.tsx
git commit -m "feat: members list in about tab, grouped admin/mod/member"
```

---

## Layer 2 — Loading Foundation

### Task 7: Fix skeleton shimmer animation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/skeleton.tsx`

- [ ] **Step 1: Add `@keyframes shimmer` to globals.css**

In `src/app/globals.css`, add before the closing `}` of `@layer utilities`:

```css
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
```

- [ ] **Step 2: Rewrite skeleton.tsx with CSS vars and shimmer class**

Replace the entire `src/components/ui/skeleton.tsx`:

```tsx
function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton rounded-lg bg-[var(--surface-raised)] ${className}`} />
  )
}

export function PostCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-5 w-5 rounded-full" />
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-3 w-16 ml-auto" />
      </div>
      <SkeletonBlock className="h-5 w-3/4" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-5/6" />
      <div className="flex items-center gap-4 pt-1">
        <SkeletonBlock className="h-4 w-12" />
        <SkeletonBlock className="h-4 w-16" />
        <SkeletonBlock className="h-4 w-10 ml-auto" />
      </div>
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="space-y-3 border-l-2 border-[var(--border)] pl-4">
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-4 w-4 rounded-full" />
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-3 w-12" />
      </div>
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-4/5" />
      <div className="flex gap-3 pt-1">
        <SkeletonBlock className="h-3 w-8" />
        <SkeletonBlock className="h-3 w-10" />
      </div>
    </div>
  )
}

export function CommunityCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
      <SkeletonBlock className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-3 w-20" />
      </div>
      <SkeletonBlock className="h-8 w-16 rounded-xl" />
    </div>
  )
}

export function MembersSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 p-1.5">
          <SkeletonBlock className="h-7 w-7 rounded-full shrink-0" />
          <SkeletonBlock className="h-3 w-28" />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/components/ui/skeleton.tsx
git commit -m "fix: skeleton shimmer animation with CSS vars, add MembersSkeleton"
```

---

### Task 8: Suspense boundaries — feed page

**Files:**
- Modify: `src/app/(main)/feed/page.tsx`

- [ ] **Step 1: Extract async content into a sub-component and wrap with Suspense**

The feed page is a large server component. The pattern is: extract the data-fetching + render into an async component, wrap the page shell with `<Suspense>`.

At the top of `src/app/(main)/feed/page.tsx`, add the Suspense import:

```tsx
import { Suspense } from 'react'
import { PostCardSkeleton, CommunityCardSkeleton } from '@/components/ui/skeleton'
```

Then wrap the tab content inside `return (` with Suspense. Since the entire page fetches data, the simplest approach is to split into a thin shell + content component. Add this component **above** `FeedPage`:

```tsx
function PostListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => <PostCardSkeleton key={i} />)}
    </div>
  )
}

function CommunityListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => <CommunityCardSkeleton key={i} />)}
    </div>
  )
}
```

In `FeedPage`'s return, wrap the tab content sections in Suspense:

```tsx
      {/* My Feed tab */}
      {tab === 'feed' && (
        <Suspense fallback={<PostListSkeleton />}>
          <div className="space-y-3">
            {/* existing feed content */}
          </div>
        </Suspense>
      )}

      {tab === 'all' && (
        <Suspense fallback={<PostListSkeleton />}>
          <div className="space-y-3">
            {/* existing all content */}
          </div>
        </Suspense>
      )}

      {tab === 'communities' && (
        <Suspense fallback={<CommunityListSkeleton />}>
          {/* existing communities content */}
        </Suspense>
      )}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/feed/page.tsx
git commit -m "feat: Suspense skeletons on feed page tabs"
```

---

### Task 9: Suspense boundaries — community + post + profile pages

**Files:**
- Modify: `src/app/(main)/c/[slug]/page.tsx`
- Modify: `src/app/(main)/c/[slug]/[postId]/page.tsx`
- Modify: `src/app/(main)/u/[username]/page.tsx`

- [ ] **Step 1: Add Suspense to community page post list**

In `src/app/(main)/c/[slug]/page.tsx`, add imports at the top:

```tsx
import { Suspense } from 'react'
import { PostCardSkeleton } from '@/components/ui/skeleton'
```

Add a skeleton helper above the component:

```tsx
function PostListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => <PostCardSkeleton key={i} />)}
    </div>
  )
}
```

Wrap the posts list in the return:

```tsx
          <Suspense fallback={<PostListSkeleton />}>
            <div className="space-y-3">
              {posts.map(p => (
                <PostCard ... />
              ))}
              {/* load more */}
            </div>
          </Suspense>
```

- [ ] **Step 2: Add Suspense to post detail comment section**

In `src/app/(main)/c/[slug]/[postId]/page.tsx`, add:

```tsx
import { Suspense } from 'react'
import { CommentSkeleton } from '@/components/ui/skeleton'
```

Add helper:

```tsx
function CommentsSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      {Array.from({ length: 3 }).map((_, i) => <CommentSkeleton key={i} />)}
    </div>
  )
}
```

Wrap the `<CommentThread>` render in Suspense:

```tsx
        <Suspense fallback={<CommentsSkeleton />}>
          <CommentThread ... />
        </Suspense>
```

- [ ] **Step 3: Add Suspense to profile page post list**

In `src/app/(main)/u/[username]/page.tsx`, add:

```tsx
import { Suspense } from 'react'
import { PostCardSkeleton } from '@/components/ui/skeleton'
```

Add helper:

```tsx
function PostListSkeleton() {
  return (
    <div className="space-y-3 mt-6">
      {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
    </div>
  )
}
```

Wrap the posts list in Suspense.

- [ ] **Step 4: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src/app/(main)/c/[slug]/page.tsx src/app/(main)/c/[slug]/[postId]/page.tsx src/app/(main)/u/[username]/page.tsx
git commit -m "feat: Suspense skeletons on community, post detail, profile pages"
```

---

## Layer 3 — Mobile UX

### Task 10: Touch targets on action bar + buttons

**Files:**
- Modify: `src/components/post-action-bar.tsx`
- Modify: `src/components/like-button.tsx`
- Modify: `src/components/bookmark-button.tsx`

- [ ] **Step 1: Increase action bar button tap areas**

In `src/components/post-action-bar.tsx`, update the comment button and share button to have min tap area:

```tsx
        {/* Comment */}
        <button
          onClick={() => setShowCommentForm(v => !v)}
          className="flex items-center gap-1.5 text-sm transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)] min-h-[44px] min-w-[44px] justify-center md:min-h-0 md:min-w-0 md:justify-start"
          style={showCommentForm ? { color: accent } : undefined}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{commentCount}</span>
        </button>
```

Update the share button similarly:

```tsx
          <button
            onClick={() => setShareOpen(v => !v)}
            className={`flex items-center gap-1.5 text-sm transition-all min-h-[44px] min-w-[44px] justify-center md:min-h-0 md:min-w-0 ${
              copied ? 'text-green-400' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            style={shareOpen && !copied ? { color: accent } : undefined}
            title="Share"
          >
```

- [ ] **Step 2: Increase LikeButton tap area**

In `src/components/like-button.tsx`, update the button className:

```tsx
      <button
        onClick={handleClick}
        disabled={!userId || isPending}
        className={`flex items-center gap-1.5 text-sm transition-all disabled:opacity-50 min-h-[44px] min-w-[44px] justify-center md:min-h-0 md:min-w-0 md:justify-start ${
          liked ? 'scale-105' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
        style={liked ? { color: accentColor } : undefined}
      >
```

- [ ] **Step 3: Increase BookmarkButton tap area**

In `src/components/bookmark-button.tsx`, update:

```tsx
    <button
      onClick={handleClick}
      title={optimisticSaved ? 'Remove bookmark' : 'Save post'}
      className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] md:h-7 md:w-7"
      style={optimisticSaved ? { color: accentColor } : undefined}
    >
```

- [ ] **Step 4: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src/components/post-action-bar.tsx src/components/like-button.tsx src/components/bookmark-button.tsx
git commit -m "fix: 44px minimum touch targets on action bar buttons"
```

---

### Task 11: Post card responsive padding

**Files:**
- Modify: `src/components/post-card.tsx`

- [ ] **Step 1: Make padding responsive**

In `src/components/post-card.tsx`, update padding classes:

- Line 59 `<Link href=...` — change `px-5 pt-4 pb-2` → `px-3 pt-3 pb-2 md:px-5 md:pt-4`
- Line 117 byline div — change `px-5 pb-2` → `px-3 pb-2 md:px-5`
- Line 143 action bar div — change `px-5 pb-4` → `px-3 pb-3 md:px-5 md:pb-4`

Image thumbnail — change `h-16 w-16` → `h-14 w-14 md:h-16 md:w-16`

- [ ] **Step 2: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/components/post-card.tsx
git commit -m "fix: responsive post card padding for mobile screens"
```

---

### Task 12: Bottom tab bar improvements

**Files:**
- Modify: `src/components/bottom-tab-bar.tsx`

- [ ] **Step 1: Increase touch height, add active dot, style Create pill**

Replace the entire `src/components/bottom-tab-bar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react'
import type { Profile } from '@/types/database'

interface BottomTabBarProps {
  profile: Profile
  unreadCount: number
}

export function BottomTabBar({ profile, unreadCount }: BottomTabBarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const tabClass = (href: string) =>
    `relative flex flex-col items-center justify-center gap-1 flex-1 py-3 text-xs font-medium transition-colors ${
      isActive(href)
        ? 'text-[var(--accent)]'
        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
    }`

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
      <div className="flex w-full items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Link href="/feed" className={tabClass('/feed')}>
          {isActive('/feed') && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[var(--accent)]" />}
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link href="/search" className={tabClass('/search')}>
          {isActive('/search') && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[var(--accent)]" />}
          <Search className="h-5 w-5" />
          <span>Search</span>
        </Link>

        <Link
          href="/c/new"
          className="flex flex-col items-center justify-center gap-1 flex-1 py-3 text-xs font-medium"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--accent)] text-white">
            <PlusCircle className="h-5 w-5" />
          </span>
          <span className="text-[var(--accent)]">Create</span>
        </Link>

        <Link href="/notifications" className={tabClass('/notifications')}>
          {isActive('/notifications') && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[var(--accent)]" />}
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--accent)]" />
            )}
          </div>
          <span>Alerts</span>
        </Link>

        <Link href={`/u/${profile.username}`} className={tabClass(`/u/${profile.username}`)}>
          {isActive(`/u/${profile.username}`) && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[var(--accent)]" />}
          <User className="h-5 w-5" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/components/bottom-tab-bar.tsx
git commit -m "feat: bottom tab bar — py-3 touch height, accent line indicator, Create pill"
```

---

### Task 13: Mobile header avatar + scroll behaviour

**Files:**
- Modify: `src/components/mobile-header.tsx`
- Modify: `src/app/(main)/layout.tsx`

- [ ] **Step 1: Update MobileHeader to accept profile prop**

Replace `src/components/mobile-header.tsx`:

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import type { Profile } from '@/types/database'

interface Props {
  profile: Profile
}

export function MobileHeader({ profile }: Props) {
  return (
    <header className="flex md:hidden sticky top-0 z-40 h-14 items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
      <Link
        href="/feed"
        className="text-lg font-bold tracking-tight text-[var(--accent)] hover:opacity-80 transition-opacity"
      >
        CTB
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/search"
          className="flex items-center justify-center h-9 w-9 rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)] transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Link>
        <Link href={`/u/${profile.username}`} aria-label="Profile">
          <div className="relative h-7 w-7 overflow-hidden rounded-full bg-[var(--surface-raised)]">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--muted-foreground)]">
                {profile.username[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </Link>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Pass profile to MobileHeader and add overscroll**

In `src/app/(main)/layout.tsx`, update the `<MobileHeader />` call:

```tsx
        <MobileHeader profile={profile} />
```

Update the `<main>` element to add overscroll containment:

```tsx
          <main className="flex-1 min-w-0 py-6 px-4 pb-24 md:pb-6" style={{ overscrollBehaviorY: 'contain' }}>
```

- [ ] **Step 3: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/mobile-header.tsx src/app/(main)/layout.tsx
git commit -m "feat: mobile header avatar shortcut, overscroll-contain on main"
```

---

### Task 13b: Form keyboard behaviour

**Files:**
- Modify: `src/components/comment-form.tsx`
- Modify: `src/components/inline-comment-form.tsx`

- [ ] **Step 1: Read comment-form.tsx to find the form wrapper**

Read `src/components/comment-form.tsx` and locate the outer form `<div>` or `<form>` wrapper.

- [ ] **Step 2: Add safe-area padding and inputMode hints**

In `src/components/comment-form.tsx`, on the outermost wrapper div, add:
```tsx
style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
```

On the `<textarea>` or text input, add:
```tsx
inputMode="text"
autoComplete="off"
```

- [ ] **Step 3: Same fix for inline-comment-form.tsx**

In `src/components/inline-comment-form.tsx`, apply the same `paddingBottom` and `inputMode` changes.

- [ ] **Step 4: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src/components/comment-form.tsx src/components/inline-comment-form.tsx
git commit -m "fix: safe-area bottom padding and inputMode on mobile comment forms"
```

---

## Layer 4 — Framer Motion

### Task 14: Install Framer Motion and create motion re-export

**Files:**
- Create: `src/components/motion.tsx`

- [ ] **Step 1: Install framer-motion**

```bash
npm install framer-motion
```
Expected: package added to `package.json`, no peer dependency warnings.

- [ ] **Step 2: Create the client re-export**

Create `src/components/motion.tsx`:

```tsx
'use client'
export { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
```

- [ ] **Step 3: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/motion.tsx package.json package-lock.json
git commit -m "feat: install framer-motion, add motion.tsx client re-export"
```

---

### Task 15: Button micro-interactions

**Files:**
- Modify: `src/components/like-button.tsx`
- Modify: `src/components/bookmark-button.tsx`
- Modify: `src/components/follow-button.tsx`

- [ ] **Step 1: Add tap animation to LikeButton**

Replace `src/components/like-button.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/lib/actions/like'
import { Heart } from 'lucide-react'
import { motion, useReducedMotion } from '@/components/motion'

interface Props {
  targetId: string
  targetType: 'post' | 'comment'
  initialCount: number
  initialLiked: boolean
  userId: string | null
  accentColor?: string
}

export function LikeButton({
  targetId,
  targetType,
  initialCount,
  initialLiked,
  userId,
  accentColor = 'var(--accent)',
}: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const reduced = useReducedMotion()

  function handleClick() {
    if (!userId) return
    const wasLiked = liked
    setLiked(!wasLiked)
    setCount(c => (wasLiked ? c - 1 : c + 1))
    setError(null)
    startTransition(async () => {
      const result = await toggleLike(targetId, targetType)
      if (result.error) {
        setLiked(wasLiked)
        setCount(c => (wasLiked ? c + 1 : c - 1))
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <motion.button
        onClick={handleClick}
        disabled={!userId || isPending}
        whileTap={reduced ? {} : { scale: 0.85 }}
        animate={liked && !reduced ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.25, type: 'spring', stiffness: 400, damping: 15 }}
        className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] justify-center md:min-h-0 md:min-w-0 md:justify-start ${
          liked ? '' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
        style={liked ? { color: accentColor } : undefined}
      >
        <Heart
          className="h-3.5 w-3.5 transition-all"
          style={liked ? { fill: accentColor, color: accentColor } : undefined}
        />
        <span>{count}</span>
      </motion.button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
```

- [ ] **Step 2: Add tap animation to BookmarkButton**

Replace `src/components/bookmark-button.tsx`:

```tsx
'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleSaved } from '@/lib/actions/saved'
import { Bookmark } from 'lucide-react'
import { motion, useReducedMotion } from '@/components/motion'

interface Props {
  postId: string
  isSaved: boolean
  accentColor?: string
}

export function BookmarkButton({ postId, isSaved, accentColor = 'var(--accent)' }: Props) {
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(isSaved)
  const [, startTransition] = useTransition()
  const reduced = useReducedMotion()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      setOptimisticSaved(!optimisticSaved)
      const fd = new FormData()
      fd.set('post_id', postId)
      await toggleSaved(fd)
    })
  }

  return (
    <motion.button
      onClick={handleClick}
      title={optimisticSaved ? 'Remove bookmark' : 'Save post'}
      whileTap={reduced ? {} : { scale: 0.85 }}
      className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] md:h-7 md:w-7"
      style={optimisticSaved ? { color: accentColor } : undefined}
    >
      <Bookmark
        className="h-4 w-4 transition-all"
        style={optimisticSaved ? { fill: accentColor, color: accentColor } : undefined}
      />
    </motion.button>
  )
}
```

- [ ] **Step 3: Add tap animation to FollowButton**

Replace `src/components/follow-button.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { toggleFollow } from '@/lib/actions/follow'
import { motion, useReducedMotion } from '@/components/motion'

interface Props {
  targetUserId: string
  initialFollowed: boolean
  currentUserId: string | null
}

export function FollowButton({ targetUserId, initialFollowed, currentUserId }: Props) {
  const [followed, setFollowed] = useState(initialFollowed)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const reduced = useReducedMotion()

  function handleClick() {
    if (!currentUserId) return
    const wasFollowed = followed
    setFollowed(!wasFollowed)
    setError(null)
    startTransition(async () => {
      const result = await toggleFollow(targetUserId)
      if (result.error) {
        setFollowed(wasFollowed)
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        onClick={handleClick}
        disabled={!currentUserId || isPending}
        whileTap={reduced ? {} : { scale: 0.95 }}
        className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          followed
            ? 'border border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-500 hover:text-red-400'
            : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
        }`}
      >
        {followed ? 'Following' : 'Follow'}
      </motion.button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
```

- [ ] **Step 4: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src/components/like-button.tsx src/components/bookmark-button.tsx src/components/follow-button.tsx
git commit -m "feat: framer-motion tap micro-interactions on like, bookmark, follow"
```

---

### Task 16: Page transitions + staggered feed list

**Files:**
- Modify: `src/app/(main)/layout.tsx`
- Modify: `src/app/(main)/feed/page.tsx`
- Modify: `src/app/(main)/c/[slug]/page.tsx`

- [ ] **Step 1: Create PageTransition wrapper component**

Create `src/components/page-transition.tsx`:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from '@/components/motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Wrap main content in layout with PageTransition**

In `src/app/(main)/layout.tsx`, add the import:

```tsx
import { PageTransition } from '@/components/page-transition'
```

Wrap `{children}` inside `<main>`:

```tsx
          <main className="flex-1 min-w-0 py-6 px-4 pb-24 md:pb-6" style={{ overscrollBehaviorY: 'contain' }}>
            <div className="mx-auto w-full max-w-2xl">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </main>
```

- [ ] **Step 3: Create StaggeredList component**

Create `src/components/staggered-list.tsx`:

```tsx
'use client'

import { motion, useReducedMotion } from '@/components/motion'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
}

const itemVariantsReduced = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
}

interface Props {
  children: React.ReactNode[]
  className?: string
}

export function StaggeredList({ children, className }: Props) {
  const reduced = useReducedMotion()
  const variants = reduced ? itemVariantsReduced : itemVariants

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={i < 5 ? variants : undefined}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

- [ ] **Step 4: Use StaggeredList in feed post lists**

In `src/app/(main)/feed/page.tsx`, import and replace the `<div className="space-y-3">` post list wrappers with `<StaggeredList className="space-y-3">`:

```tsx
import { StaggeredList } from '@/components/staggered-list'

// In the feed tab render:
<StaggeredList className="space-y-3">
  {posts.map(p => (
    <PostCard key={p.id} ... />
  ))}
</StaggeredList>
```

Do the same for the "all" tab.

- [ ] **Step 5: Use StaggeredList in community page post list**

In `src/app/(main)/c/[slug]/page.tsx`, import and apply `StaggeredList` to the posts render block:

```tsx
import { StaggeredList } from '@/components/staggered-list'

// In posts render:
<StaggeredList className="space-y-3">
  {posts.map(p => (
    <PostCard key={p.id} ... />
  ))}
</StaggeredList>
```

- [ ] **Step 6: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 7: Commit**

```bash
git add src/components/page-transition.tsx src/components/staggered-list.tsx src/app/(main)/layout.tsx src/app/(main)/feed/page.tsx src/app/(main)/c/[slug]/page.tsx
git commit -m "feat: page transitions and staggered post list entrance animations"
```

---

### Task 16b: Skeleton → content fade

**Files:**
- Modify: `src/components/page-transition.tsx`

The `PageTransition` wrapper already fades content in on mount (`opacity: 0 → 1`). Since all async content is wrapped by `PageTransition` via the layout, this is already covered.

For the Suspense fallback → real content swap specifically, add a `FadeIn` wrapper used on the async content components:

- [ ] **Step 1: Add FadeIn component**

Add to `src/components/page-transition.tsx` (append after the existing export):

```tsx
export function FadeIn({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Wrap Suspense content in FadeIn in feed page**

In `src/app/(main)/feed/page.tsx`, import `FadeIn` and wrap the post list content:

```tsx
import { FadeIn } from '@/components/page-transition'

// Inside Suspense, wrap the content:
<Suspense fallback={<PostListSkeleton />}>
  <FadeIn>
    <div className="space-y-3">...</div>
  </FadeIn>
</Suspense>
```

Apply the same pattern in the community page and profile page post lists.

- [ ] **Step 3: Build check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/page-transition.tsx src/app/(main)/feed/page.tsx src/app/(main)/c/[slug]/page.tsx src/app/(main)/u/[username]/page.tsx
git commit -m "feat: fade-in transition when Suspense content resolves"
```

---

### Task 17: Final build verification

- [ ] **Step 1: Clean build**

```bash
npm run build
```
Expected: `✓ Compiled successfully` with zero TypeScript errors and zero warnings about missing keys or invalid props.

- [ ] **Step 2: Verify key pages render**

Start dev server:
```bash
npm run dev
```

Check:
- [ ] `/feed` — posts load with shimmer skeletons, then stagger in
- [ ] `/feed?tab=communities` — sort pills present, switching sort reorders list
- [ ] `/c/[slug]` — banner fills proportionally at all viewport widths, no overlap
- [ ] `/c/[slug]?tab=about` — members section shows admin/mod/member groups
- [ ] `/login` — card uses CSS vars, looks correct in light mode (toggle with theme button)
- [ ] Post cards show body text preview beneath title
- [ ] Like/bookmark/follow buttons have spring tap feel on mobile
- [ ] Bottom tab bar has top accent line on active tab, Create has filled circle

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```
