import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CtaSection() {
  return (
    <section className="bg-[var(--surface)] px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        {/* Decorative line */}
        <div className="mx-auto mb-8 h-px w-24 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

        <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl md:text-4xl">
          Ready to join the community?
        </h2>
        <p className="mt-4 text-lg text-[var(--muted-foreground)]">
          No bans. No algorithms. Just crypto.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 px-2 sm:mt-10 sm:w-auto sm:flex-row sm:justify-center sm:px-0">
          <Link
            href="/register"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3.5 text-base font-semibold text-white shadow-glow-violet transition-all hover:bg-[var(--accent-hover)] hover:shadow-glow-violet-md sm:w-auto"
          >
            Create Account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] px-8 py-3.5 text-base font-medium text-[var(--muted-foreground)] transition-colors hover:border-blue-500/50 hover:text-[var(--foreground)] sm:w-auto"
          >
            Sign In
          </Link>
        </div>

        <p className="mt-8 text-xs text-[var(--muted)]">
          Free forever. No crypto required to participate.
        </p>
      </div>
    </section>
  )
}
