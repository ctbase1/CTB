'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function resendConfirmationByEmail(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = createClient()
  await supabase.auth.resend({ type: 'signup', email })
  redirect('/verify-email?email=' + encodeURIComponent(email) + '&resent=1')
}
