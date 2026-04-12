import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CreatePostForm } from '@/components/create-post-form'

interface Props {
  params: { slug: string }
  searchParams: { error?: string }
}

export default async function SubmitPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug')
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

  if (!membership) redirect(`/c/${params.slug}`)

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link
          href={`/c/${community.slug}`}
          className="text-sm text-zinc-500 hover:text-white"
        >
          ← c/{community.slug}
        </Link>
        <h1 className="mt-2 text-xl font-bold text-white">New Post</h1>
      </div>
      <CreatePostForm
        communitySlug={community.slug}
        error={searchParams.error ?? null}
      />
    </div>
  )
}
