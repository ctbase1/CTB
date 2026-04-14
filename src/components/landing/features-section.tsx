import { Users, Megaphone, Rss, Shield, TrendingUp, Zap } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Community-Owned Spaces',
    body: 'Create or join topic communities. Admins set their own rules. No corporate overlords, no algorithmic demotion.',
  },
  {
    icon: Megaphone,
    title: 'Free Speech, For Real',
    body: 'No shadow bans. No suppression. Content is only removed for illegal material — not because it disrupts a narrative.',
  },
  {
    icon: Rss,
    title: 'Chronological Feed',
    body: "Follow users and communities. Your feed is in order of time — not optimized for engagement farming or ad revenue.",
  },
  {
    icon: Shield,
    title: 'Transparent Moderation',
    body: 'Community admins moderate with clear rules. Reporting flows are visible. No mysterious bans from invisible moderation queues.',
  },
  {
    icon: TrendingUp,
    title: 'Token Discussions',
    body: 'Dedicated spaces for every token. Flairs, link previews, on-chain discussion — verified projects coming soon.',
  },
  {
    icon: Zap,
    title: 'Crypto-Native Features',
    body: 'Markdown posts, image uploads, link previews, post flair, notifications — everything you need, nothing you don\'t.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[var(--surface)] px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl md:text-4xl">
            Built for how crypto people actually communicate
          </h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            All the tools. None of the censorship.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 transition-all hover:border-blue-500/40 hover:shadow-glow-violet-sm"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Icon className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">{title}</h3>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
