import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type ConversationForContext = {
  id: string
  title: string
  updatedAt: string
  messageCount: number
  lastPreview?: string // premier message user ou dernier échange (tronqué)
}

/** Conversations d'un scope pour le contexte chat (server-only, RLS via owner). */
export async function getConversationsForContext(params: {
  clientId: string
  projectId?: string
  limit?: number
}): Promise<ConversationForContext[]> {
  const supabase = await createClient()

  let query = supabase
    .from('conversations')
    .select('id, title, updated_at')
    .eq('client_id', params.clientId)
    .order('updated_at', { ascending: false })
    .limit(params.limit ?? 15)

  if (params.projectId) {
    query = query.eq('project_id', params.projectId)
  } else {
    query = query.is('project_id', null)
  }

  const { data: rows, error } = await query
  if (error) return []

  const result: ConversationForContext[] = []

  for (const row of rows ?? []) {
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', row.id)

    // Aperçu : dernier message user ou assistant (tronqué à 80 chars)
    const { data: lastMsg } = await supabase
      .from('chat_messages')
      .select('content')
      .eq('conversation_id', row.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const lastPreview = lastMsg?.content
      ? lastMsg.content.slice(0, 80).trim() + (lastMsg.content.length > 80 ? '…' : '')
      : undefined

    result.push({
      id: row.id,
      title: row.title || 'Nouvelle conversation',
      updatedAt: new Date(row.updated_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      messageCount: count ?? 0,
      lastPreview,
    })
  }

  return result
}
