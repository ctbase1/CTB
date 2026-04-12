import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { JoinButton } from '@/components/join-button'
import type { Membership } from '@/types/database'

interface Props {
  params: { slug: string }
  searchParams: { error?: string }
}

export default async function CommunityPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_removed', false)
    .single()

  if (!community) notFound()

  // Member count
  const { count: memberCount } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', community.id)

  // Current user's membership
  let membership: Pick<Membership, 'role'> | null = null
  if (user) {
    const { data } = await supabase
      .from('memberships')
      .select('role')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .single()
    membership = data
  }

  const isAdmin = membership?.role === 'admin'

  return (
    <div>
      {/* Banner */}
      {community.banner_url && (
        <div className="relative h-32 w-full overflow-hidden rounded-xl bg-zinc-800 mb-4">
          <Image src={community.banner_url} alt={community.name} fill className="object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{community.name}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            c/{community.slug} · {memberCount ?? 0} {memberCount === 1 ? 'member' : 'members'}
          </p>
          {community.description && (
            <p className="mt-3 text-sm text-zinc-300 max-w-lg">{community.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Link
              href={`/c/${community.slug}/settings`}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Settings
            </Link>
          )}
          <JoinButton
            communityId={community.id}
            communitySlug={community.slug}
            membership={membership}
            isLoggedIn={!!user}
          />
        </div>
      </div>

      {searchParams.error === 'admins-cannot-leave' && (
        <p className="mt-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
          Community admins cannot leave. Delete the community instead.
        </p>
      )}

      {/* Posts placeholder */}
      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
        <p className="text-zinc-500 text-sm">Posts coming in Phase 3.</p>
      </div>
    </div>
  )
}
