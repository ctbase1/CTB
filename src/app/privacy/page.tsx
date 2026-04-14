export const metadata = { title: 'Privacy Policy — CTB' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold text-[var(--accent)]">Privacy Policy</h1>
        <p className="mb-10 text-sm text-[var(--muted-foreground)]">Last updated: April 13, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--foreground)]">

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">1. Information We Collect</h2>
            <p className="mb-2">We collect the following information when you use CTB:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> email address, username, password (hashed, never stored in plaintext)</li>
              <li><strong>Profile data:</strong> avatar image, bio (optional, provided by you)</li>
              <li><strong>Usage data:</strong> IP address, browser type, pages visited, actions taken on the Platform</li>
              <li><strong>Content:</strong> posts, comments, and other content you create</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and operate the Platform</li>
              <li>To authenticate your account and ensure security</li>
              <li>To send notifications you have opted into</li>
              <li>To enforce our Terms and Community Guidelines</li>
              <li>To improve the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">3. Data Processors</h2>
            <p className="mb-2">We use the following third-party services to operate CTB:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — database and authentication (your data is stored on Supabase-managed infrastructure)</li>
              <li><strong>Cloudinary</strong> — image hosting and storage for avatars and post images</li>
              <li><strong>Netlify</strong> — web hosting and deployment</li>
            </ul>
            <p className="mt-2">Each processor handles your data in accordance with their own privacy policies and applicable law.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">4. Data Sharing</h2>
            <p>We do not sell, rent, or share your personal data with third parties for marketing purposes. We may share data with law enforcement if required by law or to protect the rights and safety of users.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">5. Cookies</h2>
            <p>We use session cookies to keep you logged in. We do not use tracking cookies or third-party advertising cookies. You can disable cookies in your browser, but this will prevent you from logging in.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">6. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. Content you post may persist after account deletion for platform integrity reasons. Audit logs are retained for a minimum of 90 days.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">7. Your Rights (GDPR / CCPA)</h2>
            <p className="mb-2">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Object to certain processing of your data</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">8. Security</h2>
            <p>We implement industry-standard security measures including encrypted data transmission (HTTPS), hashed passwords, and row-level security on our database. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">9. Children</h2>
            <p>CTB is not intended for users under 18 years of age. We do not knowingly collect data from anyone under 18. If we discover we have collected data from a minor, we will delete it promptly.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes via email or a prominent notice on the Platform.</p>
          </section>

        </div>

        <div className="mt-12 flex gap-4 text-xs text-[var(--muted)]">
          <a href="/terms" className="hover:text-[var(--foreground)] transition-colors">Terms & Conditions</a>
          <a href="/guidelines" className="hover:text-[var(--foreground)] transition-colors">Community Guidelines</a>
          <a href="/" className="hover:text-[var(--foreground)] transition-colors">Back to CTB</a>
        </div>
      </div>
    </div>
  )
}
