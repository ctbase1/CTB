'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const username   = (formData.get('username') as string).trim().toLowerCase()
  const bio        = (formData.get('bio') as string).trim()
  const avatar_url = formData.get('avatar_url') as string | null

  // Validate avatar_url is a Cloudinary URL (prevents storing arbitrary URLs)
  if (avatar_url && !avatar_url.startsWith('https://res.cloudinary.com/')) {
    redirect('/settings?error=' + encodeURIComponent('Invalid avatar URL'))
  }

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

  const update = { username, bio: bio || null, ...(avatar_url ? { avatar_url } : {}) }

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

export async function updateEmail(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = (formData.get('email') as string).trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect('/settings?section=account&error=' + encodeURIComponent('Invalid email address'))
  }

  const { error } = await supabase.auth.updateUser({ email })

  if (error) {
    redirect('/settings?section=account&error=' + encodeURIComponent(error.message))
  }

  redirect('/settings?section=account&success=' + encodeURIComponent('Confirmation email sent. Check your inbox.'))
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const currentPassword = formData.get('current_password') as string
  const newPassword     = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (newPassword.length < 8) {
    redirect('/settings?section=account&error=' + encodeURIComponent('New password must be at least 8 characters'))
  }

  if (newPassword !== confirmPassword) {
    redirect('/settings?section=account&error=' + encodeURIComponent('Passwords do not match'))
  }

  // Verify current password by re-signing in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (signInError) {
    redirect('/settings?section=account&error=' + encodeURIComponent('Current password is incorrect'))
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    redirect('/settings?section=account&error=' + encodeURIComponent(error.message))
  }

  redirect('/settings?section=account&success=' + encodeURIComponent('Password updated successfully'))
}

export async function updateNotificationPrefs(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const prefs = {
    comments: formData.get('pref_comments') === 'on',
    replies:  formData.get('pref_replies')  === 'on',
    likes:    formData.get('pref_likes')    === 'on',
    follows:  formData.get('pref_follows')  === 'on',
  }

  const { error } = await supabase
    .from('profiles')
    .update({ notification_prefs: prefs })
    .eq('id', user.id)

  if (error) {
    redirect('/settings?section=notifications&error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/settings')
  redirect('/settings?section=notifications&success=1')
}

export async function deleteAccount() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.auth.admin.deleteUser(user.id)

  if (error) {
    redirect('/settings?section=danger&error=' + encodeURIComponent(error.message))
  }

  redirect('/login')
}
