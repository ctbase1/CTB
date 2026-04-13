import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  searchParams: { q?: string }
}

export default async function SearchPage({ searchParams }: Props) {
  const q = (searchParams.q ?? '').trim()
  const supabase = createClient()

  if (!q) {
    return (
      <div>
        <h1 className="mb-6 text-xl font-bold text-white">Search</h1>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
          <p className="text-sm text-zinc-500">Enter a query to search posts, communities, and users.</p>
        </div>
      </div>
    )
  }

  const [
    { data: posts },
    { data: communities },
    { data: users },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, body, created_at, community_id, communities!community_id(slug), author:profiles!author_id(username)')
      .eq('is_removed', false)
      .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('communities')
      .select('id, name, slug, description, banner_url')
      .eq('is_removed', false)
      .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
      .limit(8),
    supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .ilike('username', `%${q}%`)
      .limit(8),
  ])

  const totalResults = (posts?.length ?? 0) + (communities?.length ?? 0) + (users?.length ?? 0)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold text-white">
          Results for <span className="text-indigo-400">&ldquo;{q}&rdquo;</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{totalResults} result{totalResults !== 1 ? 's' : ''}</p>
      </div>

      {/* Communities */}
      {(communities?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Communities</h2>
          <div className="space-y-2">
            {communities!.map(c => (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-zinc-700"
              >
                {c.banner_url ? (
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                    <Image src={c.banner_url} alt={c.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                    {c.name[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-white">{c.name}</p>
                  <p className="truncate text-xs text-zinc-500">c/{c.slug}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Posts */}
      {(posts?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Posts</h2>
          <div className="space-y-2">
            {posts!.map(p => {
              const community = p.communities as { slug: string } | null
              const author    = p.author as { username: string } | null
              return (
                <Link
                  key={p.id}
                  href={community ? `/c/${community.slug}/${p.id}` : '/'}
                  className="block rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-zinc-700"
                >
                  <p className="font-medium text-white line-clamp-1">{p.title}</p>
                  {p.body && (
                    <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{p.body}</p>
                  )}
                  <p className="mt-1 text-xs text-zinc-600">
                    by {author?.username ?? 'unknown'} · {community ? `c/${community.slug}` : ''} · {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Users */}
      {(users?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Users</h2>
          <div className="space-y-2">
            {users!.map(u => (
              <Link
                key={u.id}
                href={`/u/${u.username}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-zinc-700"
              >
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                  {u.avatar_url ? (
                    <Image src={u.avatar_url} alt={u.username} fill className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sm font-bold text-zinc-400">
                      {u.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white">{u.username}</p>
                  {u.bio && <p className="truncate text-xs text-zinc-500">{u.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {totalResults === 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900 py-16 text-center">
          <p className="text-sm font-medium text-slate-400">No results for &ldquo;{q}&rdquo;</p>
          <p className="mt-1 text-xs text-slate-600">Try different keywords or check your spelling.</p>
        </div>
      )}
    </div>
  )
}
