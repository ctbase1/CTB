import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { resolveReport } from '@/lib/actions/report'
import Link from 'next/link'

export default async function AdminReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) notFound()

  // Use service role to bypass reports_select_own RLS — admins must see all reports
  const { data: openReports } = await createAdminClient()
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username)')
    .is('resolved_at', null)
    .order('created_at', { ascending: false })

  const reports = openReports ?? []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Open Reports</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/users" className="text-sm text-slate-400 hover:text-white">
            Users →
          </Link>
          <Link href="/admin/communities" className="text-sm text-slate-400 hover:text-white">
            Communities →
          </Link>
          <Link href="/admin/audit-logs" className="text-sm text-slate-400 hover:text-white">
            Audit Log →
          </Link>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[var(--surface)] py-16 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No open reports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => {
            const reporter = report.reporter as { username: string } | null
            return (
              <div key={report.id} className="rounded-xl border border-slate-800 bg-[var(--surface)] p-4">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {reporter?.username ? (
                        <a href={`/u/${reporter.username}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">{reporter.username}</a>
                      ) : (
                        <span className="font-medium text-[var(--foreground)]">unknown</span>
                      )}
                      {' '}reported a{' '}
                      <span className="font-medium text-[var(--foreground)]">{report.target_type}</span>
                      {' · '}
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-[var(--foreground)]">{report.reason}</p>
                    <p className="font-mono text-xs text-slate-600">target: {report.target_id}</p>
                  </div>
                  <form
                    action={async () => {
                      'use server'
                      await resolveReport(report.id)
                    }}
                  >
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:border-green-600 hover:text-green-400"
                    >
                      Resolve
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
