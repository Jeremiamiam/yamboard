/**
 * Journal d'activité client — log des actions (email, chat, manuel).
 * Utilisé par webhook, chat route, et actions manuelles.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type ActivityActionType =
  | 'email_summary'
  | 'contact_added'
  | 'note_added'
  | 'link_added'
  | 'project_created'
  | 'product_added'
  | 'client_created'
  | 'document_uploaded'

export type ActivitySource = 'email' | 'chat' | 'manual'

export type LogActivityParams = {
  clientId: string
  projectId?: string
  actionType: ActivityActionType
  source: ActivitySource
  summary: string
  metadata?: Record<string, unknown>
  ownerId: string
}

export async function insertClientActivity(
  supabase: SupabaseClient,
  params: LogActivityParams
): Promise<void> {
  const { error } = await supabase.from('client_activity_logs').insert({
    client_id: params.clientId,
    project_id: params.projectId ?? null,
    action_type: params.actionType,
    source: params.source,
    summary: params.summary,
    metadata: params.metadata ?? null,
    owner_id: params.ownerId,
  })
  if (error) {
    console.error('[activity-log] Insert failed:', error)
  }
}
