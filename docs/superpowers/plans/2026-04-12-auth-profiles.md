# Phase 1: Auth + Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js 14 App Router project and implement full user authentication (email + Google OAuth) with profile creation, editing, avatar upload, and banned user handling.

**Architecture:** Next.js 14 App Router with `@supabase/ssr` for cookie-based auth on both server and client; Server Actions for all mutations; middleware refreshes sessions and enforces route protection; Cloudinary avatar uploads happen client-side (URL stored in DB).

**Tech Stack:** Next.js 14, TypeScript 5, Tailwind CSS 3, Supabase (`@supabase/supabase-js` v2, `@supabase/ssr`), Cloudinary (unsigned upload preset)

---

## File Map

```
D:/CBT/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (fonts, global CSS)
│   │   ├── globals.css                   # Tailwind directives
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                # Centered card layout
│   │   │   ├── login/
│   │   │   │   ├── page.tsx              # Login form (email + Google button)
│   │   │   │   └── actions.ts            # signInWithEmail, signInWithGoogle
│   │   │   └── register/
│   │   │       ├── page.tsx              # Register form
│   │   │       └── actions.ts            # signUp server action
│   │   ├── (main)/
│   │   │   ├── layout.tsx                # Navbar + children
│   │   │   ├── page.tsx                  # Home feed placeholder
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx              # Profile edit form + avatar upload
│   │   │   │   └── actions.ts            # updateProfile server action
│   │   │   └── u/
│   │   │       └── [username]/
│   │   │           └── page.tsx          # Public profile view
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts              # OAuth callback handler
│   │   └── banned/
│   │       └── page.tsx                  # Banned user landing page
│   ├── components/
│   │   ├── navbar.tsx                    # Top nav with avatar + links
│   │   ├── avatar-upload.tsx             # Cloudinary client-side upload
│   │   └── ui/
│   │       ├── button.tsx                # Shared button (variant prop)
│   │       └── input.tsx                 # Shared labeled input
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts                 # createServerClient (Server Components / Actions)
│   │   │   ├── client.ts                 # createBrowserClient (Client Components)
│   │   │   └── middleware.ts             # updateSession (Middleware)
│   │   └── cloudinary.ts                 # getCloudinaryUploadUrl helper
│   ├── middleware.ts                      # Session refresh + route guard
│   └── types/
│       └── database.ts                   # TypeScript types for DB tables
├── supabase/
│   └── migrations/
│       └── 001_auth_profiles.sql         # profiles table + RLS + trigger
├── .env.local.example                    # Env var template
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Task 1: Scaffold Next.js 14 Project

**Files:**
- Create: all root config files (`package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`)

- [ ] **Step 1: Run create-next-app in the project root**

```bash
cd /d/CBT
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git --yes
```

Expected output: `Success! Created ... at D:\CBT`
The scaffolder will not overwrite `CLAUDE.md`, `docs/`, or `tasks/`.

- [ ] **Step 2: Install Supabase SSR + Cloudinary packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Expected: packages added to `node_modules/`, `package.json` updated.

- [ ] **Step 3: Create `.env.local.example`**

Create `D:/CBT/.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=cbt_avatars
```

- [ ] **Step 4: Create `D:/CBT/.env.local` from the example**

Copy `.env.local.example` to `.env.local` and fill in real values from:
- Supabase dashboard → Settings → API
- Cloudinary dashboard → Settings → Upload → Upload presets

- [ ] **Step 5: Update `next.config.ts` to allow Cloudinary image domain**

Replace `next.config.ts` with:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: `Local: http://localhost:3000` with no errors.
Stop the server (`Ctrl+C`) after confirming.

- [ ] **Step 7: Commit**

```bash
git init
git add package.json package-lock.json next.config.ts tsconfig.json tailwind.config.ts .env.local.example src/app/layout.tsx src/app/globals.css
git commit -m "feat: scaffold Next.js 14 project with Supabase + Cloudinary deps"
```

---

## Task 2: TypeScript DB Types + Supabase Clients

