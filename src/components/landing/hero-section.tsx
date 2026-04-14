import Link from 'next/link'
import { ArrowRight, Shield } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="bg-hero-glow relative flex min-h-[88vh] flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
      {/* Badge */}
      <div className="mb-8 inline-flex max-w-xs flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-[var(--accent)] sm:max-w-none sm:rounded-full sm:flex-nowrap sm:gap-2">
        <Shield className="h-3.5 w-3.5 shrink-0" />
        <span>Free speech. No shadow bans. No corporate censorship.</span>
      </div>

      {/* Headline */}
      <h1 className="text-balance mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-7xl">
        The Crypto Community{' '}
        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          They Can&apos;t Silence
        </span>
      </h1>

      {/* Subheadline */}
      <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] sm:mt-6 sm:text-xl">
        X is banning crypto accounts and removing community features.
        CTB is the free-speech, community-owned alternative — built by degens, for degens.
        Discuss any token, any narrative, any time.
      </p>

      {/* CTAs */}
      <div className="mt-8 flex w-full flex-col items-center gap-3 px-2 sm:mt-10 sm:w-auto sm:flex-row sm:gap-4 sm:px-0">
        <Link
          href="/register"
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-7 py-3.5 text-base font-semibold text-white shadow-glow-violet transition-all hover:bg-[var(--accent-hover)] hover:shadow-glow-violet-md sm:w-auto"
        >
          Join CTB Free
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <a
          href="#features"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] px-7 py-3.5 text-base font-medium text-[var(--muted-foreground)] transition-colors hover:border-blue-500/50 hover:text-[var(--foreground)] sm:w-auto"
        >
          Explore Features
        </a>
      </div>

      {/* Social proof */}
      <p className="mt-8 text-xs tracking-wide uppercase text-[var(--muted)] sm:mt-10">
        Community-owned · No algorithms · Chronological feed
      </p>

      {/* Glow orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"
      />
    </section>
  )
}
