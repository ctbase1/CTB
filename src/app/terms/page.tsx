export const metadata = { title: 'Terms & Conditions — CTB' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold text-[var(--accent)]">Terms & Conditions</h1>
        <p className="mb-10 text-sm text-[var(--muted-foreground)]">Last updated: April 13, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--foreground)]">

          <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-5 py-4">
            <p className="font-bold text-red-400 uppercase tracking-wide text-xs mb-1">Important Disclaimer</p>
            <p className="text-red-300 font-medium">
              NOTHING ON THIS PLATFORM CONSTITUTES FINANCIAL ADVICE. All content is user-generated opinion and discussion only.
              CTB is not a registered financial advisor, broker, or investment service.
              You are solely responsible for your own financial decisions. Crypto is extremely high risk — you can lose everything.
            </p>
          </div>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">1. Acceptance of Terms</h2>
            <p>By accessing or using CTB (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms &amp; Conditions. If you do not agree, do not use the Platform.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">2. Eligibility</h2>
            <p>You must be at least 18 years old to use this Platform. By registering, you represent that you are 18 or older.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">3. User-Generated Content</h2>
            <p>You are solely responsible for any content you post. CTB does not endorse, verify, or take responsibility for any user-generated content. By posting content, you grant CTB a non-exclusive, royalty-free license to display that content on the Platform.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">4. No Financial Advice</h2>
            <p>All posts, comments, and discussions on CTB are user opinions only and do not constitute financial, investment, legal, or tax advice. Nothing on this Platform should be relied upon for making financial decisions. Past performance of any asset discussed is not indicative of future results. Always do your own research (DYOR).</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">5. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, CTB and its operators shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to financial losses resulting from content posted by other users.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">6. Prohibited Conduct</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Coordinate pump-and-dump schemes or market manipulation</li>
              <li>Post content that violates applicable laws</li>
              <li>Harass, threaten, or doxx other users</li>
              <li>Promote scams, rug pulls, or fraudulent projects</li>
              <li>Spam or post unsolicited commercial content</li>
              <li>Impersonate other users or entities</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">7. Account Suspension and Termination</h2>
            <p>CTB reserves the right to suspend, ban, or terminate any account at any time, with or without notice, for any reason including but not limited to violation of these Terms or Community Guidelines.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">8. DMCA / Copyright</h2>
            <p>If you believe content on the Platform infringes your copyright, please contact us with: (a) identification of the work claimed to be infringed, (b) the URL of the infringing content, and (c) your contact information. We will investigate and remove infringing content promptly.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">9. Dispute Resolution</h2>
            <p>Any disputes arising from your use of the Platform shall be resolved by binding individual arbitration. You waive any right to participate in class action lawsuits or class-wide arbitration.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">10. Governing Law</h2>
            <p>These Terms are governed by and construed in accordance with the laws of Delaware, United States, without regard to conflict of law principles.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">11. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated Terms.</p>
          </section>

        </div>

        <div className="mt-12 flex gap-4 text-xs text-[var(--muted)]">
          <a href="/privacy" className="hover:text-[var(--foreground)] transition-colors">Privacy Policy</a>
          <a href="/guidelines" className="hover:text-[var(--foreground)] transition-colors">Community Guidelines</a>
          <a href="/" className="hover:text-[var(--foreground)] transition-colors">Back to CTB</a>
        </div>
      </div>
    </div>
  )
}
