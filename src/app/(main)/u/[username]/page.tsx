import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { FollowButton } from '@/components/follow-button'

interface Props {
  params: { username: string }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, created_at')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  const isOwnProfile = user?.id === profile.id

  const [
    { count: followerCount },
    { count: followingCount },
    { data: followRow },
  ] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
    user && !isOwnProfile
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const isFollowing = !!followRow

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative h-24 w-24 overflow-hidden rounded-full bg-zinc-800">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-4xl text-zinc-500">
            {profile.username[0].toUpperCase()}
          </span>
        )}
      </div>

      <h1 className="text-2xl font-bold text-white">{profile.username}</h1>

      <p className="text-sm text-zinc-500">
        <span className="text-white font-medium">{followerCount ?? 0}</span> followers ·{' '}
        <span className="text-white font-medium">{followingCount ?? 0}</span> following
      </p>

      {profile.bio && (
        <p className="max-w-md text-center text-sm text-zinc-400">{profile.bio}</p>
      )}

      <p className="text-xs text-zinc-500">
        Joined {new Date(profile.created_at).toLocaleDateString()}
      </p>

      {!isOwnProfile && (
        <FollowButton
          targetUserId={profile.id}
          initialFollowed={isFollowing}
          currentUserId={user?.id ?? null}
        />
      )}
    </div>
  )
}
