# CTB Dark Editorial — UI Redesign Spec
**Date:** 2026-04-14  
**Status:** Approved

---

## 1. Overview

A complete visual overhaul of the CTB platform UI, transforming the existing dark navy base into a jaw-dropping "Dark Editorial" design. Inspired by Warpcast, Lens Protocol, and Linear. Clean and minimal by default — with ambient depth as the WOW layer.

---

## 2. Design Principles

- **Signal over noise** — every element earns its place
- **Community-first** — each community has its own visual identity via color coding
- **Ambient depth** — one persistent glow orb on the page background creates luxury without clutter
- **No animation overload** — micro-interactions are limited to hover border lifts; no bouncing, spinning, or pulsing

---

## 3. Layout

### 3-Panel Structure (Desktop)

```
┌──────────┬──────────────────────────┬────────────┐
│  Left    │       Feed Column        │   Right    │
│ Sidebar  │       (max-w-xl)         │   Panel    │
│ 64/256px │                          │   280px    │
│  fixed   │                          │  xl+ only  │
└──────────┴──────────────────────────┴────────────┘
```

- **Left sidebar**: Fixed, `w-16` (collapsed, md+) / `w-64` (expanded, lg+). No change to existing breakpoint logic.
- **Feed column**: `max-w-xl` centered, `px-4 py-6`. Currently `max-w-2xl` — reduce to tighten editorial feel.
- **Right panel**: `w-72` sticky, visible at `xl+` only. Currently absent — new addition.

### Mobile

- Mobile header + bottom tab bar retained as-is.
- Right panel hidden on mobile and tablet.

---

## 4. Left Sidebar

### Changes from current

| Element | Current | New |
|---|---|---|
| Active state | `bg-surface-raised text-accent` | No background. Blue icon + 2px left accent bar |
| Logo | Plain text "CTB" | Same text, but add subtle blue glow `text-shadow` |
| Nav item shape | `rounded-xl` pill | `rounded-lg`, slimmer padding |
| Active indicator | None | `border-l-2 border-accent` on the nav item |

### Active item treatment
```
border-l-2 border-[var(--accent)] pl-[calc(0.75rem-2px)]
text-[var(--accent)]
```
No background fill — the border bar alone signals active state.

---

## 5. Feed Column

### Tab Bar

Replace the current pill-background tab with an **underline-only** indicator:

```
My Feed   All   Communities
─────────
  (blue 2px underline, no background)
```

- Container: `border-b border-[var(--border)]` — tabs sit on a hairline
- Active: `border-b-2 border-[var(--accent)] text-[var(--foreground)]`
- Inactive: `text-[var(--muted-foreground)] hover:text-[var(--foreground)]`
- Remove: pill background (`bg-slate-900`, `rounded-2xl` wrapper)

---

## 6. Post Cards — Color-Coded by Community

Each community gets a **deterministic accent color** derived from its slug hash. 8-color palette:

| Index | Color | Hex | Usage |
|---|---|---|---|
| 0 | Blue | `#3b82f6` | Default / bitcoin |
| 1 | Violet | `#7c3aed` | ethereum |
| 2 | Teal | `#0d9488` | defi |
| 3 | Green | `#059669` | altcoins |
| 4 | Orange | `#ea580c` | nfts |
| 5 | Rose | `#e11d48` | trading |
| 6 | Amber | `#d97706` | macro |
| 7 | Indigo | `#4f46e5` | layer2 |

### Color derivation (utility function)

```ts
const COMMUNITY_COLORS = [
  { accent: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)'  },
  { accent: '#7c3aed', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.2)' },
  { accent: '#0d9488', bg: 'rgba(13,148,136,0.1)', border: 'rgba(13,148,136,0.2)' },
  { accent: '#059669', bg: 'rgba(5,150,105,0.1)',  border: 'rgba(5,150,105,0.2)'  },
  { accent: '#ea580c', bg: 'rgba(234,88,12,0.1)',  border: 'rgba(234,88,12,0.2)'  },
  { accent: '#e11d48', bg: 'rgba(225,29,72,0.1)',  border: 'rgba(225,29,72,0.2)'  },
  { accent: '#d97706', bg: 'rgba(217,119,6,0.1)',  border: 'rgba(217,119,6,0.2)'  },
  { accent: '#4f46e5', bg: 'rgba(79,70,229,0.1)',  border: 'rgba(79,70,229,0.2)'  },
]

function getCommunityColor(slug: string) {
  const hash = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COMMUNITY_COLORS[hash % COMMUNITY_COLORS.length]
}
```

### Post card anatomy

```
┌─ 3px color strip (community accent gradient) ──────────────┐
│  [avatar 18px]  username · time            [c/community]   │
│  [flair badge — community color]                           │
│  Post title (14px semibold, #f1f5ff)                      │
│  [↑ 142] pill · [💬 38] · [🔖]                            │
└────────────────────────────────────────────────────────────┘
```

