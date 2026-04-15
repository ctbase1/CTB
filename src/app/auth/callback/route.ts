import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  // Build the redirect response upfront so we can attach cookies to it
  const redirectUrl = `${origin}${safeNext}`
  const errorUrl = `${origin}/login?error=oauth_failed`

  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers
            .get('cookie')
            ?.split('; ')
            .map((c) => {
              const [name, ...rest] = c.split('=')
              return { name, value: rest.join('=') }
            }) ?? []
        },
        setAll(toSet) {
          cookiesToSet.push(...toSet)
        },
      },
    }
  )

  let success = false

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) success = true
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) success = true
  }

  const response = NextResponse.redirect(success ? redirectUrl : errorUrl)

  // Attach session cookies to the redirect so the browser is logged in
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  }

  return response
}
