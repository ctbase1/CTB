import { joinCommunity, leaveCommunity } from '@/lib/actions/membership'
import { Button } from '@/components/ui/button'
import type { Membership } from '@/types/database'

interface Props {
  communityId: string
  communitySlug: string
  membership: Pick<Membership, 'role'> | null
  isLoggedIn: boolean
}

export function JoinButton({ communityId, communitySlug, membership, isLoggedIn }: Props) {
  if (!isLoggedIn) {
    return (
      <a href="/login">
        <Button variant="primary" className="text-xs px-3 py-1.5">Join</Button>
      </a>
    )
  }

  if (!membership) {
    return (
      <form action={joinCommunity}>
        <input type="hidden" name="communityId" value={communityId} />
        <input type="hidden" name="communitySlug" value={communitySlug} />
        <Button type="submit" variant="primary" className="text-xs px-3 py-1.5">Join</Button>
      </form>
    )
  }

  if (membership.role === 'admin') {
    return (
      <span className="rounded-md bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-400">
        Admin
      </span>
    )
  }

  if (membership.role === 'moderator') {
    return (
      <span className="rounded-md bg-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300">
        Mod
      </span>
    )
  }

  return (
    <form action={leaveCommunity}>
      <input type="hidden" name="communityId" value={communityId} />
      <input type="hidden" name="communitySlug" value={communitySlug} />
      <Button type="submit" variant="ghost" className="text-xs px-3 py-1.5">Leave</Button>
    </form>
  )
}
