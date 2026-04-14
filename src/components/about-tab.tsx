import { PLATFORM_RULES } from '@/lib/platform-rules'
import { FlairPicker } from './flair-picker'

interface Rule {
  title: string
  body: string
}

interface Props {
  rules: Rule[]
  description?: string | null
  memberCount?: number
  createdAt?: string
  communityId?: string
  userId?: string | null
  userFlair?: string | null
  isMember?: boolean
}

export function AboutTab({ rules, description, memberCount, createdAt, communityId, userId, userFlair, isMember }: Props) {
  return (
    <div className="space-y-4 py-6">
      {/* About card */}
      {(description || memberCount !== undefined) && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">About</h2>
          {description && (
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{description}</p>
          )}
          {memberCount !== undefined && (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              <span className="font-semibold text-[var(--foreground)]">{memberCount.toLocaleString()}</span>{' '}
              {memberCount === 1 ? 'member' : 'members'}
            </p>
          )}
          {createdAt && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Created {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
          {isMember && communityId && userId && (
            <FlairPicker communityId={communityId} currentFlair={userFlair ?? null} />
          )}
        </section>
      )}

      {/* Platform rules */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">Platform Rules</h2>
        <p className="mb-3 text-xs text-[var(--muted-foreground)]">Applies to all communities</p>
        <ol className="space-y-3">
          {PLATFORM_RULES.map((rule, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[11px] font-medium text-[var(--muted-foreground)]">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-[var(--foreground)]">{rule.title}</p>
                {rule.body && (
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{rule.body}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Community-specific rules */}
      {rules.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Community Rules</h2>
          <ol className="space-y-3">
            {rules.map((rule, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-900/40 text-[11px] font-medium text-blue-300">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-[var(--foreground)]">{rule.title}</p>
                  {rule.body && (
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{rule.body}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
