export const metadata = { title: 'Community Guidelines — CTB' }

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold text-[var(--accent)]">Community Guidelines</h1>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">Last updated: April 13, 2026</p>
        <p className="mb-10 text-sm text-[var(--muted-foreground)]">
          CTB is built for the Solana community — degens, builders, traders, and everyone in between.
          Keep it real, keep it respectful. These rules exist so the community stays useful and the signal stays high.
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--foreground)]">

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">1. No Financial Manipulation</h2>
            <p>Do not coordinate pump-and-dump schemes, wash trading, or any form of market manipulation. Sharing your genuine opinion on a token is fine — organizing others to move a market is not. This includes private signals disguised as community posts.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">2. Label Opinion as Opinion</h2>
            <p>When you post about a token or trade, make it clear you are sharing your personal view, not financial advice. Use phrases like &ldquo;in my opinion&rdquo;, &ldquo;I think&rdquo;, or &ldquo;NFA&rdquo; (not financial advice). Do not present speculation as fact.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">3. No Doxxing</h2>
            <p>Never post private or identifying information about another person without their consent. This includes real names, addresses, phone numbers, social profiles, or any information that could be used to identify or harm someone offline.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">4. No Scam or Rug Pull Promotion</h2>
            <p>Do not shill projects you know to be scams or rug pulls. Do not create fake hype for projects you or associates control. If you suspect a project is a scam, use the report button rather than spreading FUD — let the mods investigate.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">5. No Harassment or Hate Speech</h2>
            <p>Personal attacks, threats, slurs, and hate speech based on race, gender, sexuality, nationality, religion, or disability are not allowed. Disagreement is fine — being a dick about it is not. Critique ideas, not people.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">6. No Spam</h2>
            <p>Do not post the same content repeatedly, flood communities with low-effort posts, or use the Platform to mass-advertise products or services. Referral links must be clearly disclosed. One mention of your project per relevant community per week is acceptable.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">7. Moderation and Appeals</h2>
            <p className="mb-2">Community moderators have the authority to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Remove posts or comments that violate these guidelines</li>
              <li>Issue temporary bans (1 hour to 30 days) or permanent bans from a community</li>
              <li>Report content to platform administrators for review</li>
            </ul>
            <p className="mt-2">If you believe a moderation action was taken in error, you can contact the community admin directly via their profile. Platform-level bans are final and may be appealed by contacting CTB support.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">8. Reporting</h2>
            <p>Use the report button on any post or comment that violates these guidelines. Reports are reviewed by community moderators and platform administrators. False or malicious reporting may result in action against the reporting account.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">9. Content Removal</h2>
            <p>Removed content is soft-deleted and hidden from public view. Platform administrators retain access to removed content for moderation audit purposes. Repeat violations escalate from community ban to platform ban.</p>
          </section>

        </div>

        <div className="mt-12 flex gap-4 text-xs text-[var(--muted)]">
          <a href="/terms" className="hover:text-[var(--foreground)] transition-colors">Terms & Conditions</a>
          <a href="/privacy" className="hover:text-[var(--foreground)] transition-colors">Privacy Policy</a>
          <a href="/" className="hover:text-[var(--foreground)] transition-colors">Back to CTB</a>
        </div>
      </div>
    </div>
  )
}
