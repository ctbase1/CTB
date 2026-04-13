import { BanIcon, Users, BarChart2 } from 'lucide-react'

const problems = [
  {
    icon: BanIcon,
    title: 'Crypto Accounts Getting Banned',
    body: 'X (formerly Twitter) is removing crypto accounts without warning or appeal. Entire communities built over years are gone overnight — with no recourse.',
    accentLeft: 'border-l-red-500/50',
    iconColor: 'text-red-400',
  },
  {
    icon: Users,
    title: 'Communities Being Dismantled',
    body: 'The community tab on X was killed. Reddit mods control the narrative and remove inconvenient posts. Independent voices are being systematically silenced.',
    accentLeft: 'border-l-orange-500/50',
    iconColor: 'text-orange-400',
  },
  {
    icon: BarChart2,
    title: 'No Real Crypto Tools',
    body: "DEX Screener shows you charts but doesn't have community. Reddit has community but no on-chain data. You deserve both — integrated, without censorship.",
    accentLeft: 'border-l-amber-500/50',
    iconColor: 'text-amber-400',
  },
]

export function ProblemSection() {
  return (
    <section className="px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl md:text-4xl">
            The problem with every other platform
          </h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Crypto Twitter is dying. Reddit is corporatizing. You need somewhere built for this.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {problems.map(({ icon: Icon, title, body, accentLeft, iconColor }) => (
            <div
              key={title}
              className={`rounded-xl border border-[var(--border)] border-l-4 ${accentLeft} bg-[var(--surface)] p-6`}
            >
              <Icon className={`mb-4 h-6 w-6 ${iconColor}`} />
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">{title}</h3>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
