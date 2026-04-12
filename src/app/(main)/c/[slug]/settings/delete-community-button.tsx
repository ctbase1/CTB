'use client'

import { deleteCommunity } from './actions'
import { Button } from '@/components/ui/button'

interface Props {
  communityId: string
  slug: string
}

export function DeleteCommunityButton({ communityId, slug }: Props) {
  return (
    <form action={deleteCommunity}>
      <input type="hidden" name="communityId" value={communityId} />
      <input type="hidden" name="slug"        value={slug} />
      <Button
        type="submit"
        variant="danger"
        onClick={(e) => {
          if (!confirm('Are you sure? This cannot be undone.')) e.preventDefault()
        }}
      >
        Delete Community
      </Button>
    </form>
  )
}
