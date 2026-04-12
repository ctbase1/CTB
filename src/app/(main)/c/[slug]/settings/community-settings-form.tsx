'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateCommunity } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AvatarUpload } from '@/components/avatar-upload'
import type { Community } from '@/types/database'

function SaveButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending} className="w-full">Save changes</Button>
}

interface Props {
  community: Community
}

export function CommunitySettingsForm({ community }: Props) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(community.banner_url)
  const [descLen, setDescLen]     = useState(community.description?.length ?? 0)

  // Flairs state
  const [flairInput, setFlairInput] = useState(community.allowed_flairs.join(', '))

  // Rules state
  const [rules, setRules] = useState<{ title: string; body: string }[]>(community.rules ?? [])

  function addRule() {
    setRules(r => [...r, { title: '', body: '' }])
  }

  function removeRule(i: number) {
    setRules(r => r.filter((_, idx) => idx !== i))
  }

  function updateRule(i: number, field: 'title' | 'body', value: string) {
    setRules(r => r.map((rule, idx) => idx === i ? { ...rule, [field]: value } : rule))
  }

  return (
    <form action={updateCommunity} className="flex flex-col gap-6">
      <input type="hidden" name="communityId" value={community.id} />
      <input type="hidden" name="slug"        value={community.slug} />
      <input type="hidden" name="banner_url"  value={bannerUrl ?? ''} />
      <input type="hidden" name="rules"       value={JSON.stringify(rules.filter(r => r.title.trim()))} />

      {/* Banner */}
      <div className="flex flex-col items-center gap-2">
        <AvatarUpload currentUrl={bannerUrl} onUpload={setBannerUrl} />
        <p className="text-xs text-zinc-500">Community banner</p>
      </div>

      {/* Name */}
      <Input
        name="name"
        label="Display Name"
        defaultValue={community.name}
        required
      />

      {/* Description */}
      <div>
        <textarea
          name="description"
          defaultValue={community.description ?? ''}
          placeholder="What is this community about?"
          rows={3}
          maxLength={300}
          onChange={e => setDescLen(e.target.value.length)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-zinc-500">{descLen}/300</p>
      </div>

      {/* Flairs */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">Allowed Flairs</label>
        <input
          name="allowed_flairs"
          value={flairInput}
          onChange={e => setFlairInput(e.target.value)}
          placeholder="Discussion, News, Analysis, Meme"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-zinc-500">Comma-separated. Leave empty to disable flairs.</p>
        {flairInput && (
          <div className="mt-2 flex flex-wrap gap-1">
            {flairInput.split(',').map(f => f.trim()).filter(Boolean).map(f => (
              <span key={f} className="rounded-full bg-indigo-900/60 px-2 py-0.5 text-xs text-indigo-300">{f}</span>
            ))}
          </div>
        )}
      </div>

      {/* Rules */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">Community Rules</label>
          <button
            type="button"
            onClick={addRule}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            + Add rule
          </button>
        </div>

        {rules.length === 0 ? (
          <p className="text-xs text-zinc-500">No rules set.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map((rule, i) => (
              <div key={i} className="rounded-md border border-zinc-700 bg-zinc-900 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-500">Rule {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeRule(i)}
                    className="text-xs text-zinc-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
                <input
                  value={rule.title}
                  onChange={e => updateRule(i, 'title', e.target.value)}
                  placeholder="Rule title"
                  maxLength={100}
                  className="mb-2 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
                <textarea
                  value={rule.body}
                  onChange={e => updateRule(i, 'body', e.target.value)}
                  placeholder="Rule description (optional)"
                  rows={2}
                  maxLength={300}
                  className="w-full resize-none rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <SaveButton />
    </form>
  )
}
