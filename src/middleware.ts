import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// ---------------------------------------------------------------------------
// In-memory rate limiter
// ---------------------------------------------------------------------------
type RateEntry = { count: number; resetAt: number }
const rateLimits = new Map<string, RateEntry>()

const RATE_RULES: { match: (p: string) => boolean; limit: number; windowMs: number }[] = [
  { match: (p) => p.startsWith('/login') || p.startsWith('/register'), limit: 5,  windowMs: 15 * 60 * 1000 },
  { match: (p) => p.startsWith('/api/notifications'),                  limit: 60, windowMs: 60 * 1000 },
  { match: (p) => p.startsWith('/api/'),                               limit: 60, windowMs: 60 * 1000 },
]

function checkRateLimit(ip: string, pathname: string): { limited: boolean; retryAfter: number } {
  const rule = RATE_RULES.find(r => r.match(pathname))
  if (!rule) return { limited: false, retryAfter: 0 }

  const key = `${ip}:${pathname.split('/')[1]}`
  const now = Date.now()
  const entry = rateLimits.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + rule.windowMs })
    return { limited: false, retryAfter: 0 }
  }

  entry.count++
  if (entry.count > rule.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { limited: true, retryAfter }
  }

  return { limited: false, retryAfter: 0 }
}

export async function middleware(request: NextRequest) {
  // Rate limiting — runs before auth checks
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const { limited, retryAfter } = checkRateLimit(ip, request.nextUrl.pathname)
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

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
      .single() as { data: { is_banned: boolean } | null; error: unknown }

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
