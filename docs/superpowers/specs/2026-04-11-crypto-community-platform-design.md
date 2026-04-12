# Crypto Community Platform — Design Spec

**Date:** 2026-04-11  
**Status:** Approved  
**Stack:** Next.js 14 (App Router) + Supabase (PostgreSQL + Auth + RLS) + Cloudinary

---

## 1. Overview

A crypto-themed community platform (brand/audience only — no blockchain features). Users create and join communities, post content, interact via likes and comments, follow each other, and moderate their communities. A platform-level superadmin manages global reports, bans, and content.

**Core priorities:** Simplicity, clean UX, strong moderation, fast MVP execution.

---

## 2. Architecture

### Frontend
- **Next.js 14 App Router** on Netlify
- Server Components for data fetching; Client Components for interactive islands
- `@supabase/ssr` for server-side auth via cookies
- Next.js Server Actions for mutations
- Next.js Middleware for route protection

### Backend
- **Supabase** (PostgreSQL + Auth + RLS)
- All auth enforced at DB layer via RLS — not just frontend
- PostgreSQL trigger functions insert notifications (service role)
- No separate API layer — Server Actions call Supabase directly

### Storage
- **Cloudinary** for all media (avatars, post images, community banners)
- Upload happens client-side to Cloudinary; URL stored in DB

---

## 3. Database Schema

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | FK → auth.users, PK |
| `username` | text | unique, not null |
| `avatar_url` | text | Cloudinary URL |
| `bio` | text | |
| `is_platform_admin` | boolean | default false, set via dashboard only |
| `is_banned` | boolean | default false |
| `created_at` | timestamptz | default now() |

### `communities`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | not null (non-unique display name) |
| `slug` | text | unique, not null (URL identifier) |
| `description` | text | |
| `banner_url` | text | Cloudinary URL |
| `created_by` | uuid | FK → profiles |
| `is_removed` | boolean | default false (soft delete) |
| `created_at` | timestamptz | |

### `memberships`
| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | FK → profiles |
| `community_id` | uuid | FK → communities |
| `role` | enum | admin / moderator / member |
| `joined_at` | timestamptz | |
| PK | composite | (user_id, community_id) |

### `posts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `community_id` | uuid | FK → communities |
| `author_id` | uuid | FK → profiles |
| `type` | enum | text / image / link |
| `title` | text | not null |
| `body` | text | for text posts |
| `image_url` | text | Cloudinary URL, for image posts |
| `link_url` | text | for link posts |
| `link_preview` | jsonb | `{title, description, image}` fetched at creation |
| `is_pinned` | boolean | default false |
| `is_removed` | boolean | default false (soft delete) |
| `created_at` | timestamptz | |

### `comments`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `post_id` | uuid | FK → posts |
| `author_id` | uuid | FK → profiles |
| `parent_id` | uuid | nullable FK → comments (1-level replies only) |
| `body` | text | not null |
| `is_removed` | boolean | default false |
| `created_at` | timestamptz | |

### `likes`
| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | FK → profiles |
| `post_id` | uuid | nullable FK → posts |
| `comment_id` | uuid | nullable FK → comments |
| PK | composite | (user_id, post_id, comment_id) |
| CHECK | constraint | exactly one of post_id / comment_id is non-null |

### `follows`
| Column | Type | Notes |
|---|---|---|
| `follower_id` | uuid | FK → profiles |
| `following_id` | uuid | FK → profiles |
| PK | composite | (follower_id, following_id) |
| CHECK | constraint | follower_id ≠ following_id |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles (recipient) |
| `type` | enum | like / comment / follow |
| `actor_id` | uuid | FK → profiles (who triggered it) |
| `post_id` | uuid | nullable FK → posts |
| `comment_id` | uuid | nullable FK → comments |
| `is_read` | boolean | default false |
| `created_at` | timestamptz | |

### `reports`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `reporter_id` | uuid | FK → profiles |
| `type` | enum | post / comment / user / community |
| `target_id` | uuid | ID of the reported entity |
| `reason` | text | required |
| `status` | enum | pending / resolved / dismissed |
| `created_at` | timestamptz | |
| UNIQUE | constraint | (reporter_id, type, target_id) — one report per target |

### `bans`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `community_id` | uuid | nullable FK → communities (null = platform ban) |
| `banned_by` | uuid | FK → profiles |
| `reason` | text | |
| `created_at` | timestamptz | |

---

## 4. Role System

