'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function toggleSaved(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postId = formData.get('post_id') as string

  const { data: existing } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()

  if (existing) {
    await supabase
      .from('saved_posts')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)
  } else {
    await supabase
      .from('saved_posts')
      .insert({ user_id: user.id, post_id: postId })
  }

  revalidatePath('/saved')
}
