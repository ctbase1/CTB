import { signInWithEmail } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  searchParams: { error?: string }
}

export default function LoginPage({ searchParams }: Props) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900 p-8 shadow-glow-violet-sm">
      <h2 className="mb-6 text-xl font-semibold text-white">Sign in</h2>

      {searchParams.error && (
        <p className="mb-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}

      <form action={signInWithEmail} className="flex flex-col gap-4">
        <Input name="email" type="email" label="Email" required placeholder="you@example.com" />
        <Input name="password" type="password" label="Password" required placeholder="••••••••" />
        <Button type="submit" className="w-full mt-1">Sign in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        No account?{' '}
        <Link href="/register" className="text-violet-400 hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
