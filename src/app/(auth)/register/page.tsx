import { signUp } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  searchParams: { error?: string }
}

export default function RegisterPage({ searchParams }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
      <h2 className="mb-6 text-xl font-semibold text-white">Create account</h2>

      {searchParams.error && (
        <p className="mb-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-400">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}

      <form action={signUp} className="flex flex-col gap-4">
        <Input
          name="username"
          label="Username"
          required
          placeholder="satoshi"
          pattern="[a-z0-9_]{3,20}"
          title="3-20 characters: letters, numbers, underscores"
        />
        <Input name="email" type="email" label="Email" required placeholder="you@example.com" />
        <Input name="password" type="password" label="Password" required placeholder="••••••••" minLength={8} />
        <Button type="submit" className="w-full">Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
