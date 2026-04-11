import { signInWithEmail, signInWithGoogle } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  searchParams: { error?: string }
}

export default function LoginPage({ searchParams }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
      <h2 className="mb-6 text-xl font-semibold text-white">Sign in</h2>

      {searchParams.error && (
        <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}

      <form action={signInWithEmail} className="flex flex-col gap-4">
        <Input name="email" type="email" label="Email" required placeholder="you@example.com" />
        <Input name="password" type="password" label="Password" required placeholder="••••••••" />
        <Button type="submit" className="w-full">Sign in</Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <hr className="flex-1 border-zinc-700" />
        <span className="text-xs text-zinc-500">or</span>
        <hr className="flex-1 border-zinc-700" />
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="secondary" className="w-full">
          Continue with Google
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        No account?{' '}
        <Link href="/register" className="text-indigo-400 hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
