'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createCommunity } from '@/lib/actions/community'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AvatarUpload } from '@/components/avatar-upload'
import { slugify } from '@/lib/utils'

export default function NewCommunityPage() {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const slugPreview = slugify(name)

  return (
    <div className="max-w-md">
      <h2 className="mb-6 text-xl font-semibold text-white">Create Community</h2>

      {error && (
        <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(error)}
        </p>
      )}

      <form action={createCommunity} className="flex flex-col gap-4">
        <input type="hidden" name="banner_url" value={bannerUrl ?? ''} />

        <div className="flex flex-col items-center gap-2 mb-2">
          <AvatarUpload currentUrl={bannerUrl} onUpload={setBannerUrl} />
          <p className="text-xs text-zinc-500">Banner image (optional)</p>
        </div>

        <div className="flex flex-col gap-1">
          <Input
            name="name"
            label="Community Name"
            required
            placeholder="Crypto Traders"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {name && (
            <p className="text-xs text-zinc-500">
              URL: <span className="text-zinc-300">c/{slugPreview || '…'}</span>
            </p>
          )}
        </div>

        <textarea
          name="description"
          placeholder="What is this community about?"
          rows={3}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <Button type="submit" className="w-full">Create Community</Button>
      </form>
    </div>
  )
}
