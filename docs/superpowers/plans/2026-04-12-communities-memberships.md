# Phase 2: Communities + Memberships Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full communities system — create, join, leave, and manage communities with role-based access control, community pages, and admin settings.

**Architecture:** Two new DB tables (`communities`, `memberships`) with RLS and a SECURITY DEFINER trigger that auto-grants admin membership on community creation. All mutations via Server Actions. Community pages under `/c/[slug]`. Admin-only settings enforced at both RLS and server-action level.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL + RLS), TypeScript, Tailwind CSS, Cloudinary (banner images via existing `uploadToCloudinary`)

---

## File Map

```
src/
  app/(main)/
    page.tsx                              MODIFY — My Communities + Discover sections
    c/
      new/
        page.tsx                          CREATE — Create community form (Client Component)
      [slug]/
        page.tsx                          CREATE — Community feed page
        settings/
          page.tsx                        CREATE — Community settings (admin only, Server Component)
          community-settings-form.tsx     CREATE — Settings form (Client Component, needs AvatarUpload)
          actions.ts                      CREATE — updateCommunity, deleteCommunity server actions
  components/
    community-card.tsx                    CREATE — Reusable community row card with JoinButton
    join-button.tsx                       CREATE — Join/Leave form buttons (Server Component)
    navbar.tsx                            MODIFY — Add "Create" link
  lib/
    utils.ts                              MODIFY — Add slugify() helper
    actions/
      community.ts                        CREATE — createCommunity server action
      membership.ts                       CREATE — joinCommunity, leaveCommunity server actions
  types/
    database.ts                           MODIFY — Add Community, Membership convenience types
supabase/
  migrations/
    002_communities_memberships.sql       CREATE — tables, enum, trigger, RLS
```

---

## Task 1: DB Migration + Regenerate Types

**Files:**
- Create: `supabase/migrations/002_communities_memberships.sql`
- Modify: `src/types/database.ts` (regenerate + append convenience types)

- [ ] **Step 1: Create `supabase/migrations/002_communities_memberships.sql`**

```sql
-- ============================================================
-- membership_role enum
-- ============================================================
CREATE TYPE membership_role AS ENUM ('admin', 'moderator', 'member');

-- ============================================================
-- communities
-- ============================================================
CREATE TABLE communities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  banner_url  TEXT,
  created_by  UUID NOT NULL REFERENCES profiles(id),
  is_removed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- memberships
-- ============================================================
CREATE TABLE memberships (
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  role         membership_role NOT NULL DEFAULT 'member',
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, community_id)
);

-- ============================================================
-- Trigger: auto-grant admin membership on community creation
-- Runs as SECURITY DEFINER to bypass memberships RLS
-- ============================================================
CREATE OR REPLACE FUNCTION handle_community_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO memberships (user_id, community_id, role)
  VALUES (NEW.created_by, NEW.id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_community_created
  AFTER INSERT ON communities
  FOR EACH ROW EXECUTE FUNCTION handle_community_created();

-- ============================================================
-- RLS: communities
-- ============================================================
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-removed communities
CREATE POLICY "communities_select_public"
  ON communities FOR SELECT
  USING (is_removed = FALSE);

-- Authenticated users can create communities
CREATE POLICY "communities_insert_auth"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Community admin or platform admin can update
CREATE POLICY "communities_update_admin"
  ON communities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.community_id = id
        AND memberships.user_id = auth.uid()
        AND memberships.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = TRUE
    )
  );

-- ============================================================
-- RLS: memberships
-- ============================================================
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Anyone can read memberships
CREATE POLICY "memberships_select_all"
  ON memberships FOR SELECT
  USING (TRUE);

-- Users can join as member only (trigger handles admin insert via SECURITY DEFINER)
CREATE POLICY "memberships_insert_own"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'member');

-- Users can leave their own non-admin membership
CREATE POLICY "memberships_delete_own"
  ON memberships FOR DELETE
  USING (auth.uid() = user_id AND role != 'admin');

-- Community admin or platform admin can kick other members (not themselves)
CREATE POLICY "memberships_delete_admin"
  ON memberships FOR DELETE
  USING (
    user_id != auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM memberships m2
        WHERE m2.community_id = memberships.community_id
          AND m2.user_id = auth.uid()
          AND m2.role = 'admin'
      )
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_platform_admin = TRUE
      )
    )
  );

-- Community admin or platform admin can promote/demote roles
CREATE POLICY "memberships_update_admin"
  ON memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.community_id = memberships.community_id
        AND m2.user_id = auth.uid()
        AND m2.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = TRUE
    )
  );
```

