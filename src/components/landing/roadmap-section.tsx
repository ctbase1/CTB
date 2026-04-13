import { CheckCircle2, Circle, Clock } from 'lucide-react'

type Status = 'live' | 'in-progress' | 'planned'

const milestones: { title: string; description: string; status: Status }[] = [
  {
    title: 'Community Platform',
    description: 'Posts, comments, communities, follows, notifications, moderation, admin dashboard — live and running.',
    status: 'live',
  },
  {
    title: 'Token Discussions',
    description: 'Dedicated token community pages with price context and flair system for project discussions.',
    status: 'in-progress',
  },
  {
    title: 'CTB Screener',
    description: 'Replace DEX Screener. On-chain data embedded directly into community context — charts, volume, and discussion in one place.',
    status: 'planned',
  },
  {
    title: 'Verified Token Badges',
    description: 'Credibility layer for legitimate projects. Community-driven verification with transparent criteria.',
    status: 'planned',
  },
  {
    title: 'Full Crypto Tools',
    description: 'Portfolio tracker, whale wallet follows, custom token alerts, and on-chain analytics — all inside CTB.',
    status: 'planned',
  },
  {
    title: 'Mobile App',
    description: 'iOS and Android native app with push notifications, fast feed, and full community access.',
    status: 'planned',
  },
]

const statusConfig: Record<Status, { label: string; dotClass: string; labelClass: string; icon: typeof CheckCircle2 }> = {
  live: {
    label: 'Live',
    dotClass: 'bg-violet-500 shadow-glow-violet-sm',
    labelClass: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
    icon: CheckCircle2,
  },
  'in-progress': {
    label: 'In Progress',
    dotClass: 'bg-amber-400',
    labelClass: 'bg-amber-400/10 text-amber-400 border border-amber-400/30',
    icon: Clock,
  },
  planned: {
    label: 'Planned',
    dotClass: 'bg-slate-600',
    labelClass: 'bg-[var(--surface-raised)] text-[var(--muted-foreground)] border border-[var(--border)]',
    icon: Circle,
  },
}

export function RoadmapSection() {
  return (
    <section className="px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl md:text-4xl">
            Roadmap
          </h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Where we&apos;re headed — with your support, this is what CTB becomes.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--border)]" aria-hidden />

          <div className="space-y-8">
            {milestones.map(({ title, description, status }) => {
              const cfg = statusConfig[status]
              const Icon = cfg.icon
              return (
                <div key={title} className="relative flex gap-6 pl-14">
                  {/* Dot */}
                  <div
                    className={`absolute left-3.5 top-1 h-3 w-3 rounded-full ring-4 ring-[var(--background)] ${cfg.dotClass}`}
                    aria-hidden
                  />
                  <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.labelClass}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
