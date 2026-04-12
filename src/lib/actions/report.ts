'use server'

import { createClient } from '@/lib/supabase/server'

export async function createReport(
  targetId: string,
  targetType: 'post' | 'comment',
  reason: string
): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to report' }

  const trimmed = reason.trim()
  if (!trimmed) return { error: 'Reason is required' }
  if (trimmed.length > 500) return { error: 'Reason must be under 500 characters' }

  const { error } = await supabase
    .from('reports')
    .insert({ reporter_id: user.id, target_id: targetId, target_type: targetType, reason: trimmed })

  if (error) return { error: error.message }
  return null
}

export async function resolveReport(reportId: string): Promise<{ error: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('reports')
    .update({ resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq('id', reportId)

  if (error) return { error: error.message }
  return null
}