- [ ] **Step 2: Push migration to Supabase**

```bash
cd /d/CBT && supabase db push --yes 2>&1
```

Expected: `Applying migration 002_communities_memberships.sql... Finished supabase db push.`

- [ ] **Step 3: Regenerate TypeScript types**

```bash
cd /d/CBT && supabase gen types typescript --linked 2>/dev/null > src/types/database.ts
```

- [ ] **Step 4: Append convenience types to `src/types/database.ts`**

Open `src/types/database.ts` and append at the very end (after the last line):

```typescript

// Convenience types used throughout the app
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Community = Database['public']['Tables']['communities']['Row']
export type Membership = Database['public']['Tables']['memberships']['Row']
export type MembershipRole = Database['public']['Enums']['membership_role']
```

- [ ] **Step 5: TypeScript check**

```bash
cd /d/CBT && npx tsc --noEmit 2>&1
```

Expected: no errors. If `Profile` is now missing from somewhere, check that `export type Profile = ...` is in database.ts.

- [ ] **Step 6: Commit**

```bash
cd /d/CBT && git add supabase/migrations/002_communities_memberships.sql src/types/database.ts && git commit -m "feat: add communities + memberships schema with RLS and trigger"
```

---

## Task 2: slugify Utility + CommunityCard Component

**Files:**
- Modify: `src/lib/utils.ts`
- Create: `src/components/community-card.tsx`

- [ ] **Step 1: Add `slugify` to `src/lib/utils.ts`**

Append to the existing file (keep the `cn` export):

```typescript
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}
```

- [ ] **Step 2: Create `src/components/community-card.tsx`**

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { JoinButton } from '@/components/join-button'
import type { Community, Membership } from '@/types/database'

interface Props {
  community: Community
  membership: Pick<Membership, 'role'> | null
  isLoggedIn: boolean
}

export function CommunityCard({ community, membership, isLoggedIn }: Props) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="flex items-center gap-3">
        {community.banner_url ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-700">
            <Image src={community.banner_url} alt={community.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-white">
            {community.name[0].toUpperCase()}
          </div>
        )}
        <div>
          <Link href={`/c/${community.slug}`} className="text-sm font-medium text-white hover:underline">
            c/{community.slug}
          </Link>
          <p className="text-xs text-zinc-500">{community.name}</p>
        </div>
      </div>
      <JoinButton
        communityId={community.id}
        communitySlug={community.slug}
        membership={membership}
        isLoggedIn={isLoggedIn}
      />
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /d/CBT && npx tsc --noEmit 2>&1
```

Note: `JoinButton` doesn't exist yet — tsc will error on that import. That's expected; it gets created in Task 4. Fix the import temporarily if tsc errors block you, or skip this check and do it after Task 4.

- [ ] **Step 4: Commit**

```bash
cd /d/CBT && git add src/lib/utils.ts src/components/community-card.tsx && git commit -m "feat: add slugify util and CommunityCard component"
```

---

## Task 3: createCommunity Action + /c/new Page

**Files:**
- Create: `src/lib/actions/community.ts`
- Create: `src/app/(main)/c/new/page.tsx`

- [ ] **Step 1: Create `src/lib/actions/community.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { slugify } from '@/lib/utils'

