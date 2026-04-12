'use client'

import { useState } from 'react'
import { updateCommunity } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AvatarUpload } from '@/components/avatar-upload'
import type { Community } from '@/types/database'

interface Props {
  community: Community
}

export function CommunitySettingsForm({ community }: Props) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(community.banner_url)

  return (
    <form action={updateCommunity} className="flex flex-col gap-4">
      <input type="hidden" name="communityId" value={community.id} />
      <input type="hidden" name="slug"        value={community.slug} />
      <input type="hidden" name="banner_url"  value={bannerUrl ?? ''} />

      <div className="flex flex-col items-center gap-2 mb-2">
        <AvatarUpload currentUrl={bannerUrl} onUpload={setBannerUrl} />
        <p className="text-xs text-zinc-500">Community banner</p>
      </div>

      <Input
        name="name"
        label="Display Name"
        defaultValue={community.name}
        required
      />

      <textarea
        name="description"
        defaultValue={community.description ?? ''}
        placeholder="What is this community about?"
        rows={3}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <Button type="submit" className="w-full">Save changes</Button>
    </form>
  )
}
