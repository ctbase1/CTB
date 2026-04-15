import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { resendConfirmationByEmail } from './actions'
import { VerifyPoller } from '../register/verify-poller'


interface Props {
  searchParams: { email?: string; resent?: string }
}

export default function VerifyEmailPage({ searchParams }: Props) {
  const email = searchParams.email ? decodeURIComponent(searchParams.email) : ''

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900 p-8 shadow-glow-violet-sm text-center">
      <VerifyPoller />
      <div className="mb-4 text-4xl">📬</div>
      <h2 className="mb-2 text-xl font-semibold text-white">Confirm your email</h2>
      <p className="mb-6 text-sm text-slate-400">
        Your email address needs to be confirmed before you can access the site.
        Check your inbox for the confirmation link we sent you.
      </p>

      {searchParams.resent === '1' && (
        <p className="mb-4 rounded-xl border border-green-900/50 bg-green-950/30 px-4 py-2 text-sm text-green-400">
          Confirmation email resent.
        </p>
      )}

      {email && (
        <form action={resendConfirmationByEmail} className="mb-4">
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="secondary" className="w-full">
            Resend confirmation email
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-slate-400">
        <Link href="/login" className="text-violet-400 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
