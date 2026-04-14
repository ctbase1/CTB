import Link from 'next/link'
import Image from 'next/image'
import { JoinButton } from '@/components/join-button'
import { Settings } from 'lucide-react'
import type { Community, Membership } from '@/types/database'
import { getCommunityColor } from '@/lib/community-colors'

interface Props {
  community: Community
  membership: Pick<Membership, 'role'> | null
  isLoggedIn: boolean
  memberCount?: number
  isAdmin?: boolean
}

export function CommunityCard({ community, membership, isLoggedIn, memberCount, isAdmin }: Props) {
  const color = getCommunityColor(community.slug)

  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-center gap-3">
        {community.banner_url ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <Image src={community.banner_url} alt={community.name} fill className="object-cover" />
          </div>
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${color.accent}cc, ${color.accent}66)` }}
          >
            {community.name[0].toUpperCase()}
          </div>
        )}
        <div>
          <Link
            href={`/c/${community.slug}`}
            className="text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
          >
            c/{community.slug}
          </Link>
          <p className="text-xs text-[var(--muted-foreground)]">
            {community.name}
            {memberCount !== undefined && (
              <span className="ml-2 text-[var(--muted)]">{memberCount.toLocaleString()} {memberCount === 1 ? 'member' : 'members'}</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link
            href={`/c/${community.slug}/settings`}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <Settings className="h-3 w-3" />
            Settings
          </Link>
        )}
        <JoinButton
          communityId={community.id}
          communitySlug={community.slug}
          membership={membership}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  )
}
