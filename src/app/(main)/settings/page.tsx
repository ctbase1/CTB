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
          const profile = data as Profile | null
          setProfile(profile)
          setAvatarUrl(profile?.avatar_url ?? null)
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