- **Top strip**: `height: 3px`, `background: linear-gradient(90deg, color1, color2)`
- **Community badge** (top-right): `font-size: 11px`, community color text, subtle bg + border
- **Flair badge**: `border-radius: 4px`, community color scheme
- **Like pill**: `border-radius: 20px`, community color scheme — `bg`, `border`, `color` all from palette
- **Hover**: `border-color` lifts to `rgba(accent, 0.35)` — 200ms ease. No shadow bloom.
- **Card background**: `var(--surface)` (#0d1526) — no change

### Files to modify
- `src/components/post-card.tsx` — add color strip, community badge, like pill restyle
- `src/components/post-action-bar.tsx` — accept `communityColor` prop for like pill
- `src/lib/community-colors.ts` — new utility file with `getCommunityColor()`

---

## 7. Right Panel (New Component)

**File**: `src/components/right-panel.tsx`

### Hot Communities block

```
HOT COMMUNITIES
─────────────────────────────
● c/bitcoin          12,441 members
● c/ethereum          8,302 members
● c/defi              5,198 members
● c/altcoins          3,041 members
  [View all →]
```

- Dots use community color
- Member count in `var(--muted-foreground)`
- "View all" links to `/feed?tab=communities`

### Who to Follow block

```
WHO TO FOLLOW
─────────────────────────────
[avatar] 0xsatoshi          [+ Follow]
         12 posts · 340 followers

[avatar] chainwatcher        [+ Follow]
         8 posts · 201 followers
```

- Avatars: gradient placeholder using community color of their most active community
- Follow button: ghost style, becomes filled blue on hover
- Data: top posters by like count in the last 7 days (existing posts table query)
- Max 3 users shown

### Layout
```tsx
<aside className="hidden xl:flex flex-col w-72 shrink-0 sticky top-6 self-start gap-4 py-6 pl-4">
  <HotCommunitiesBlock />
  <WhoToFollowBlock />
</aside>
```

---

## 8. Ambient Glow Orb (WOW Layer)

One persistent radial gradient orb on the main layout background. Applied in `src/app/(main)/layout.tsx`:

```css
.bg-ambient-glow {
  background:
    radial-gradient(ellipse 600px 400px at 15% 20%, rgba(59,130,246,0.07) 0%, transparent 70%),
    var(--background);
}
```

- Position: top-left area, `15% 20%`
- Size: `600px 400px` ellipse — large and diffuse
- Opacity: `0.07` — barely perceptible, but adds visible depth against the dark background
- No animation, no movement
- Light mode: orb opacity reduced to `0.04`

---

## 9. Updated CSS Variables

Add to `globals.css`:

```css
:root {
  /* existing vars ... */
  --glow-orb: radial-gradient(ellipse 600px 400px at 15% 20%, rgba(59,130,246,0.07) 0%, transparent 70%);
}

html.light {
  /* existing vars ... */
  --glow-orb: radial-gradient(ellipse 600px 400px at 15% 20%, rgba(37,99,235,0.04) 0%, transparent 70%);
}
```

---

## 10. Typography Changes

| Element | Current | New |
|---|---|---|
| Post title | `font-semibold text-white` (implied ~13px) | `text-sm font-semibold` (14px) — no change needed, already correct |
| Tab labels | `text-sm font-medium` | Same — keep |
| Sidebar labels | `text-sm font-medium` | Same — keep |
| Right panel headings | N/A | `text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]` |

---

## 11. Files to Create / Modify

| File | Action |
|---|---|
| `src/lib/community-colors.ts` | Create — `getCommunityColor(slug)` utility |
| `src/components/right-panel.tsx` | Create — hot communities + who to follow |
| `src/components/post-card.tsx` | Modify — color strip, community badge, like pill |
| `src/components/post-action-bar.tsx` | Modify — accept `communityColor` prop |
| `src/components/community-card.tsx` | Modify — apply community color to card |
| `src/components/sidebar.tsx` | Modify — active state to border-l indicator |
| `src/app/(main)/layout.tsx` | Modify — add ambient glow, wire in right panel |
| `src/app/(main)/feed/page.tsx` | Modify — pass community color to PostCard, fix hardcoded violet/slate colors |
| `src/app/globals.css` | Modify — add `--glow-orb` token, add ambient bg utility class |

---

## 12. Out of Scope

- Landing page changes
- Auth pages
- Admin pages
- Post detail page
- Community settings page
- Mobile layout changes (beyond fixing the feed tab violet → blue inconsistency)

---

## 13. Definition of Done

- [ ] Feed renders with 3-panel layout on xl+ screens
- [ ] Each post card shows community color strip + flair + like pill in community color
- [ ] Right panel shows hot communities and who to follow with real data
- [ ] Sidebar active state is border-left indicator, no background pill
- [ ] Tab bar uses underline-only indicator
- [ ] Ambient glow orb visible on dark background
- [ ] No hardcoded `violet-*` or `slate-*` colors remain in feed/sidebar/cards
- [ ] Light mode still works correctly
- [ ] Mobile layout unchanged and functional
