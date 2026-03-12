'use server'

import 'server-only'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { Message } from '@/lib/types'

export type ConversationMeta = {
  id: string
  title: string
  date: string
  messageCount: number
}

/** Liste des conversations pour un scope (client ou projet). */
export async function getConversations(params: {
  clientId: string
  projectId?: string
}): Promise<ConversationMeta[]> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return []

  let query = supabase
    .from('conversations')
    .select('id, title, created_at')
    .eq('client_id', params.clientId)
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  if (params.projectId) {
    query = query.eq('project_id', params.projectId)
  } else {
    query = query.is('project_id', null)
  }

  const { data: rows, error } = await query
  if (error) return []

  // Compter les messages par conversation
  const withCount: ConversationMeta[] = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', row.id)
      return {
        id: row.id,
        title: row.title || 'Nouvelle conversation',
        date: new Date(row.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        messageCount: count ?? 0,
      }
    })
  )

  return withCount
}

/** Messages d'une conversation. */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return []

  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('owner_id', user.id)
    .single()

  if (!conv) return []

  const { data: rows } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return (rows ?? []).map((r) => ({
    id: r.id,
    role: r.role as 'user' | 'assistant',
    content: r.content,
    timestamp: new Date(r.created_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }))
}

/** Crée une conversation et la retourne. */
export async function createConversation(params: {
  clientId: string
  projectId?: string
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      client_id: params.clientId,
      project_id: params.projectId ?? null,
      title: 'Nouvelle conversation',
      owner_id: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data.id }
}

/** Supprime une conversation (et ses messages en cascade). */
export async function deleteConversation(conversationId: string): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('owner_id', user.id)

  return { error: error?.message ?? null }
}

/** Sauvegarde les messages d'une conversation. Met à jour le titre si premier message. */
export async function saveMessages(
  conversationId: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: conv, error: fetchErr } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('owner_id', user.id)
    .single()

  if (fetchErr || !conv) return { error: 'Conversation not found' }

  // Supprimer les anciens messages et réinsérer (upsert plus complexe)
  await supabase.from('chat_messages').delete().eq('conversation_id', conversationId)

  if (messages.length > 0) {
    const toInsert = messages.map((m) => ({
      conversation_id: conversationId,
      role: m.role,
      content: m.content,
    }))
    const { error: insertErr } = await supabase.from('chat_messages').insert(toInsert)
    if (insertErr) return { error: insertErr.message }

    // Mettre à jour le titre si c'est encore "Nouvelle conversation"
    const firstUser = messages.find((m) => m.role === 'user')
    if (firstUser) {
      const title = firstUser.content.slice(0, 50).trim() || 'Nouvelle conversation'
      await supabase
        .from('conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('owner_id', user.id)
    }
  }

  return { error: null }
}
