interface Rule {
  title: string
  body: string
}

interface Props {
  rules: Rule[]
  description?: string | null
  memberCount?: number
  createdAt?: string
}

export function CommunitySidebar({ rules, description, memberCount, createdAt }: Props) {
  return (
    <div className="space-y-3">
      {/* About card */}
      {(description || memberCount !== undefined) && (
        <aside className="rounded-2xl border border-slate-700/50 bg-slate-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">About</h2>
          {description && (
            <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
          )}
          {memberCount !== undefined && (
            <p className="mt-2 text-sm text-slate-400">
              <span className="font-semibold text-white">{memberCount.toLocaleString()}</span>{' '}
              {memberCount === 1 ? 'member' : 'members'}
            </p>
          )}
          {createdAt && (
            <p className="mt-1 text-xs text-slate-600">
              Created {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </aside>
      )}

      {/* Rules card */}
      {rules.length > 0 && (
        <aside className="rounded-2xl border border-slate-700/50 bg-slate-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Community Rules</h2>
          <ol className="space-y-3">
            {rules.map((rule, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-900/40 text-[11px] font-medium text-violet-300">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-300">{rule.title}</p>
                  {rule.body && (
                    <p className="mt-0.5 text-xs text-slate-500">{rule.body}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      )}
    </div>
  )
}
