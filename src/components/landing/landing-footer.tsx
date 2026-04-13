import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)] px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold tracking-tight text-violet-500">CTB</span>
          <span className="text-xs text-[var(--muted)]">Not financial advice. DYOR.</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <Link href="/terms" className="transition-colors hover:text-[var(--foreground)]">
            Terms
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-[var(--foreground)]">
            Privacy
          </Link>
          <Link href="/guidelines" className="transition-colors hover:text-[var(--foreground)]">
            Guidelines
          </Link>
        </div>

        <p className="text-xs text-[var(--muted)]">
          &copy; {new Date().getFullYear()} CTB. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