### Community-level roles (stored in `memberships.role`)
| Role | Permissions |
|---|---|
| `admin` | Full community control: settings, delete community, assign moderators, ban users |
| `moderator` | Remove posts/comments, ban members, pin posts |
| `member` | Post, comment, like |

### Platform-level
| Flag | Permissions |
|---|---|
| `profiles.is_platform_admin = true` | Full platform control: manage all reports, ban any user globally, remove any community |

Platform admin flag is set manually via Supabase dashboard — not settable via any API.

---

## 5. RLS Policy Summary

**`profiles`:** Anyone reads; owner updates own row; `is_platform_admin` not writable via client.

**`communities`:** Anyone reads non-removed; auth users insert; community admin or platform admin updates/deletes.

**`memberships`:** Anyone reads; users insert own (join), delete own (leave — except community admin); community/platform admin manages roles.

**`posts` / `comments`:** Anyone reads non-removed; authors update/soft-delete own; community mod/admin and platform admin can soft-delete.

**`likes` / `follows`:** Users manage own; anyone reads.

**`notifications`:** Users read/update own only; inserts via DB trigger (service role).

**`reports`:** Users insert; platform admin reads/updates all.

**`bans`:** Platform admin manages all; community mod/admin manages community-scoped; users read own bans.

---

## 6. App Structure

```
app/
├── (auth)/
│   ├── login/            # Email + Google OAuth
│   └── register/         # Email signup
├── (main)/
│   ├── layout.tsx         # Navbar + 30s notification poll
│   ├── page.tsx           # Home feed: "All" / "My Communities" tabs
│   ├── search/            # Search users + communities
│   ├── notifications/     # Notification list, mark all read
│   ├── settings/          # Profile edit, avatar upload
│   ├── u/[username]/      # Public profile page
│   ├── c/[slug]/
│   │   ├── page.tsx       # Community feed
│   │   ├── settings/      # Community settings (admin only)
│   │   └── [postId]/      # Post detail + comments
│   └── submit/            # Create post (community selector)
├── (admin)/
│   ├── layout.tsx         # Guard: is_platform_admin check
│   ├── reports/           # Review + resolve reports
│   ├── users/             # View, ban users
│   └── communities/       # View, remove communities
└── (legal)/
    ├── terms/
    └── privacy/
```

---

## 7. Key Data Flows

### Auth
1. Supabase Auth (email or Google OAuth)
2. `handle_new_user` trigger creates `profiles` row on signup
3. Username defaults to email prefix; user prompted to set unique username if conflict
4. Middleware protects routes; `@supabase/ssr` reads session from cookies

### Post creation
1. If image → upload to Cloudinary (client-side), get URL
2. If link → Server Action fetches Open Graph data, stores as JSONB
3. Insert post row; redirect to post page

### Like / Comment (optimistic UI)
1. Client fires Server Action
2. UI updates optimistically
3. DB insert triggers notification for content author
4. On error → UI rolls back

### Notification polling
1. `(main)/layout.tsx` (client component) calls `/api/notifications/unread-count` every 30s
2. Bell badge updates
3. Visiting `/notifications` marks all read via Server Action

### Community join/leave
1. Join → Server Action inserts membership; ban check via DB constraint
2. Leave → deletes membership; community admin cannot leave (UI blocks + DB constraint)

### Report flow
1. User submits report with reason → insert to `reports` (status: pending)
2. Platform admin reviews in admin panel → resolves or dismisses

---

## 8. Edge Cases

### Auth
- Google OAuth username conflict → prompted to choose unique username on first visit
- Banned user sessions → redirected to `/banned` page on middleware check

### Content
- Soft-deleted posts/comments show `[removed]` in UI
- Deleted author shown as `[deleted]`
- Community admin cannot leave; must delete community (ownership transfer out of MVP scope)

### Media
- Cloudinary upload failure → form errors, no orphaned post created
- 5MB file size limit (client + Cloudinary)
- Accepted formats: `image/jpeg`, `image/png`, `image/webp`

### Feed
- "My Communities" with zero memberships → empty state with discover CTA
- Pagination via `LIMIT/OFFSET` with "Load more" button (no infinite scroll in MVP)

### Moderation
- Platform-banned users: account locked, existing content visible
- Community-banned users: can view, cannot post/comment
- Moderators cannot ban the community admin

### Search
- `ILIKE %query%` on `username` and community `name`
- Empty query returns nothing

---

## 9. Out of Scope (MVP)

- DMs / messaging
- Token gating or wallet integration
- Community ownership transfer
- Full-text search / ranking
- Infinite scroll
- Email notifications
- Two-factor authentication
- Post scheduling
- Community categories/tags