**Files:**
- Create: `src/types/database.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Create `src/types/database.ts`**

```typescript
export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  is_platform_admin: boolean
  is_banned: boolean
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'is_platform_admin' | 'is_banned' | 'created_at'>
        Update: Partial<Pick<Profile, 'username' | 'avatar_url' | 'bio'>>
      }
    }
  }
}
```

- [ ] **Step 2: Create `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — cookies can't be set.
            // Middleware handles session refresh.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Create `src/lib/supabase/middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/types/database.ts src/lib/supabase/server.ts src/lib/supabase/client.ts src/lib/supabase/middleware.ts
git commit -m "feat: add DB types and Supabase client helpers"
```

---

## Task 3: Database Schema (Supabase Migration)

**Files:**
- Create: `supabase/migrations/001_auth_profiles.sql`

- [ ] **Step 1: Create `supabase/migrations/001_auth_profiles.sql`**

```sql
-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  avatar_url      TEXT,
  bio             TEXT,
  is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Auto-create profile on signup
-- Handles username uniqueness: appends incrementing suffix
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix         INT := 0;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  -- Sanitize: lowercase, replace non-alphanumeric with underscore
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '_', 'g');
  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, final_username);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read all profiles
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own row, but cannot change is_platform_admin or is_banned
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_platform_admin = (SELECT is_platform_admin FROM profiles WHERE id = auth.uid())
    AND is_banned         = (SELECT is_banned         FROM profiles WHERE id = auth.uid())
  );
```

- [ ] **Step 2: Run migration in Supabase dashboard**

Open Supabase project → SQL Editor → paste the full SQL above → Run.

Verify in Table Editor that `profiles` table exists with the correct columns.

- [ ] **Step 3: Enable Google OAuth in Supabase**

Supabase dashboard → Authentication → Providers → Google → Enable.
Set "Redirect URL" to: `http://localhost:3000/auth/callback` (and add your production URL later).

- [ ] **Step 4: Commit migration file**

```bash
mkdir -p supabase/migrations
git add supabase/migrations/001_auth_profiles.sql
git commit -m "feat: add profiles schema with RLS and auto-create trigger"
```

---

