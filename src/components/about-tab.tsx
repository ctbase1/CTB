import Link from 'next/link'
import Image from 'next/image'
import { PLATFORM_RULES } from '@/lib/platform-rules'
import { FlairPicker } from './flair-picker'

interface Rule {
  title: string
  body: string
}

interface Member {
  role: string
  user_id: string
  profiles: { username: string; avatar_url: string | null } | null
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
  members?: Member[]
}

export function AboutTab({ rules, description, memberCount, createdAt, communityId, userId, userFlair, isMember, members = [] }: Props) {
  const admins = members.filter(m => m.role === 'admin')
  const mods   = members.filter(m => m.role === 'moderator')
  const regular = members.filter(m => m.role === 'member')

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

      {/* Members */}
      {members.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            Members
            <span className="ml-1.5 text-xs font-normal text-[var(--muted-foreground)]">({memberCount?.toLocaleString()})</span>
          </h2>

          {admins.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">Admin</p>
              <div className="space-y-2">
                {admins.map(m => (
                  <MemberRow key={m.user_id} member={m} badge="Admin" badgeClass="text-[var(--accent)] bg-[var(--surface-raised)] border border-[var(--border)]" />
                ))}
              </div>
            </div>
          )}

          {mods.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Moderators</p>
              <div className="space-y-2">
                {mods.map(m => (
                  <MemberRow key={m.user_id} member={m} badge="Mod" badgeClass="text-[var(--muted-foreground)] bg-[var(--surface-raised)] border border-[var(--border)]" />
                ))}
              </div>
            </div>
          )}

          {regular.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Members</p>
              <div className="space-y-2">
                {regular.map(m => (
                  <MemberRow key={m.user_id} member={m} />
                ))}
              </div>
            </div>
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
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[11px] font-medium text-[var(--accent)]">
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

function MemberRow({ member, badge, badgeClass }: { member: { user_id: string; profiles: { username: string; avatar_url: string | null } | null }; badge?: string; badgeClass?: string }) {
  const username = member.profiles?.username ?? 'unknown'
  const avatar   = member.profiles?.avatar_url

  return (
    <Link href={`/u/${username}`} className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-[var(--surface-raised)] transition-colors">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[var(--surface-raised)]">
        {avatar ? (
          <Image src={avatar} alt={username} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--muted-foreground)]">
            {username[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <span className="text-sm text-[var(--foreground)] font-medium">{username}</span>
      {badge && (
        <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass}`}>{badge}</span>
      )}
    </Link>
  )
}
