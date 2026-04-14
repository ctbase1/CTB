import Link from 'next/link'

interface CommunityTabsProps {
  slug: string
  currentTab: 'posts' | 'about'
}

export function CommunityTabs({ slug, currentTab }: CommunityTabsProps) {
  const tabClass = (tab: 'posts' | 'about') =>
    `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      currentTab === tab
        ? 'border-[var(--accent)] text-[var(--accent)]'
        : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]'
    }`

  return (
    <div className="flex border-b border-[var(--border)] mt-6">
      <Link href={`/c/${slug}`} className={tabClass('posts')}>
        Posts
      </Link>
      <Link href={`/c/${slug}?tab=about`} className={tabClass('about')}>
        About &amp; Rules
      </Link>
    </div>
  )
}