export async function createCommunity(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string).trim()
  const banner_url = formData.get('banner_url') as string | null

  if (name.length < 3) {
    redirect('/c/new?error=' + encodeURIComponent('Community name must be at least 3 characters'))
  }
  if (name.length > 100) {
    redirect('/c/new?error=' + encodeURIComponent('Community name must be under 100 characters'))
  }
  if (banner_url && !banner_url.startsWith('https://res.cloudinary.com/')) {
    redirect('/c/new?error=' + encodeURIComponent('Invalid banner URL'))
  }

  let slug = slugify(name)
  if (!slug) {
    redirect('/c/new?error=' + encodeURIComponent('Community name contains no valid characters'))
  }

  // Ensure slug uniqueness
  const { data: existing } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
  }

  const { data: community, error } = await supabase
    .from('communities')
    .insert({
      name,
      slug,
      description: description || null,
      banner_url: banner_url || null,
      created_by: user.id,
    })
    .select('slug')
    .single()

  if (error || !community) {
    redirect('/c/new?error=' + encodeURIComponent(error?.message ?? 'Failed to create community'))
  }

  revalidatePath('/')
  redirect(`/c/${community.slug}`)
}
```

- [ ] **Step 2: Create `src/app/(main)/c/new/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createCommunity } from '@/lib/actions/community'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AvatarUpload } from '@/components/avatar-upload'
import { slugify } from '@/lib/utils'

