import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditAction =
  | 'ban_user'
  | 'unban_user'
  | 'community_ban'
  | 'community_unban'
  | 'delete_post'
  | 'delete_comment'
  | 'resolve_report'
  | 'assign_mod'
  | 'remove_mod'

interface AuditParams {
  actorId: string
  action: AuditAction
  targetType: string
  targetId?: string
  communityId?: string
  metadata?: Record<string, unknown>
}

/**
 * Append-only audit log entry. Failures are swallowed so they never
 * block the primary operation.
 */
export async function createAuditLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  params: AuditParams
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      actor_id:    params.actorId,
      action:      params.action,
      target_type: params.targetType,
      target_id:   params.targetId ?? null,
      community_id: params.communityId ?? null,
      metadata:    params.metadata ?? {},
    })
  } catch {
    // Non-critical — never block the calling operation
  }
}
