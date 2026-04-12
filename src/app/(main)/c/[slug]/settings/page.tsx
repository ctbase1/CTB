import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CommunitySettingsForm } from './community-settings-form'
import { DeleteCommunityButton } from './delete-community-button'

interface Props {
  params: { slug: string }
  searchParams: { error?: string; success?: string }
}

export default async function CommunitySettingsPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_removed', false)
    .single()

  if (!community) notFound()

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', community.id)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') redirect(`/c/${params.slug}`)

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/c/${params.slug}`} className="text-sm text-zinc-400 hover:text-white">
          ← c/{params.slug}
        </Link>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
      </div>

      {searchParams.error && (
        <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}
      {searchParams.success && (
        <p className="mb-4 rounded-md bg-green-900/30 px-4 py-2 text-sm text-green-400">
          Settings saved!
        </p>
      )}

      <CommunitySettingsForm community={community} />

      {/* Danger zone */}
      <div className="mt-10 rounded-xl border border-red-900/40 p-6">
        <h3 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Deleting the community hides it from all users. This cannot be undone.
        </p>
        <DeleteCommunityButton communityId={community.id} slug={community.slug} />
      </div>
    </div>
  )
}