export default function NewCommunityPage() {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const slugPreview = slugify(name)

  return (
    <div className="max-w-md">
      <h2 className="mb-6 text-xl font-semibold text-white">Create Community</h2>

      {error && (
        <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(error)}
        </p>
      )}

      <form action={createCommunity} className="flex flex-col gap-4">
        <input type="hidden" name="banner_url" value={bannerUrl ?? ''} />

        <div className="flex flex-col items-center gap-2 mb-2">
          <AvatarUpload currentUrl={bannerUrl} onUpload={setBannerUrl} />
          <p className="text-xs text-zinc-500">Banner image (optional)</p>
        </div>

        <div className="flex flex-col gap-1">
          <Input
            name="name"
            label="Community Name"
            required
            placeholder="Crypto Traders"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {name && (
            <p className="text-xs text-zinc-500">
              URL: <span className="text-zinc-300">c/{slugPreview || '…'}</span>
            </p>
          )}
        </div>

        <textarea
          name="description"
          placeholder="What is this community about?"
          rows={3}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <Button type="submit" className="w-full">Create Community</Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /d/CBT && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /d/CBT && git add src/lib/actions/community.ts "src/app/(main)/c/new/page.tsx" && git commit -m "feat: add createCommunity action and /c/new page"
```

---

## Task 4: JoinButton Component + Join/Leave Actions

**Files:**
- Create: `src/lib/actions/membership.ts`
- Create: `src/components/join-button.tsx`

- [ ] **Step 1: Create `src/lib/actions/membership.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function joinCommunity(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const communityId   = formData.get('communityId') as string
  const communitySlug = formData.get('communitySlug') as string

  await supabase.from('memberships').insert({
    user_id: user.id,
    community_id: communityId,
    role: 'member',
  })
  // Silently ignore error (already a member, or banned — Phase 5 adds ban enforcement)

  revalidatePath(`/c/${communitySlug}`)
  revalidatePath('/')
  redirect(`/c/${communitySlug}`)
}

export async function leaveCommunity(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const communityId   = formData.get('communityId') as string
  const communitySlug = formData.get('communitySlug') as string

  // Verify not admin (RLS also enforces, but check here for a clear error)
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('community_id', communityId)
    .single()

  if (membership?.role === 'admin') {
    redirect(`/c/${communitySlug}?error=admins-cannot-leave`)
  }

  await supabase
    .from('memberships')
    .delete()
    .eq('user_id', user.id)
    .eq('community_id', communityId)

  revalidatePath(`/c/${communitySlug}`)
  revalidatePath('/')
  redirect(`/c/${communitySlug}`)
}
```

- [ ] **Step 2: Create `src/components/join-button.tsx`**

This is a Server Component — no `'use client'` needed since it just renders forms.

```typescript
import { joinCommunity, leaveCommunity } from '@/lib/actions/membership'
import { Button } from '@/components/ui/button'
import type { Membership } from '@/types/database'

interface Props {
  communityId: string
  communitySlug: string
  membership: Pick<Membership, 'role'> | null
  isLoggedIn: boolean
}

export function JoinButton({ communityId, communitySlug, membership, isLoggedIn }: Props) {
  if (!isLoggedIn) {
    return (
      <a href="/login">
        <Button variant="primary" className="text-xs px-3 py-1.5">Join</Button>
      </a>
    )
  }

  if (!membership) {
    return (
      <form action={joinCommunity}>
        <input type="hidden" name="communityId" value={communityId} />
        <input type="hidden" name="communitySlug" value={communitySlug} />
        <Button type="submit" variant="primary" className="text-xs px-3 py-1.5">Join</Button>
      </form>
    )
  }

  if (membership.role === 'admin') {
    return (
      <span className="rounded-md bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-400">
        Admin
      </span>
    )
  }

  if (membership.role === 'moderator') {
    return (
      <span className="rounded-md bg-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300">
        Mod
      </span>
    )
  }

  return (
    <form action={leaveCommunity}>
      <input type="hidden" name="communityId" value={communityId} />
      <input type="hidden" name="communitySlug" value={communitySlug} />
      <Button type="submit" variant="ghost" className="text-xs px-3 py-1.5">Leave</Button>
    </form>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /d/CBT && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /d/CBT && git add src/lib/actions/membership.ts src/components/join-button.tsx && git commit -m "feat: add join/leave server actions and JoinButton component"
```

---

## Task 5: Community Page `/c/[slug]`

**Files:**
- Create: `src/app/(main)/c/[slug]/page.tsx`

- [ ] **Step 1: Create `src/app/(main)/c/[slug]/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { JoinButton } from '@/components/join-button'

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

  // Current user's membership
  let membership: { role: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('memberships')
      .select('role')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .single()
    membership = data
  }

  const isAdmin = membership?.role === 'admin'

  return (
    <div>
      {/* Banner */}
      {community.banner_url && (
        <div className="relative h-32 w-full overflow-hidden rounded-xl bg-zinc-800 mb-4">
          <Image src={community.banner_url} alt={community.name} fill className="object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{community.name}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            c/{community.slug} · {memberCount ?? 0} {memberCount === 1 ? 'member' : 'members'}
          </p>
          {community.description && (
            <p className="mt-3 text-sm text-zinc-300 max-w-lg">{community.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Link
              href={`/c/${community.slug}/settings`}
              className="text-xs text-zinc-400 hover:text-white"
            >
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

      {/* Posts placeholder */}
      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
        <p className="text-zinc-500 text-sm">Posts coming in Phase 3.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /d/CBT && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /d/CBT && git add "src/app/(main)/c/[slug]/page.tsx" && git commit -m "feat: add community page with member count and join/leave"
```

---

## Task 6: Community Settings Page + Actions

**Files:**
- Create: `src/app/(main)/c/[slug]/settings/actions.ts`
- Create: `src/app/(main)/c/[slug]/settings/community-settings-form.tsx`
- Create: `src/app/(main)/c/[slug]/settings/page.tsx`

- [ ] **Step 1: Create `src/app/(main)/c/[slug]/settings/actions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireAdmin(communityId: string, fallbackSlug: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') redirect(`/c/${fallbackSlug}`)

  return supabase
}

export async function updateCommunity(formData: FormData) {
  const communityId = formData.get('communityId') as string
  const slug        = formData.get('slug') as string
  const supabase    = await requireAdmin(communityId, slug)

  const name        = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string).trim()
  const banner_url  = formData.get('banner_url') as string | null

  if (name.length < 3) {
    redirect(`/c/${slug}/settings?error=` + encodeURIComponent('Name must be at least 3 characters'))
  }
  if (banner_url && !banner_url.startsWith('https://res.cloudinary.com/')) {
    redirect(`/c/${slug}/settings?error=` + encodeURIComponent('Invalid banner URL'))
  }

  const { error } = await supabase
    .from('communities')
    .update({
      name,
      description: description || null,
      ...(banner_url ? { banner_url } : {}),
    })
    .eq('id', communityId)

  if (error) {
    redirect(`/c/${slug}/settings?error=` + encodeURIComponent(error.message))
  }

  revalidatePath(`/c/${slug}`)
  revalidatePath(`/c/${slug}/settings`)
  redirect(`/c/${slug}/settings?success=1`)
}

export async function deleteCommunity(formData: FormData) {
  const communityId = formData.get('communityId') as string
  const slug        = formData.get('slug') as string
  const supabase    = await requireAdmin(communityId, slug)

  const { error } = await supabase
    .from('communities')
    .update({ is_removed: true })
    .eq('id', communityId)

  if (error) {
    redirect(`/c/${slug}/settings?error=` + encodeURIComponent(error.message))
  }

  revalidatePath('/')
  redirect('/')
}
```

- [ ] **Step 2: Create `src/app/(main)/c/[slug]/settings/community-settings-form.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { updateCommunity } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AvatarUpload } from '@/components/avatar-upload'
import type { Community } from '@/types/database'

interface Props {
  community: Community
}

export function CommunitySettingsForm({ community }: Props) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(community.banner_url)

  return (
    <form action={updateCommunity} className="flex flex-col gap-4">
      <input type="hidden" name="communityId" value={community.id} />
      <input type="hidden" name="slug"        value={community.slug} />
      <input type="hidden" name="banner_url"  value={bannerUrl ?? ''} />

      <div className="flex flex-col items-center gap-2 mb-2">
        <AvatarUpload currentUrl={bannerUrl} onUpload={setBannerUrl} />
        <p className="text-xs text-zinc-500">Community banner</p>
      </div>

      <Input
        name="name"
        label="Display Name"
        defaultValue={community.name}
        required
      />

      <textarea
        name="description"
        defaultValue={community.description ?? ''}
        placeholder="What is this community about?"
        rows={3}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <Button type="submit" className="w-full">Save changes</Button>
    </form>
  )
}
```

- [ ] **Step 3: Create `src/app/(main)/c/[slug]/settings/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { deleteCommunity } from './actions'
import { CommunitySettingsForm } from './community-settings-form'
import { Button } from '@/components/ui/button'

interface Props {
  params: { slug: string }
  searchParams: { error?: string; success?: string }
}

export default async function CommunitySettingsPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities')
    .select('*')
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

  if (membership?.role !== 'admin') redirect(`/c/${params.slug}`)

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/c/${params.slug}`} className="text-sm text-zinc-400 hover:text-white">
          ← c/{params.slug}
        </Link>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
      </div>

      {searchParams.error && (
        <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}
      {searchParams.success && (
        <p className="mb-4 rounded-md bg-green-900/30 px-4 py-2 text-sm text-green-400">
          Settings saved!
        </p>
      )}

      <CommunitySettingsForm community={community} />

      {/* Danger zone */}
      <div className="mt-10 rounded-xl border border-red-900/40 p-6">
        <h3 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Deleting the community hides it from all users. This cannot be undone.
        </p>
        <form action={deleteCommunity}>
          <input type="hidden" name="communityId" value={community.id} />
          <input type="hidden" name="slug"        value={community.slug} />
          <Button type="submit" variant="danger">Delete Community</Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd /d/CBT && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /d/CBT && git add "src/app/(main)/c/[slug]/settings/actions.ts" "src/app/(main)/c/[slug]/settings/community-settings-form.tsx" "src/app/(main)/c/[slug]/settings/page.tsx" && git commit -m "feat: add community settings page with update and delete actions"
```

---

## Task 7: Home Feed Update + Navbar Create Link

**Files:**
- Modify: `src/app/(main)/page.tsx`
- Modify: `src/components/navbar.tsx`

- [ ] **Step 1: Replace `src/app/(main)/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CommunityCard } from '@/components/community-card'
import type { Community, Membership } from '@/types/database'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // My communities: get memberships then fetch community rows
  let myCommunities: Community[] = []
  let membershipMap = new Map<string, Pick<Membership, 'role'>>()

  if (user) {
    const { data: memberships } = await supabase
      .from('memberships')
      .select('community_id, role')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    if (memberships && memberships.length > 0) {
      const ids = memberships.map(m => m.community_id)
      membershipMap = new Map(memberships.map(m => [m.community_id, { role: m.role }]))

      const { data: communities } = await supabase
        .from('communities')
        .select('*')
        .in('id', ids)
        .eq('is_removed', false)

      // Preserve join order
      const communityById = new Map((communities ?? []).map(c => [c.id, c]))
      myCommunities = ids.map(id => communityById.get(id)!).filter(Boolean)
    }
  }

  // Discover: all communities not already joined, newest first
  const myIds = new Set(myCommunities.map(c => c.id))
  const { data: allCommunities } = await supabase
    .from('communities')
    .select('*')
    .eq('is_removed', false)
    .order('created_at', { ascending: false })
    .limit(20)

  const discoverCommunities = (allCommunities ?? []).filter(c => !myIds.has(c.id))

  return (
    <div className="space-y-10">
      {/* My Communities */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">My Communities</h2>
          <Link href="/c/new" className="text-sm text-indigo-400 hover:underline">
            + Create
          </Link>
        </div>

        {myCommunities.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-zinc-400 mb-2">You haven't joined any communities yet.</p>
            <p className="text-sm text-zinc-500">Discover communities below to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myCommunities.map(c => (
              <CommunityCard
                key={c.id}
                community={c}
                membership={membershipMap.get(c.id) ?? null}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        )}
      </section>

      {/* Discover */}
      {discoverCommunities.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Discover</h2>
          <div className="space-y-2">
            {discoverCommunities.map(c => (
              <CommunityCard
                key={c.id}
                community={c}
                membership={null}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state when no communities exist at all */}
      {myCommunities.length === 0 && discoverCommunities.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-400 mb-4">No communities yet.</p>
          <Link href="/c/new" className="text-indigo-400 hover:underline text-sm">
            Be the first to create one →
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `src/components/navbar.tsx` — add Create link**

Read the current navbar.tsx and add a `+ Create` link after the Notifications link:

Current navbar links section:
```typescript
        <div className="flex items-center gap-4">
          <Link href="/notifications" className="text-sm text-zinc-400 hover:text-white">
            Notifications
          </Link>
```

Replace with:
```typescript
        <div className="flex items-center gap-4">
          <Link href="/notifications" className="text-sm text-zinc-400 hover:text-white">
            Notifications
          </Link>
          <Link href="/c/new" className="text-sm text-zinc-400 hover:text-white">
            + Create
          </Link>
```

- [ ] **Step 3: TypeScript check**

```bash
cd /d/CBT && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 4: Start dev server and manually verify**

```bash
cd /d/CBT && npm run dev
```

Check:
1. `http://localhost:3000` — home shows "My Communities" (empty) + "Be the first to create one" link
2. Click `+ Create` or the link → `/c/new` form renders
3. Fill in name + description → submit → redirected to `/c/[slug]` showing community info, member count = 1, "Admin" badge
4. As a different user: visit community page → shows "Join" button → click Join → shows "Leave" button, member count = 2
5. Admin user: "Settings" link visible → `/c/[slug]/settings` → edit name → save → success message
6. Admin user: cannot leave (gets error message)
7. Non-admin: no Settings link visible

- [ ] **Step 5: Commit**

```bash
cd /d/CBT && git add "src/app/(main)/page.tsx" src/components/navbar.tsx && git commit -m "feat: update home feed with My Communities + Discover, add Create link to navbar"
```

---

## Self-Review

### Spec Coverage

| Spec Requirement | Task |
|---|---|
| `communities` table (id, name, slug, description, banner_url, created_by, is_removed, created_at) | Task 1 |
| `memberships` table (user_id, community_id, role enum, joined_at, composite PK) | Task 1 |
| `membership_role` enum: admin / moderator / member | Task 1 |
| Creator auto-gets admin role | Task 1 (DB trigger) |
| Communities RLS: anyone reads non-removed, auth users insert, admin updates | Task 1 |
| Memberships RLS: anyone reads, users insert own as member, delete own non-admin, admin kicks | Task 1 |
| Community admin cannot leave | Tasks 4, 5 (action check + RLS) |
| Community page `/c/[slug]` with name, slug, member count, description, banner | Task 5 |
| Join button (unauthenticated → redirect login; member → show Leave) | Task 4 |
| Admin badge + Settings link on community page | Task 5 |
| Community creation form with name, description, banner | Task 3 |
| Slug auto-generated from name with uniqueness handling | Tasks 3, 2 (slugify) |
| Banner upload via Cloudinary on create + settings | Tasks 3, 6 |
| Community settings page (admin only: edit name/description/banner) | Task 6 |
| Delete community (soft delete, admin only) | Task 6 |
| Home feed: My Communities + Discover sections | Task 7 |
| Empty state with CTA when no memberships | Task 7 |
| Navbar: Create Community link | Task 7 |
| Moderator role badge | Task 4 (JoinButton shows "Mod" badge) |

All spec requirements for Phase 2 are covered.

### No Placeholders Found

All code is complete with actual implementations. No TBD/TODO items remain.