## Task 4: Middleware — Session Refresh + Route Protection

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create `src/middleware.ts`**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname

  // Public routes that never need auth
  const publicPaths = ['/login', '/register', '/banned', '/auth/callback']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  // Not logged in → redirect to login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in but accessing auth pages → redirect home
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Check ban status for authenticated users (skip /banned itself)
  if (user && !pathname.startsWith('/banned')) {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_banned')
      .eq('id', user.id)
      .single()

    if (profile?.is_banned) {
      const url = request.nextUrl.clone()
      url.pathname = '/banned'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add middleware for session refresh, route guard, and ban check"
```

---

## Task 5: OAuth Callback Route

**Files:**
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Create `src/app/auth/callback/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/callback/route.ts
git commit -m "feat: add OAuth callback route handler"
```

---

## Task 6: Shared UI Components

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`

- [ ] **Step 1: Create `src/components/ui/button.tsx`**

```typescript
import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-zinc-800 text-white hover:bg-zinc-700',
  danger:    'bg-red-600 text-white hover:bg-red-700',
  ghost:     'bg-transparent text-zinc-300 hover:bg-zinc-800',
}

export function Button({ variant = 'primary', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        className
      )}
    >
      {loading ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Create `src/lib/utils.ts` (cn helper)**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Install `clsx` and `tailwind-merge`**

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 4: Create `src/components/ui/input.tsx`**

```typescript
import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={cn(
            'rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white',
            'placeholder:text-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/input.tsx src/lib/utils.ts
git commit -m "feat: add shared Button and Input UI components"
```

---

## Task 7: Auth Layout + Login Page

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/login/actions.ts`

- [ ] **Step 1: Create `src/app/(auth)/layout.tsx`**

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-white">
          CBT Community
        </h1>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/(auth)/login/actions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/')
}

export async function signInWithGoogle() {
  const origin = headers().get('origin')
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.url) {
    redirect('/login?error=google_failed')
  }

  redirect(data.url)
}
```

- [ ] **Step 3: Create `src/app/(auth)/login/page.tsx`**

```typescript
import { signInWithEmail, signInWithGoogle } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  searchParams: { error?: string }
}

export default function LoginPage({ searchParams }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
      <h2 className="mb-6 text-xl font-semibold text-white">Sign in</h2>

      {searchParams.error && (
        <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}

      <form action={signInWithEmail} className="flex flex-col gap-4">
        <Input name="email" type="email" label="Email" required placeholder="you@example.com" />
        <Input name="password" type="password" label="Password" required placeholder="••••••••" />
        <Button type="submit" className="w-full">Sign in</Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <hr className="flex-1 border-zinc-700" />
        <span className="text-xs text-zinc-500">or</span>
        <hr className="flex-1 border-zinc-700" />
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="secondary" className="w-full">
          Continue with Google
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        No account?{' '}
        <Link href="/register" className="text-indigo-400 hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Start dev server and manually verify login page renders at `http://localhost:3000/login`**

```bash
npm run dev
```

Expected: Login form renders with email/password fields and Google button. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/layout.tsx src/app/\(auth\)/login/page.tsx src/app/\(auth\)/login/actions.ts
git commit -m "feat: add login page with email + Google OAuth"
```

---

## Task 8: Register Page

**Files:**
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/register/actions.ts`

- [ ] **Step 1: Create `src/app/(auth)/register/actions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const username = (formData.get('username') as string).trim().toLowerCase()

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    redirect('/register?error=' + encodeURIComponent('Username must be 3-20 chars: letters, numbers, underscores only'))
  }

  const supabase = createClient()

  // Check username availability before signup
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (existing) {
    redirect('/register?error=' + encodeURIComponent('Username already taken'))
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  })

  if (error) {
    redirect('/register?error=' + encodeURIComponent(error.message))
  }

  redirect('/?welcome=1')
}
```

- [ ] **Step 2: Create `src/app/(auth)/register/page.tsx`**

```typescript
import { signUp } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  searchParams: { error?: string }
}

export default function RegisterPage({ searchParams }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
      <h2 className="mb-6 text-xl font-semibold text-white">Create account</h2>

      {searchParams.error && (
        <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}

      <form action={signUp} className="flex flex-col gap-4">
        <Input
          name="username"
          label="Username"
          required
          placeholder="satoshi"
          pattern="[a-z0-9_]{3,20}"
          title="3-20 characters: letters, numbers, underscores"
        />
        <Input name="email" type="email" label="Email" required placeholder="you@example.com" />
        <Input name="password" type="password" label="Password" required placeholder="••••••••" minLength={8} />
        <Button type="submit" className="w-full">Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Verify registration flow manually**

1. Go to `http://localhost:3000/register`
2. Fill in username, email, password → submit
3. Expect redirect to `/` (or email confirmation if enabled in Supabase)
4. Check Supabase dashboard → Authentication → Users → confirm user exists
5. Check Table Editor → profiles → confirm row created with correct username

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/register/page.tsx src/app/\(auth\)/register/actions.ts
git commit -m "feat: add register page with username availability check"
```

---

## Task 9: Main Layout + Navbar

**Files:**
- Create: `src/app/(main)/layout.tsx`
- Create: `src/components/navbar.tsx`

- [ ] **Step 1: Create `src/components/navbar.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

interface NavbarProps {
  profile: Profile
}

export function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <Link href="/" className="text-lg font-bold text-white">
          CBT
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/notifications" className="text-sm text-zinc-400 hover:text-white">
            Notifications
          </Link>
          <Link href={`/u/${profile.username}`} className="text-sm text-zinc-400 hover:text-white">
            {profile.username}
          </Link>
          <Link href="/settings" className="text-sm text-zinc-400 hover:text-white">
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-zinc-400 hover:text-red-400"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create `src/app/(main)/layout.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/layout.tsx src/components/navbar.tsx
git commit -m "feat: add main layout with authenticated navbar"
```

---

## Task 10: Home Page Placeholder

**Files:**
- Create: `src/app/(main)/page.tsx`

- [ ] **Step 1: Create `src/app/(main)/page.tsx`**

```typescript
export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-white">Home Feed</h2>
      <p className="text-zinc-400">
        Communities and posts coming in Phase 2.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify full auth flow manually**

1. Visit `http://localhost:3000` → should redirect to `/login`
2. Register new account → should land on home page with navbar showing username
3. Sign out → should redirect to `/login`
4. Sign back in → should land on home page

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/page.tsx
git commit -m "feat: add home page placeholder"
```

---

## Task 11: Cloudinary Avatar Upload Component

**Files:**
- Create: `src/lib/cloudinary.ts`
- Create: `src/components/avatar-upload.tsx`

- [ ] **Step 1: Create `src/lib/cloudinary.ts`**

```typescript
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary env vars not set')
  }

  const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  if (file.size > MAX_BYTES) throw new Error('File exceeds 5 MB limit')
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Unsupported file type')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) throw new Error('Cloudinary upload failed')

  const data = await res.json()
  return data.secure_url as string
}
```

- [ ] **Step 2: Create `src/components/avatar-upload.tsx`**

```typescript
'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { uploadToCloudinary } from '@/lib/cloudinary'

interface AvatarUploadProps {
  currentUrl: string | null
  onUpload: (url: string) => void
}

export function AvatarUpload({ currentUrl, onUpload }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const url = await uploadToCloudinary(file)
      setPreview(url)
      onUpload(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-zinc-800 ring-2 ring-zinc-700 hover:ring-indigo-500"
      >
        {preview ? (
          <Image src={preview} alt="Avatar" fill className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-3xl text-zinc-500">
            ?
          </span>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-sm text-indigo-400 hover:underline"
        disabled={uploading}
      >
        {uploading ? 'Uploading…' : 'Change avatar'}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/cloudinary.ts src/components/avatar-upload.tsx
git commit -m "feat: add Cloudinary avatar upload component with validation"
```

---

## Task 12: Settings Page (Profile Edit)

**Files:**
- Create: `src/app/(main)/settings/page.tsx`
- Create: `src/app/(main)/settings/actions.ts`

- [ ] **Step 1: Create `src/app/(main)/settings/actions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const username   = (formData.get('username') as string).trim().toLowerCase()
  const bio        = (formData.get('bio') as string).trim()
  const avatar_url = formData.get('avatar_url') as string | null

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    redirect('/settings?error=' + encodeURIComponent('Username must be 3-20 chars: letters, numbers, underscores only'))
  }

  // Check username availability (exclude self)
  const { data: taken } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .single()

  if (taken) {
    redirect('/settings?error=' + encodeURIComponent('Username already taken'))
  }

  const update: Record<string, string | null> = { username, bio: bio || null }
  if (avatar_url) update.avatar_url = avatar_url

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) {
    redirect('/settings?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/settings')
  revalidatePath(`/u/${username}`)
  redirect('/settings?success=1')
}
```

- [ ] **Step 2: Create `src/app/(main)/settings/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { updateProfile } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AvatarUpload } from '@/components/avatar-upload'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { useSearchParams } from 'next/navigation'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setProfile(data)
          setAvatarUrl(data?.avatar_url ?? null)
        })
    })
  }, [])

  if (!profile) return <p className="text-zinc-400">Loading…</p>

  const error   = searchParams.get('error')
  const success = searchParams.get('success')

  return (
    <div className="max-w-md">
      <h2 className="mb-6 text-xl font-semibold text-white">Profile settings</h2>

      {error && (
        <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(error)}
        </p>
      )}
      {success && (
        <p className="mb-4 rounded-md bg-green-900/30 px-4 py-2 text-sm text-green-400">
          Profile updated!
        </p>
      )}

      <AvatarUpload currentUrl={profile.avatar_url} onUpload={setAvatarUrl} />

      <form action={updateProfile} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="avatar_url" value={avatarUrl ?? ''} />
        <Input
          name="username"
          label="Username"
          defaultValue={profile.username}
          required
          pattern="[a-z0-9_]{3,20}"
        />
        <textarea
          name="bio"
          defaultValue={profile.bio ?? ''}
          placeholder="Tell the community about yourself…"
          rows={3}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button type="submit" className="w-full">Save changes</Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Manually verify settings flow**

