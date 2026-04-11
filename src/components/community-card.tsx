import Link from 'next/link'
import Image from 'next/image'
import { JoinButton } from '@/components/join-button'
import type { Community, Membership } from '@/types/database'

interface Props {
  community: Community
  membership: Pick<Membership, 'role'> | null
  isLoggedIn: boolean
}

export function CommunityCard({ community, membership, isLoggedIn }: Props) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="flex items-center gap-3">
        {community.banner_url ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-700">
            <Image src={community.banner_url} alt={community.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-white">
            {community.name[0].toUpperCase()}
          </div>
        )}
        <div>
          <Link href={`/c/${community.slug}`} className="text-sm font-medium text-white hover:underline">
            c/{community.slug}
          </Link>
          <p className="text-xs text-zinc-500">{community.name}</p>
        </div>
      </div>
      <JoinButton
        communityId={community.id}
        communitySlug={community.slug}
        membership={membership}
        isLoggedIn={isLoggedIn}
      />
    </div>
  )
}
