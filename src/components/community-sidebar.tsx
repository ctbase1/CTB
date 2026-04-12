interface Rule {
  title: string
  body: string
}

interface Props {
  rules: Rule[]
}

export function CommunitySidebar({ rules }: Props) {
  if (rules.length === 0) return null

  return (
    <aside className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-200">Community Rules</h2>
      <ol className="space-y-3">
        {rules.map((rule, i) => (
          <li key={i} className="text-sm">
            <p className="font-medium text-zinc-300">
              {i + 1}. {rule.title}
            </p>
            {rule.body && (
              <p className="mt-0.5 text-xs text-zinc-500">{rule.body}</p>
            )}
          </li>
        ))}
      </ol>
    </aside>
  )
}
