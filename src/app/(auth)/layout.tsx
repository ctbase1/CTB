export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-glow px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-violet-400">CBT</h1>
          <p className="mt-1 text-sm text-slate-500">Crypto community platform</p>
        </div>
        {children}
      </div>
    </div>
  )
}
