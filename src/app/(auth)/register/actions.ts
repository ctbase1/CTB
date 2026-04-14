'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signUp(formData: FormData) {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const username = (formData.get('username') as string).trim().toLowerCase()

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    redirect('/register?error=' + encodeURIComponent('Username must be 3-20 chars: letters, numbers, underscores only'))
  }

  const origin = headers().get('origin')
  const supabase = createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${origin}/auth/callback?next=/feed`,
    },
  })

  if (error) {
    redirect('/register?error=' + encodeURIComponent(error.message))
  }

  redirect('/register?verify=1&email=' + encodeURIComponent(email))
}

export async function resendConfirmation(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = createClient()
  await supabase.auth.resend({ type: 'signup', email })
  redirect('/register?verify=1&email=' + encodeURIComponent(email) + '&resent=1')
}