1. Log in, navigate to `/settings`
2. Change username → verify redirect back with "Profile updated!"
3. Upload avatar image → verify Cloudinary URL appears in profile row (Supabase Table Editor)
4. Try taken username → verify error message
5. Try invalid username (spaces, special chars) → verify error message

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/settings/page.tsx src/app/\(main\)/settings/actions.ts
git commit -m "feat: add profile settings page with avatar upload and username edit"
```

---

## Task 13: Public Profile Page

**Files:**
- Create: `src/app/(main)/u/[username]/page.tsx`

- [ ] **Step 1: Create `src/app/(main)/u/[username]/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'

interface Props {
  params: { username: string }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, bio, created_at')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative h-24 w-24 overflow-hidden rounded-full bg-zinc-800">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-4xl text-zinc-500">
            {profile.username[0].toUpperCase()}
          </span>
        )}
      </div>

      <h1 className="text-2xl font-bold text-white">{profile.username}</h1>

      {profile.bio && (
        <p className="max-w-md text-center text-sm text-zinc-400">{profile.bio}</p>
      )}

      <p className="text-xs text-zinc-500">
        Joined {new Date(profile.created_at).toLocaleDateString()}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Manually verify**

1. Navigate to `/u/<your-username>`
2. Confirm avatar, username, bio, join date render correctly
3. Navigate to `/u/nonexistent` → confirm Next.js 404 page

