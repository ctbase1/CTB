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
