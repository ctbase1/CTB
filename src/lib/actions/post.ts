'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'
import { createAuditLog } from '@/lib/audit'

const URL_REGEX = /https?:\/\/[^\s"'<>]+/i

async function fetchLinkPreview(url: string) {
  try {
    // Validate URL before fetching to prevent SSRF
    sanitizeUrl(url)
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CTBBot/1.0)' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const get = (prop: string) => {
      const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
           ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'))
      return m?.[1] ?? null
    }
    return {
      url,
      title:       get('og:title') ?? get('twitter:title'),
      description: get('og:description') ?? get('twitter:description'),
      image_url:   get('og:image') ?? get('twitter:image'),
    }
  } catch {
    return null
  }
}

export async function createPost(formData: FormData) {
  let slug = ''
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    slug        = formData.get('community_slug') as string
    let title: string
    try {
      title = sanitizeText((formData.get('title') as string) ?? '', { min: 3, max: 300 })
    } catch (e) {
      redirect(`/c/${slug}/submit?error=` + encodeURIComponent((e as Error).message))
    }
    const rawBody   = ((formData.get('body') as string) ?? '').trim()
    const body      = rawBody ? sanitizeText(rawBody, { min: 0, max: 10000 }) || null : null
    const image_url = (formData.get('image_url') as string) || null
    const flair     = (formData.get('flair') as string) || null

    if (image_url && !image_url.startsWith('https://res.cloudinary.com/')) {
      redirect(`/c/${slug}/submit?error=` + encodeURIComponent('Invalid image URL'))
    }

    const { data: community } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .eq('is_removed', false)
      .single()

    if (!community) redirect('/')

    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      redirect(`/c/${slug}/submit?error=` + encodeURIComponent('You must be a member to post'))
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ community_id: community.id, author_id: user.id, title, body, image_url, flair })
      .select('id')
      .single()

    if (error || !post) {
      redirect(`/c/${slug}/submit?error=` + encodeURIComponent(error?.message ?? 'Failed to create post'))
    }

    // Fetch OG metadata for the first URL in the body (fire-and-forget style; non-blocking)
    const textToScan = `${title} ${body ?? ''}`
    const urlMatch   = textToScan.match(URL_REGEX)
    if (urlMatch) {
      fetchLinkPreview(urlMatch[0]).then(preview => {
        if (preview) {
          createClient()
            .from('posts')
            .update({ link_preview: preview })
            .eq('id', post.id)
            .then(() => {})
        }
      })
    }

    revalidatePath(`/c/${slug}`)
    redirect(`/c/${slug}/${post.id}`)
  } catch (err: unknown) {
    // Re-throw Next.js redirect/notFound errors — they must not be swallowed
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err

    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[createPost]', message)
    redirect(`/c/${slug}/submit?error=` + encodeURIComponent(message))
  }
}

export async function deletePost(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postId        = formData.get('post_id') as string
  const communitySlug = formData.get('community_slug') as string

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, community_id')
    .eq('id', postId)
    .single()

  if (!post) redirect(`/c/${communitySlug}`)

  const isOwner = post.author_id === user.id
  if (!isOwner) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('community_id', post.community_id)
      .eq('user_id', user.id)
      .single()

    const canDelete = membership?.role === 'admin' || membership?.role === 'moderator'
    if (!canDelete) redirect(`/c/${communitySlug}`)
  }

  await supabase.from('posts').update({ is_removed: true }).eq('id', postId)

  await createAuditLog(supabase, {
    actorId:     user.id,
    action:      'delete_post',
    targetType:  'post',
    targetId:    postId,
  })

  revalidatePath(`/c/${communitySlug}`)
  redirect(`/c/${communitySlug}`)
}

export async function editPost(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postId       = formData.get('post_id') as string
  const newBody      = ((formData.get('body') as string) ?? '').trim() || null
  const communitySlug = formData.get('community_slug') as string

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, created_at')
    .eq('id', postId)
    .eq('is_removed', false)
    .single()

  if (!post || post.author_id !== user.id) {
    redirect(`/c/${communitySlug}/${postId}`)
  }

  const createdAt  = new Date(post.created_at).getTime()
  const thirtyMins = 30 * 60 * 1000
  if (Date.now() - createdAt > thirtyMins) {
    redirect(`/c/${communitySlug}/${postId}?error=` + encodeURIComponent('Edit window has expired (30 minutes)'))
  }

  await supabase
    .from('posts')
    .update({ body: newBody, edited_at: new Date().toISOString() })
    .eq('id', postId)

  revalidatePath(`/c/${communitySlug}/${postId}`)
  redirect(`/c/${communitySlug}/${postId}`)
}

export async function togglePin(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postId       = formData.get('post_id') as string
  const communitySlug = formData.get('community_slug') as string

  const { data: post } = await supabase
    .from('posts')
    .select('is_pinned, community_id')
    .eq('id', postId)
    .eq('is_removed', false)
    .single()

  if (!post) redirect(`/c/${communitySlug}`)

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('community_id', post.community_id)
    .eq('user_id', user.id)
    .single()

  const canPin = membership?.role === 'admin' || membership?.role === 'moderator'
  if (!canPin) redirect(`/c/${communitySlug}`)

  if (!post.is_pinned) {
    // Unpin any currently pinned post in this community first
    await supabase
      .from('posts')
      .update({ is_pinned: false })
      .eq('community_id', post.community_id)
      .eq('is_pinned', true)
  }

  await supabase
    .from('posts')
    .update({ is_pinned: !post.is_pinned })
    .eq('id', postId)

  revalidatePath(`/c/${communitySlug}`)
  redirect(`/c/${communitySlug}`)
}