- [ ] **Step 3: Commit**

```bash
git add "src/app/(main)/u/[username]/page.tsx"
git commit -m "feat: add public profile page"
```

---

## Task 14: Banned Page

**Files:**
- Create: `src/app/banned/page.tsx`

- [ ] **Step 1: Create `src/app/banned/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function BannedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not authenticated → go to login
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .single()

  // Not actually banned → go home
  if (!profile?.is_banned) redirect('/')

  async function signOut() {
    'use server'
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-center">
      <h1 className="text-3xl font-bold text-red-400">Account Suspended</h1>
      <p className="max-w-md text-zinc-400">
        Your account has been banned from CBT Community. If you believe this is a mistake,
        contact support.
      </p>
      <form action={signOut}>
        <Button variant="secondary" type="submit">Sign out</Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Manually test ban redirect**

In Supabase Table Editor, set `is_banned = true` for your test account.
Refresh any page → middleware should redirect to `/banned`.
Restore `is_banned = false` after verifying.

- [ ] **Step 3: Commit**

```bash
git add src/app/banned/page.tsx
git commit -m "feat: add banned user page with sign-out action"
```

---

## Self-Review Checklist

### Spec Coverage

| Spec Requirement | Task |
|---|---|
| Email + Google OAuth login | Tasks 7, 5 |
| Auto-create profile on signup | Task 3 (DB trigger) |
| Username conflict resolution (auto-suffix) | Task 3 (DB trigger loop) |
| Username validation on register | Task 8 |
| Route protection (auth middleware) | Task 4 |
| Banned user redirect | Tasks 4, 14 |
| Profile edit (username, bio, avatar) | Tasks 11, 12 |
| Cloudinary avatar upload (5 MB limit, type check) | Task 11 |
| Public profile page | Task 13 |
| `is_platform_admin` not settable via client | Task 3 (RLS WITH CHECK) |
| `is_banned` not settable via client | Task 3 (RLS WITH CHECK) |
| Google OAuth username conflict prompted to choose | Task 3 (trigger appends suffix) |

All spec requirements for Phase 1 are covered. No placeholders remain.
