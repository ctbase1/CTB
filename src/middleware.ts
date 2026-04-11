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
