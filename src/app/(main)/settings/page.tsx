'use client'

import { useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateProfile, updateEmail, updatePassword, updateNotificationPrefs, deleteAccount } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AvatarUpload } from '@/components/avatar-upload'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { useSearchParams } from 'next/navigation'

function SaveButton({ label = 'Save changes' }: { label?: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending} className="w-full">{label}</Button>
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bioLen, setBioLen] = useState(0)
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
          setBioLen(profile?.bio?.length ?? 0)
        })
    })
  }, [])

  if (!profile) return <p className="text-zinc-400">Loading…</p>

  const section  = searchParams.get('section') ?? ''
  const error    = searchParams.get('error')
  const success  = searchParams.get('success')

  // Only show global messages for profile section (no section param)
  const profileError   = !section ? error   : null
  const profileSuccess = !section ? success : null

  return (
    <div className="max-w-md space-y-12">

      {/* ── Profile ── */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Profile</h2>

        {profileError && (
          <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
            {decodeURIComponent(profileError)}
          </p>
        )}
        {profileSuccess && (
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
          <div>
            <textarea
              name="bio"
              defaultValue={profile.bio ?? ''}
              placeholder="Tell the community about yourself…"
              rows={3}
              maxLength={200}
              onChange={e => setBioLen(e.target.value.length)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1 text-right text-xs text-zinc-500">{bioLen}/200</p>
          </div>
          <SaveButton />
        </form>
      </section>

      {/* ── Account ── */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Account</h2>

        {section === 'account' && error && (
          <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
            {decodeURIComponent(error)}
          </p>
        )}
        {section === 'account' && success && (
          <p className="mb-4 rounded-md bg-green-900/30 px-4 py-2 text-sm text-green-400">
            {decodeURIComponent(success)}
          </p>
        )}

        {/* Change email */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-zinc-300">Change Email</h3>
          <form action={updateEmail} className="flex flex-col gap-3">
            <Input name="email" label="New email address" type="email" required />
            <SaveButton label="Update email" />
          </form>
        </div>

        {/* Change password */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-300">Change Password</h3>
          <form action={updatePassword} className="flex flex-col gap-3">
            <Input name="current_password" label="Current password" type="password" required />
            <Input name="new_password" label="New password" type="password" required />
            <Input name="confirm_password" label="Confirm new password" type="password" required />
            <SaveButton label="Update password" />
          </form>
        </div>
      </section>

      {/* ── Notifications ── */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Notifications</h2>

        {section === 'notifications' && error && (
          <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
            {decodeURIComponent(error)}
          </p>
        )}
        {section === 'notifications' && success && (
          <p className="mb-4 rounded-md bg-green-900/30 px-4 py-2 text-sm text-green-400">
            Notification preferences saved!
          </p>
        )}

        <form action={updateNotificationPrefs} className="flex flex-col gap-4">
          {(
            [
              { name: 'pref_comments', label: 'Comments on your posts',     key: 'comments' },
              { name: 'pref_replies',  label: 'Replies to your comments',   key: 'replies'  },
              { name: 'pref_likes',    label: 'Likes on your posts',        key: 'likes'    },
              { name: 'pref_follows',  label: 'New followers',              key: 'follows'  },
            ] as const
          ).map(({ name, label, key }) => (
            <label key={name} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 cursor-pointer">
              <span className="text-sm text-zinc-300">{label}</span>
              <input
                type="checkbox"
                name={name}
                defaultChecked={profile.notification_prefs?.[key] !== false}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
              />
            </label>
          ))}
          <SaveButton label="Save preferences" />
        </form>
      </section>

      {/* ── Danger Zone ── */}
      <section>
        <h2 className="mb-2 text-xl font-semibold text-red-500">Danger Zone</h2>
        <p className="mb-6 text-sm text-zinc-500">
          Once you delete your account, there is no going back. All your posts, comments, and data will be permanently removed.
        </p>

        {section === 'danger' && error && (
          <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
            {decodeURIComponent(error)}
          </p>
        )}

        <DeleteAccountButton username={profile.username} />
      </section>

    </div>
  )
}

function DeleteAccountButton({ username }: { username: string }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
      >
        Delete account
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-red-800 bg-red-900/10 p-4 space-y-4">
      <p className="text-sm text-zinc-300">
        Type <span className="font-mono font-bold text-white">{username}</span> to confirm deletion:
      </p>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={username}
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <form action={deleteAccount} className="flex-1">
          <button
            type="submit"
            disabled={input !== username}
            className="w-full rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Delete my account
          </button>
        </form>
        <button
          onClick={() => { setOpen(false); setInput('') }}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
