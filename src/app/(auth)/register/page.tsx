import { signUp, resendConfirmation } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  searchParams: { error?: string; verify?: string; email?: string; resent?: string }
}

export default function RegisterPage({ searchParams }: Props) {
  if (searchParams.verify === '1') {
    const email = searchParams.email ? decodeURIComponent(searchParams.email) : ''
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900 p-8 shadow-glow-violet-sm text-center">
        <div className="mb-4 text-4xl">📬</div>
        <h2 className="mb-2 text-xl font-semibold text-white">Check your email</h2>
        <p className="mb-1 text-sm text-slate-400">
          We sent a confirmation link to
        </p>
        <p className="mb-6 text-sm font-medium text-violet-400 break-all">{email}</p>
        <p className="mb-6 text-sm text-slate-400">
          Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
        </p>

        {searchParams.resent === '1' && (
          <p className="mb-4 rounded-xl border border-green-900/50 bg-green-950/30 px-4 py-2 text-sm text-green-400">
            Confirmation email resent.
          </p>
        )}

        <form action={resendConfirmation}>
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="secondary" className="w-full">
            Resend confirmation email
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Wrong email?{' '}
          <Link href="/register" className="text-violet-400 hover:underline">
            Start over
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900 p-8 shadow-glow-violet-sm">
      <h2 className="mb-6 text-xl font-semibold text-white">Create account</h2>

      {searchParams.error && (
        <p className="mb-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}

      <form action={signUp} className="flex flex-col gap-4">
        <Input
          name="username"
          label="Username"
          required
          placeholder="satoshi"
          pattern="[a-zA-Z0-9_]{3,20}"
          title="3-20 characters: letters, numbers, underscores"
        />
        <Input name="email" type="email" label="Email" required placeholder="you@example.com" />
        <Input name="password" type="password" label="Password" required placeholder="••••••••" minLength={8} />
        <Button type="submit" className="w-full mt-1">Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Have an account?{' '}
        <Link href="/login" className="text-violet-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
