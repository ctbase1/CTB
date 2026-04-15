'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function VerifyPoller() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes in this tab (covers same-device verification)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.email_confirmed_at) {
        router.replace('/feed')
      }
    })

    // Poll every 3 seconds to catch cross-device verification
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        router.replace('/feed')
      }
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [router])

  return null
}
